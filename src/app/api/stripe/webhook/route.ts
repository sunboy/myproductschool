import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { apiError } from '@/lib/api/error'
import { createAdminClient } from '@/lib/supabase/admin'
import { createStripeClient } from '@/lib/stripe/config'
import {
  invoicePeriodEnd,
  planLabelFromInterval,
} from '@/lib/stripe/invoice-helpers'
import {
  processAffiliateInvoicePaid,
  updateAffiliateAccountFromStripeAccount,
  upsertAffiliateReferralFromCheckoutSession,
} from '@/lib/stripe/affiliates'
import {
  sendCancellationConfirmedEmail,
  sendCancellationScheduledEmail,
  sendPaymentActionRequiredEmail,
  sendPaymentFailedEmail,
  sendPaymentReceiptEmail,
  sendPlanChangedEmail,
  sendSubscriptionReactivatedEmail,
  sendTrialEndingEmail,
} from '@/lib/email/transactional'
import { subscriptionEntitlesPlan, type SubscriptionEntitlementRow } from '@/lib/billing/entitlements'
import { isAnalyticsPlanId } from '@/lib/billing/plans'
import { captureServerImmediate } from '@/lib/posthog/server'
import { EVENT_UPGRADED } from '@/lib/posthog/events'
import {
  claimStripeEvent,
  completeStripeEvent,
  recordStripePaymentFailure,
  releaseStripeEvent,
  requireStripeDbResult,
} from '@/lib/stripe/webhook-processing'

function subscriptionPlanForStatus(status: Stripe.Subscription.Status): 'free' | 'pro' {
  return status === 'active' || status === 'trialing' || status === 'past_due' ? 'pro' : 'free'
}

function metadataAnalyticsPlan(metadata?: Stripe.Metadata | null) {
  const plan = metadata?.plan
  return isAnalyticsPlanId(plan) ? plan : null
}

function isProEntitlingPlan(plan: string | null | undefined) {
  return plan === 'pro' || isAnalyticsPlanId(plan)
}

async function otherProEntitlingSubscriptions(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  excludedSubscriptionId: string
) {
  const [profileResult, subscriptionsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('past_due_since')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('subscriptions')
      .select('stripe_subscription_id, plan, status, current_period_end, cancel_at_period_end')
      .eq('user_id', userId),
  ])

  const profileData = requireStripeDbResult(
    'load profile entitlement state',
    profileResult
  )
  const subscriptionData = requireStripeDbResult(
    'load sibling subscription entitlement state',
    subscriptionsResult
  )

  const subscriptions = (subscriptionData ?? []) as Array<
    SubscriptionEntitlementRow & { stripe_subscription_id?: string | null }
  >
  const pastDueSince = (profileData as { past_due_since?: string | null } | null)?.past_due_since

  return subscriptions
    .filter((subscription) => subscription.stripe_subscription_id !== excludedSubscriptionId)
    .filter((subscription) => subscriptionEntitlesPlan(
      subscription,
      isProEntitlingPlan,
      new Date(),
      pastDueSince
    ))
}

async function userHasOtherProEntitlingSubscription(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  excludedSubscriptionId: string
) {
  return (await otherProEntitlingSubscriptions(
    supabase,
    userId,
    excludedSubscriptionId
  )).length > 0
}

async function findUserIdForStripeObject(
  supabase: ReturnType<typeof createAdminClient>,
  input: {
    metadata?: Stripe.Metadata | null
    subscriptionId?: string | null
    customerId?: string | null
  }
) {
  if (input.metadata?.user_id) return input.metadata.user_id

  if (input.subscriptionId) {
    const data = requireStripeDbResult(
      'find subscription owner by Stripe subscription',
      await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', input.subscriptionId)
        .maybeSingle()
    )
    if (data?.user_id) return data.user_id as string
  }

  if (input.customerId) {
    const data = requireStripeDbResult(
      'find subscription owner by Stripe customer',
      await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', input.customerId)
        .maybeSingle()
    )
    if (data?.user_id) return data.user_id as string
  }

  return null
}

function unixToIso(value?: number | null) {
  return value ? new Date(value * 1000).toISOString() : null
}

function subscriptionFirstItem(subscription: Stripe.Subscription) {
  return subscription.items.data[0]
}

function subscriptionCustomerId(subscription: Stripe.Subscription) {
  return typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id
}

function invoiceCustomerId(invoice: Stripe.Invoice) {
  const value = invoice.customer
  return typeof value === 'string' ? value : value?.id ?? null
}

function checkoutCustomerId(session: Stripe.Checkout.Session) {
  const value = session.customer
  if (typeof value === 'string') return value
  return value && !value.deleted ? value.id : null
}

function checkoutSubscriptionId(session: Stripe.Checkout.Session) {
  const value = session.subscription
  return typeof value === 'string' ? value : value?.id ?? null
}

function checkoutInvoiceId(session: Stripe.Checkout.Session) {
  const value = session.invoice
  return typeof value === 'string' ? value : value?.id ?? null
}

function checkoutPlanLabel(session: Stripe.Checkout.Session) {
  return session.metadata?.plan === 'annual' || session.metadata?.plan === 'analytics_annual'
    ? planLabelFromInterval('year')
    : planLabelFromInterval('month')
}

function appReturnUrl(request: NextRequest, path = '/settings') {
  return new URL(path, process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin).toString()
}

function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const parent = invoice.parent
  if (!parent || parent.type !== 'subscription_details') return null
  const value = parent.subscription_details?.subscription
  return typeof value === 'string' ? value : value?.id ?? null
}

async function getInvoiceCustomerContact(
  stripe: Stripe,
  invoice: Stripe.Invoice,
  customerId: string | null
) {
  if (invoice.customer_email || invoice.customer_name || !customerId) {
    return {
      email: invoice.customer_email,
      name: invoice.customer_name,
    }
  }

  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return { email: null, name: null }

  return {
    email: customer.email,
    name: customer.name,
  }
}

export async function POST(req: NextRequest) {
  const { stripe, config: stripeRuntime } = createStripeClient()

  if (!stripe) {
    return NextResponse.json(
      {
        error: 'Stripe not configured',
        detail: stripeRuntime.error,
        mode: stripeRuntime.mode,
      },
      { status: 503 }
    )
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // A valid signature alone does not establish the endpoint's operating mode.
  // Reject a misrouted test/live event before recording it or changing access.
  if (event.livemode !== (stripeRuntime.mode === 'live')) {
    return NextResponse.json({ error: 'Stripe event mode mismatch' }, { status: 400 })
  }

  const supabase = createAdminClient()

  let claim
  try {
    claim = await claimStripeEvent(supabase, {
      id: event.id,
      type: event.type,
      payload: event as unknown as Record<string, unknown>,
    })
  } catch (error) {
    console.error('[stripe.webhook] event claim failed:', error)
    return apiError(503, 'stripe_event_claim_failed', 'Webhook processing is temporarily unavailable')
  }

  if (claim.status === 'processed') {
    return NextResponse.json({ received: true, duplicate: true })
  }
  if (claim.status === 'in_progress') {
    // Do not acknowledge an in-flight duplicate: the active worker may still
    // fail. A retryable response preserves delivery until one worker finishes.
    return apiError(409, 'stripe_event_in_progress', 'Webhook event is already processing')
  }

  const processingToken = claim.token
  const eventType = event.type as string

  try {
    switch (eventType) {

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id ?? session.metadata?.user_id
      if (!userId) break
      const invoiceId = checkoutInvoiceId(session)
      const invoice = invoiceId ? await stripe.invoices.retrieve(invoiceId) : null
      const analyticsPlan = metadataAnalyticsPlan(session.metadata)
      const profileUpdates: Record<string, unknown> = {
        plan: 'pro',
        pro_access: true,
        subscription_status: 'active',
        payment_failures: 0,
        past_due_since: null,
      }
      if (analyticsPlan) profileUpdates.cc_analytics_access = true

      requireStripeDbResult(
        'grant checkout profile entitlement',
        await supabase.from('profiles').update(profileUpdates).eq('id', userId)
      )

      requireStripeDbResult(
        'store checkout subscription entitlement',
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: checkoutCustomerId(session),
          stripe_subscription_id: checkoutSubscriptionId(session),
          plan: analyticsPlan ?? 'pro',
          status: 'active',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      )

      await upsertAffiliateReferralFromCheckoutSession(supabase, session)

      // PostHog: track successful upgrade (fire-and-forget, never throws)
      const upgradePlan = analyticsPlan ?? session.metadata?.plan ?? 'pro'
      const upgradeInterval = (session.metadata?.plan === 'annual' || session.metadata?.plan === 'analytics_annual') ? 'year' : 'month'
      void captureServerImmediate({
        distinctId: userId,
        event: EVENT_UPGRADED,
        properties: {
          plan: upgradePlan,
          interval: upgradeInterval,
          currency: session.currency ?? 'usd',
        },
      })

      await sendPaymentReceiptEmail(supabase, {
        dedupeKey: `${event.id}:payment_receipt`,
        userId,
        to: session.customer_details?.email ?? session.customer_email,
        name: session.customer_details?.name,
        planLabel: checkoutPlanLabel(session),
        amount: invoice?.amount_paid ?? session.amount_total,
        currency: invoice?.currency ?? session.currency,
        periodEnd: invoice ? invoicePeriodEnd(invoice) : null,
        url: invoice?.hosted_invoice_url ?? appReturnUrl(req),
      })

      break
    }

    // ── Subscription lifecycle (handles renewal, cancellation, etc.) ──────────
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const deliveredSubscription = event.data.object as Stripe.Subscription
      // Stripe does not guarantee event ordering. Resolve the resource's current
      // state before changing access so a delayed snapshot cannot win.
      const subscription = await stripe.subscriptions.retrieve(deliveredSubscription.id)
      // user_id comes from metadata (set by custom checkout) OR we look it up
      // from the subscriptions table by stripe_subscription_id / stripe_customer_id
      let userId = subscription.metadata?.user_id ?? deliveredSubscription.metadata?.user_id

      if (!userId) {
        // Buy Button path: look up via customer ID
        const data = requireStripeDbResult(
          'find subscription owner for lifecycle update',
          await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', subscriptionCustomerId(subscription))
            .single()
        )
        userId = data?.user_id
      }

      if (!userId) break

      const item = subscriptionFirstItem(subscription)
      const periodEnd = item?.current_period_end
      const interval = item?.plan?.interval ?? null
      const priceId = item?.price?.id ?? null
      const plan = subscriptionPlanForStatus(subscription.status)
      const analyticsPlan = metadataAnalyticsPlan(subscription.metadata)
      const analyticsRevoked = Boolean(analyticsPlan && plan === 'free')
      const hasOtherProEntitlingSubscription = analyticsRevoked
        ? await userHasOtherProEntitlingSubscription(supabase, userId, subscription.id)
        : false

      if (!(analyticsRevoked && hasOtherProEntitlingSubscription)) {
        requireStripeDbResult(
          'store canonical subscription lifecycle state',
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: subscriptionCustomerId(subscription),
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
            billing_interval: interval,
            plan: analyticsPlan ?? plan,
            // subscriptions.status does not accept 'unpaid' / 'incomplete_expired'.
            // Store analytics revocations as canceled so entitlement helpers do not grant grace.
            status: analyticsRevoked ? 'canceled' : subscription.status,
            current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            cancel_at_period_end: subscription.cancel_at_period_end ?? false,
            cancel_at: unixToIso(subscription.cancel_at),
            canceled_at: unixToIso(subscription.canceled_at),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
        )
      }

      // Sync profile entitlement flags so dashboards / dunning / entitlements
      // layer all see the same state.
      const profileUpdates: Record<string, unknown> = {}
      if (analyticsRevoked) {
        profileUpdates.cc_analytics_access = false
        profileUpdates.subscription_status = subscription.status
        if (!hasOtherProEntitlingSubscription) {
          profileUpdates.plan = 'free'
          profileUpdates.pro_access = false
        }
      } else {
        profileUpdates.plan = plan
        if (analyticsPlan) profileUpdates.cc_analytics_access = true
      }
      if (!analyticsRevoked && plan === 'pro' && (subscription.status === 'active' || subscription.status === 'trialing')) {
        profileUpdates.pro_access = true
        profileUpdates.subscription_status = 'active'
        profileUpdates.payment_failures = 0
        profileUpdates.past_due_since = null
      } else if (!analyticsRevoked && plan === 'free') {
        // Cancelled / incomplete_expired / etc → no Pro access.
        profileUpdates.pro_access = false
        profileUpdates.subscription_status = subscription.status
      } else if (!analyticsRevoked) {
        // plan === 'pro' but status is past_due → user is in the billing grace
        // window. Leave pro_access alone (they keep access for GRACE_DAYS). The
        // invoice.payment_failed handler owns past_due_since / payment_failures.
        // Final suspension happens when Stripe later transitions the subscription
        // to unpaid/canceled (handled by the plan === 'free' branch above).
        profileUpdates.subscription_status = subscription.status
      }
      requireStripeDbResult(
        'store canonical profile subscription state',
        await supabase.from('profiles').update(profileUpdates).eq('id', userId)
      )

      if (event.type === 'customer.subscription.updated') {
        const previous = event.data.previous_attributes as Partial<Stripe.Subscription> | undefined
        const previousPrice = previous?.items?.data?.[0]?.price?.id
        const currentPrice = priceId
        const deliveredPrice = subscriptionFirstItem(deliveredSubscription)?.price?.id ?? null
        const deliveredSnapshotIsCurrent =
          deliveredSubscription.status === subscription.status &&
          deliveredSubscription.cancel_at_period_end === subscription.cancel_at_period_end &&
          deliveredPrice === currentPrice

        if (deliveredSnapshotIsCurrent && previous?.cancel_at_period_end === false && subscription.cancel_at_period_end) {
          await sendCancellationScheduledEmail(supabase, {
            dedupeKey: `${event.id}:cancellation_scheduled`,
            userId,
            planLabel: planLabelFromInterval(interval),
            periodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          })
        } else if (deliveredSnapshotIsCurrent && previous?.cancel_at_period_end === true && !subscription.cancel_at_period_end) {
          await sendSubscriptionReactivatedEmail(supabase, {
            dedupeKey: `${event.id}:subscription_reactivated`,
            userId,
            planLabel: planLabelFromInterval(interval),
            periodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          })
        } else if (deliveredSnapshotIsCurrent && previousPrice && currentPrice && previousPrice !== currentPrice) {
          await sendPlanChangedEmail(supabase, {
            dedupeKey: `${event.id}:plan_changed`,
            userId,
            planLabel: planLabelFromInterval(interval),
            periodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          })
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const deliveredSubscription = event.data.object as Stripe.Subscription
      const subscription = await stripe.subscriptions.retrieve(deliveredSubscription.id)
      let userId = subscription.metadata?.user_id ?? deliveredSubscription.metadata?.user_id

      if (!userId) {
        const data = requireStripeDbResult(
          'find subscription owner for deletion',
          await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .single()
        )
        userId = data?.user_id
      }

      if (!userId) break

      const canonicalPlan = subscriptionPlanForStatus(subscription.status)
      if (canonicalPlan === 'pro') {
        const item = subscriptionFirstItem(subscription)
        const analyticsPlan = metadataAnalyticsPlan(subscription.metadata)
        requireStripeDbResult(
          'preserve canonical subscription after stale deletion',
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: subscriptionCustomerId(subscription),
            stripe_subscription_id: subscription.id,
            stripe_price_id: item?.price?.id ?? null,
            billing_interval: item?.plan?.interval ?? null,
            plan: analyticsPlan ?? 'pro',
            status: subscription.status,
            current_period_end: item?.current_period_end
              ? new Date(item.current_period_end * 1000).toISOString()
              : null,
            cancel_at_period_end: subscription.cancel_at_period_end ?? false,
            cancel_at: unixToIso(subscription.cancel_at),
            canceled_at: unixToIso(subscription.canceled_at),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
        )
        requireStripeDbResult(
          'preserve canonical profile after stale deletion',
          await supabase.from('profiles').update({
            plan: 'pro',
            ...(analyticsPlan ? { cc_analytics_access: true } : {}),
            ...(subscription.status === 'active' || subscription.status === 'trialing'
              ? {
                  pro_access: true,
                  subscription_status: 'active',
                  payment_failures: 0,
                  past_due_since: null,
                }
              : { subscription_status: subscription.status }),
          }).eq('id', userId)
        )
        break
      }

      const existingSubscription = requireStripeDbResult(
        'load deleted subscription entitlement',
        await supabase
          .from('subscriptions')
          .select('plan')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle()
      )
      const existingPlan = (existingSubscription as { plan?: string | null } | null)?.plan
      const analyticsPlan = metadataAnalyticsPlan(subscription.metadata)
        ?? (isAnalyticsPlanId(existingPlan) ? existingPlan : null)
      const otherEntitlingSubscriptions = await otherProEntitlingSubscriptions(
        supabase,
        userId,
        subscription.id
      )
      const hasOtherProEntitlingSubscription = otherEntitlingSubscriptions.length > 0
      const hasOtherAnalyticsEntitlingSubscription = otherEntitlingSubscriptions.some(
        ({ plan }) => isAnalyticsPlanId(plan)
      )

      if (!hasOtherProEntitlingSubscription) {
        requireStripeDbResult(
          'store canonical deleted subscription state',
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            plan: analyticsPlan ?? 'free',
            status: 'canceled',
            cancel_at_period_end: false,
            cancel_at: null,
            canceled_at: unixToIso(subscription.canceled_at),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
        )
      }

      const profileUpdates: Record<string, unknown> = analyticsPlan
        && !hasOtherAnalyticsEntitlingSubscription
        ? { cc_analytics_access: false }
        : {}
      if (!hasOtherProEntitlingSubscription) {
        profileUpdates.plan = 'free'
        profileUpdates.pro_access = false
        profileUpdates.subscription_status = 'canceled'
        profileUpdates.payment_failures = 0
        profileUpdates.past_due_since = null
      }

      if (Object.keys(profileUpdates).length > 0) {
        requireStripeDbResult(
          'store canonical profile deletion state',
          await supabase.from('profiles').update(profileUpdates).eq('id', userId)
        )
      }

      await sendCancellationConfirmedEmail(supabase, {
        dedupeKey: `${event.id}:cancellation_confirmed`,
        userId,
        url: appReturnUrl(req, '/dashboard'),
      })
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoiceSubscriptionId(invoice)
      const customerId = invoiceCustomerId(invoice)
      const contact = await getInvoiceCustomerContact(stripe, invoice, customerId)
      const userId = await findUserIdForStripeObject(supabase, {
        subscriptionId,
        customerId,
      })

      const { data: subscription } = userId
        ? await supabase
          .from('subscriptions')
          .select('billing_interval')
          .eq('user_id', userId)
          .maybeSingle()
        : { data: null }

      if (invoice.billing_reason === 'subscription_create') break

      await sendPaymentReceiptEmail(supabase, {
        dedupeKey: `${event.id}:payment_receipt`,
        userId,
        to: contact.email,
        name: contact.name,
        planLabel: planLabelFromInterval(subscription?.billing_interval),
        amount: invoice.amount_paid,
        currency: invoice.currency,
        periodEnd: invoicePeriodEnd(invoice),
        url: invoice.hosted_invoice_url ?? invoice.invoice_pdf ?? appReturnUrl(req),
      })

      await processAffiliateInvoicePaid({ stripe, supabase, invoice, eventId: event.id })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoiceSubscriptionId(invoice)
      const customerId = invoiceCustomerId(invoice)
      const contact = await getInvoiceCustomerContact(stripe, invoice, customerId)
      const userId = await findUserIdForStripeObject(supabase, {
        subscriptionId,
        customerId,
      })

      const subscription = userId
        ? requireStripeDbResult(
            'load subscription for payment failure',
            await supabase
              .from('subscriptions')
              .select('billing_interval')
              .eq('user_id', userId)
              .maybeSingle()
          )
        : null

      if (userId) {
        requireStripeDbResult(
          'store past-due subscription state',
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan: 'pro',
            status: 'past_due',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
        )

        requireStripeDbResult(
          'preserve Pro plan during payment grace',
          await supabase.from('profiles').update({ plan: 'pro' }).eq('id', userId)
        )

        // The RPC records this incremental effect on stripe_events in the same
        // transaction as the profile update. If later completion fails and Stripe
        // retries the event, the counter is not incremented twice.
        await recordStripePaymentFailure(supabase, {
          eventId: event.id,
          processingToken,
          userId,
          failedAt: new Date(event.created * 1000).toISOString(),
        })
      }

      await sendPaymentFailedEmail(supabase, {
        dedupeKey: `${event.id}:payment_failed`,
        userId,
        to: contact.email,
        name: contact.name,
        planLabel: planLabelFromInterval(subscription?.billing_interval),
        amount: invoice.amount_due,
        currency: invoice.currency,
        periodEnd: invoicePeriodEnd(invoice),
        retryAtIso: unixToIso(invoice.next_payment_attempt),
        url: invoice.hosted_invoice_url ?? appReturnUrl(req),
      })
      break
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      const customerId = typeof charge.customer === 'string' ? charge.customer : charge.customer?.id
      if (!customerId) break

      // Partial refunds are intentionally a no-op. Support handles those manually
      // via the Supabase dashboard (set profiles.pro_access=false + subscriptions.status='canceled').
      // Rationale: our $39/$199 ticket size and lack of a pro-ration refund policy mean
      // partial refunds are rare ops-triggered goodwill gestures, not a billing primitive.
      // See docs/notes/stripe-paywall-audit.md (CODEX-6).
      if (charge.amount_refunded === charge.amount && charge.refunded) {
        const userId = await findUserIdForStripeObject(supabase, { customerId })
        if (!userId) {
          console.warn('[Stripe webhook] charge.refunded: no subscription row found for customer', customerId, 'event', event.id)
          break
        }
        requireStripeDbResult(
          'revoke profile entitlement after full refund',
          await supabase
            .from('profiles')
            .update({ subscription_status: 'cancelled', pro_access: false, plan: 'free' })
            .eq('id', userId)
        )
        requireStripeDbResult(
          'revoke subscription entitlement after full refund',
          await supabase
            .from('subscriptions')
            .update({ plan: 'free', status: 'canceled', updated_at: new Date().toISOString() })
            .eq('user_id', userId)
        )
      }
      break
    }

    case 'charge.dispute.created': {
      const dispute = event.data.object as Stripe.Dispute
      const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id
      console.warn('[Stripe] Dispute created:', dispute.id, 'Charge:', chargeId, 'Reason:', dispute.reason)
      break
    }

    case 'charge.dispute.closed': {
      const dispute = event.data.object as Stripe.Dispute
      console.log('[Stripe] Dispute closed:', dispute.id, 'Status:', dispute.status)
      break
    }

    case 'customer.subscription.paused': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
      const userId = await findUserIdForStripeObject(supabase, {
        metadata: sub.metadata,
        subscriptionId: sub.id,
        customerId,
      })
      if (!userId) {
        console.warn('[Stripe webhook] customer.subscription.paused: no subscription row found for customer', customerId, 'subscription', sub.id, 'event', event.id)
        break
      }
      requireStripeDbResult(
        'pause profile entitlement',
        await supabase
          .from('profiles')
          .update({ subscription_status: 'paused', pro_access: false })
          .eq('id', userId)
      )
      // NOTE: subscriptions.status CHECK constraint doesn't accept 'paused' — use 'past_due'
      // as the closest valid value. The authoritative paused-state signal lives on
      // profiles.subscription_status / pro_access (updated above).
      requireStripeDbResult(
        'pause subscription entitlement',
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('user_id', userId)
      )
      break
    }

    case 'customer.subscription.resumed': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
      const userId = await findUserIdForStripeObject(supabase, {
        metadata: sub.metadata,
        subscriptionId: sub.id,
        customerId,
      })
      if (!userId) {
        console.warn('[Stripe webhook] customer.subscription.resumed: no subscription row found for customer', customerId, 'subscription', sub.id, 'event', event.id)
        break
      }
      requireStripeDbResult(
        'resume profile entitlement',
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            pro_access: true,
            payment_failures: 0,
            past_due_since: null,
          })
          .eq('id', userId)
      )
      requireStripeDbResult(
        'resume subscription entitlement',
        await supabase
          .from('subscriptions')
          .update({ status: sub.status, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
      )
      break
    }

    case 'customer.subscription.trial_will_end': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
      const userId = await findUserIdForStripeObject(supabase, {
        metadata: sub.metadata,
        subscriptionId: sub.id,
        customerId,
      })
      if (!userId) {
        console.warn('[Stripe webhook] customer.subscription.trial_will_end: no subscription row found for customer', customerId, 'subscription', sub.id, 'event', event.id)
        break
      }
      const item = subscriptionFirstItem(sub)
      const interval = item?.plan?.interval ?? null
      await sendTrialEndingEmail(supabase, {
        dedupeKey: `${event.id}:trial_ending`,
        userId,
        planLabel: planLabelFromInterval(interval),
        amount: item?.price?.unit_amount ?? null,
        currency: item?.price?.currency ?? null,
        periodEnd: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        url: appReturnUrl(req),
      })
      break
    }

    case 'invoice.payment_action_required': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoiceCustomerId(invoice)
      const subscriptionId = invoiceSubscriptionId(invoice)
      const contact = await getInvoiceCustomerContact(stripe, invoice, customerId)
      const userId = await findUserIdForStripeObject(supabase, {
        subscriptionId,
        customerId,
      })

      const { data: subscription } = userId
        ? await supabase
          .from('subscriptions')
          .select('billing_interval')
          .eq('user_id', userId)
          .maybeSingle()
        : { data: null }

      await sendPaymentActionRequiredEmail(supabase, {
        dedupeKey: `${event.id}:payment_action_required`,
        userId,
        to: contact.email,
        name: contact.name,
        planLabel: planLabelFromInterval(subscription?.billing_interval),
        amount: invoice.amount_due,
        currency: invoice.currency,
        periodEnd: invoicePeriodEnd(invoice),
        url: invoice.hosted_invoice_url ?? appReturnUrl(req),
      })
      break
    }

    case 'charge.dispute.funds_withdrawn': {
      const dispute = event.data.object as Stripe.Dispute
      const charge = typeof dispute.charge === 'string'
        ? await stripe.charges.retrieve(dispute.charge)
        : dispute.charge
      const chargeId = charge?.id ?? null
      const customerId = typeof charge?.customer === 'string' ? charge.customer : charge?.customer?.id ?? null
      const userId = await findUserIdForStripeObject(supabase, { customerId })
      if (!userId) {
        console.warn('[Stripe webhook] charge.dispute.funds_withdrawn: no subscription row found for customer', customerId, 'dispute', dispute.id, 'event', event.id)
        break
      }
      requireStripeDbResult(
        'revoke profile entitlement after dispute funds withdrawn',
        await supabase
          .from('profiles')
          .update({ pro_access: false, subscription_status: 'disputed' })
          .eq('id', userId)
      )
      requireStripeDbResult(
        'revoke subscription entitlement after dispute funds withdrawn',
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('user_id', userId)
      )
      console.warn('[Stripe webhook] dispute funds withdrawn — Pro access revoked', {
        userId,
        chargeId,
        disputeId: dispute.id,
        amount: dispute.amount,
      })
      break
    }

    case 'charge.dispute.funds_reinstated': {
      const dispute = event.data.object as Stripe.Dispute
      const charge = typeof dispute.charge === 'string'
        ? await stripe.charges.retrieve(dispute.charge)
        : dispute.charge
      const customerId = typeof charge?.customer === 'string' ? charge.customer : charge?.customer?.id ?? null
      const userId = await findUserIdForStripeObject(supabase, { customerId })
      if (!userId) {
        console.warn('[Stripe webhook] charge.dispute.funds_reinstated: no subscription row found for customer', customerId, 'dispute', dispute.id, 'event', event.id)
        break
      }
      const profile = requireStripeDbResult(
        'load profile state before dispute funds reinstatement',
        await supabase
          .from('profiles')
          .select('payment_failures, subscription_status')
          .eq('id', userId)
          .single()
      )
      const failures = profile?.payment_failures ?? 0
      if (failures >= 3) {
        console.info('[Stripe webhook] dispute funds reinstated — skipping restore due to active payment failures', {
          userId,
          disputeId: dispute.id,
          failures,
        })
        break
      }
      requireStripeDbResult(
        'restore profile entitlement after dispute funds reinstated',
        await supabase
          .from('profiles')
          .update({ pro_access: true, subscription_status: 'active' })
          .eq('id', userId)
      )
      requireStripeDbResult(
        'restore subscription entitlement after dispute funds reinstated',
        await supabase
          .from('subscriptions')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('user_id', userId)
      )
      console.info('[Stripe webhook] dispute funds reinstated — Pro access restored', {
        userId,
        disputeId: dispute.id,
      })
      break
    }

    case 'charge.dispute.updated': {
      const dispute = event.data.object as Stripe.Dispute
      console.info('[Stripe webhook] dispute updated', {
        disputeId: dispute.id,
        status: dispute.status,
        reason: dispute.reason,
      })
      break
    }

    case 'v2.core.account.updated':
    case 'v2.core.account[configuration.recipient].updated':
    case 'v2.core.account[configuration.recipient].capability_status_updated':
    case 'v2.core.account[requirements].updated':
    case 'v2.core.account_link.returned': {
      const object = event.data.object as { id?: string; account?: string }
      const accountId = object.id ?? object.account
      if (!accountId) break

      const account = await stripe.v2.core.accounts.retrieve(accountId, {
        include: ['configuration.recipient', 'requirements', 'future_requirements'],
      })
      await updateAffiliateAccountFromStripeAccount(supabase, account)
      break
    }
    }

    await completeStripeEvent(supabase, event.id, processingToken)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[stripe.webhook] event processing failed:', {
      eventId: event.id,
      eventType: event.type,
      error,
    })
    try {
      await releaseStripeEvent(supabase, event.id, processingToken, error)
    } catch (releaseError) {
      // The processing lease expires, so a failed release cannot poison the
      // event permanently. Keep the response retryable either way.
      console.error('[stripe.webhook] event release failed:', releaseError)
    }
    return apiError(500, 'stripe_event_processing_failed', 'Webhook processing failed')
  }
}
