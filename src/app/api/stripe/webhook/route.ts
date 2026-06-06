import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createStripeClient } from '@/lib/stripe/config'
import {
  invoicePeriodEnd,
  planLabelFromInterval,
} from '@/lib/email/billing'
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

async function userHasOtherProEntitlingSubscription(
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

  const subscriptions = (subscriptionsResult.data ?? []) as Array<
    SubscriptionEntitlementRow & { stripe_subscription_id?: string | null }
  >
  const pastDueSince = (profileResult.data as { past_due_since?: string | null } | null)?.past_due_since

  return subscriptions
    .filter((subscription) => subscription.stripe_subscription_id !== excludedSubscriptionId)
    .some((subscription) => subscriptionEntitlesPlan(
      subscription,
      isProEntitlingPlan,
      new Date(),
      pastDueSince
    ))
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
    const { data } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', input.subscriptionId)
      .maybeSingle()
    if (data?.user_id) return data.user_id as string
  }

  if (input.customerId) {
    const { data } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', input.customerId)
      .maybeSingle()
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

  const supabase = createAdminClient()

  // Idempotency: insert event.id immediately. Unique violation = duplicate
  // delivery (Stripe retry) → short-circuit so we don't double-write incremental
  // counters (payment_failures, affiliate commission, etc).
  const { error: dupeError } = await supabase.from('stripe_events').insert({
    id: event.id,
    type: event.type,
    payload: event as unknown as Record<string, unknown>,
  })
  if (dupeError) {
    if ((dupeError as { code?: string }).code === '23505') {
      return NextResponse.json({ received: true, duplicate: true })
    }
    // Other errors (e.g. table missing, transient network) — log but proceed
    // so legitimate first deliveries aren't blocked on infra hiccups.
    console.error('[stripe.webhook] stripe_events insert failed:', dupeError)
  }

  const eventType = event.type as string

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

      await supabase.from('profiles').update(profileUpdates).eq('id', userId)

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: checkoutCustomerId(session),
        stripe_subscription_id: checkoutSubscriptionId(session),
        plan: analyticsPlan ?? 'pro',
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

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
      const subscription = event.data.object as Stripe.Subscription
      // user_id comes from metadata (set by custom checkout) OR we look it up
      // from the subscriptions table by stripe_subscription_id / stripe_customer_id
      let userId = subscription.metadata?.user_id

      if (!userId) {
        // Buy Button path: look up via customer ID
        const { data } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()
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
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: subscription.customer as string,
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
      await supabase.from('profiles').update(profileUpdates).eq('id', userId)

      if (event.type === 'customer.subscription.updated') {
        const previous = event.data.previous_attributes as Partial<Stripe.Subscription> | undefined
        const previousPrice = previous?.items?.data?.[0]?.price?.id
        const currentPrice = priceId

        if (previous?.cancel_at_period_end === false && subscription.cancel_at_period_end) {
          await sendCancellationScheduledEmail(supabase, {
            dedupeKey: `${event.id}:cancellation_scheduled`,
            userId,
            planLabel: planLabelFromInterval(interval),
            periodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          })
        } else if (previous?.cancel_at_period_end === true && !subscription.cancel_at_period_end) {
          await sendSubscriptionReactivatedEmail(supabase, {
            dedupeKey: `${event.id}:subscription_reactivated`,
            userId,
            planLabel: planLabelFromInterval(interval),
            periodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          })
        } else if (previousPrice && currentPrice && previousPrice !== currentPrice) {
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
      const subscription = event.data.object as Stripe.Subscription
      let userId = subscription.metadata?.user_id

      if (!userId) {
        const { data } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()
        userId = data?.user_id
      }

      if (!userId) break

      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('stripe_subscription_id', subscription.id)
        .maybeSingle()
      const existingPlan = (existingSubscription as { plan?: string | null } | null)?.plan
      const analyticsPlan = metadataAnalyticsPlan(subscription.metadata)
        ?? (isAnalyticsPlanId(existingPlan) ? existingPlan : null)
      const hasOtherProEntitlingSubscription = analyticsPlan
        ? await userHasOtherProEntitlingSubscription(supabase, userId, subscription.id)
        : false

      if (!(analyticsPlan && hasOtherProEntitlingSubscription)) {
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          plan: analyticsPlan ?? 'free',
          status: 'canceled',
          cancel_at_period_end: false,
          cancel_at: null,
          canceled_at: unixToIso(subscription.canceled_at),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      }

      const profileUpdates: Record<string, unknown> = analyticsPlan
        ? { cc_analytics_access: false }
        : { plan: 'free' }
      if (analyticsPlan && !hasOtherProEntitlingSubscription) {
        profileUpdates.plan = 'free'
        profileUpdates.pro_access = false
        profileUpdates.subscription_status = 'canceled'
      }

      await supabase.from('profiles').update(profileUpdates).eq('id', userId)

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

      const { data: subscription } = userId
        ? await supabase
          .from('subscriptions')
          .select('billing_interval')
          .eq('user_id', userId)
          .maybeSingle()
        : { data: null }

      if (userId) {
        // Track failure count and grace period on profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, payment_failures, subscription_status')
          .eq('id', userId)
          .single()

        if (profile) {
          const failures = (profile.payment_failures || 0) + 1
          const updates: Record<string, unknown> = {
            payment_failures: failures,
            subscription_status: 'past_due',
          }
          // First failure: record grace period start. Suspension is NOT driven by
          // failure count — the user keeps Pro access for the full GRACE_DAYS window
          // (entitlements.subscriptionEntitlesPro returns false once that lapses, and
          // computeDunningStatus flips the banner to 'suspended' at the same point).
          // Leaving status at 'past_due' through the window keeps the dunning banner
          // visible with a live countdown. See docs/notes/stripe-paywall-audit.md.
          if (failures === 1) {
            updates.past_due_since = new Date().toISOString()
          }
          await supabase.from('profiles').update(updates).eq('id', userId)
        }

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan: 'pro',
          status: 'past_due',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

        await supabase.from('profiles').update({ plan: 'pro' }).eq('id', userId)
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
        await supabase
          .from('profiles')
          .update({ subscription_status: 'cancelled', pro_access: false, plan: 'free' })
          .eq('id', userId)
        await supabase
          .from('subscriptions')
          .update({ plan: 'free', status: 'canceled', updated_at: new Date().toISOString() })
          .eq('user_id', userId)
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
      await supabase
        .from('profiles')
        .update({ subscription_status: 'paused', pro_access: false })
        .eq('id', userId)
      // NOTE: subscriptions.status CHECK constraint doesn't accept 'paused' — use 'past_due'
      // as the closest valid value. The authoritative paused-state signal lives on
      // profiles.subscription_status / pro_access (updated above).
      await supabase
        .from('subscriptions')
        .update({ status: 'past_due', updated_at: new Date().toISOString() })
        .eq('user_id', userId)
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
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          pro_access: true,
          payment_failures: 0,
          past_due_since: null,
        })
        .eq('id', userId)
      await supabase
        .from('subscriptions')
        .update({ status: sub.status, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
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
      await supabase
        .from('profiles')
        .update({ pro_access: false, subscription_status: 'disputed' })
        .eq('id', userId)
      await supabase
        .from('subscriptions')
        .update({ status: 'past_due', updated_at: new Date().toISOString() })
        .eq('user_id', userId)
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('payment_failures, subscription_status')
        .eq('id', userId)
        .single()
      const failures = profile?.payment_failures ?? 0
      if (failures >= 3) {
        console.info('[Stripe webhook] dispute funds reinstated — skipping restore due to active payment failures', {
          userId,
          disputeId: dispute.id,
          failures,
        })
        break
      }
      await supabase
        .from('profiles')
        .update({ pro_access: true, subscription_status: 'active' })
        .eq('id', userId)
      await supabase
        .from('subscriptions')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('user_id', userId)
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

  return NextResponse.json({ received: true })
}
