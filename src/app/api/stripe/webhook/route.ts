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

function subscriptionPlanForStatus(status: Stripe.Subscription.Status): 'free' | 'pro' {
  return status === 'active' || status === 'trialing' || status === 'past_due' ? 'pro' : 'free'
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
  return session.metadata?.plan === 'annual'
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

      await supabase.from('profiles').update({
        plan: 'pro',
        pro_access: true,
        subscription_status: 'active',
        payment_failures: 0,
        past_due_since: null,
      }).eq('id', userId)

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: checkoutCustomerId(session),
        stripe_subscription_id: checkoutSubscriptionId(session),
        plan: 'pro',
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      await upsertAffiliateReferralFromCheckoutSession(supabase, session)

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

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        billing_interval: interval,
        plan,
        status: subscription.status,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        cancel_at: unixToIso(subscription.cancel_at),
        canceled_at: unixToIso(subscription.canceled_at),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      // Sync profile entitlement flags so dashboards / dunning / entitlements
      // layer all see the same state.
      const profileUpdates: Record<string, unknown> = { plan }
      if (plan === 'pro' && (subscription.status === 'active' || subscription.status === 'trialing')) {
        profileUpdates.pro_access = true
        profileUpdates.subscription_status = 'active'
        profileUpdates.payment_failures = 0
        profileUpdates.past_due_since = null
      } else if (plan === 'free') {
        // Cancelled / incomplete_expired / etc → no Pro access.
        profileUpdates.pro_access = false
        profileUpdates.subscription_status = subscription.status
      } else {
        // plan === 'pro' but status is past_due — leave pro_access alone here.
        // The invoice.payment_failed handler is the authoritative writer for
        // past_due_since / payment_failures / pro_access during dunning.
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

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        plan: 'free',
        status: 'canceled',
        cancel_at_period_end: false,
        cancel_at: null,
        canceled_at: unixToIso(subscription.canceled_at),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      await supabase.from('profiles').update({ plan: 'free' }).eq('id', userId)

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
          // First failure: record grace period start
          if (failures === 1) {
            updates.past_due_since = new Date().toISOString()
          }
          // After 3 failures: suspend access
          if (failures >= 3) {
            updates.subscription_status = 'unpaid'
            updates.pro_access = false
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
