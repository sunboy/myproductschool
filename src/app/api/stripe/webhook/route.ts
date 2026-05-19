import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createStripeClient } from '@/lib/stripe/config'
import {
  invoicePeriodEnd,
  planLabelFromInterval,
  sendBillingEmail,
} from '@/lib/email/billing'
import {
  processAffiliateInvoicePaid,
  updateAffiliateAccountFromStripeAccount,
  upsertAffiliateReferralFromCheckoutSession,
} from '@/lib/stripe/affiliates'

function subscriptionPlanForStatus(status: Stripe.Subscription.Status): 'free' | 'pro' {
  return status === 'active' || status === 'trialing' ? 'pro' : 'free'
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

function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const value = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }).subscription
  return typeof value === 'string' ? value : value?.id ?? null
}

function invoiceCustomerId(invoice: Stripe.Invoice) {
  const value = invoice.customer
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
  const eventType = event.type as string

  switch (eventType) {

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id ?? session.metadata?.user_id
      if (!userId) break

      await supabase.from('profiles').update({ plan: 'pro' }).eq('id', userId)

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string ?? null,
        stripe_subscription_id: session.subscription as string ?? null,
        plan: 'pro',
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      await upsertAffiliateReferralFromCheckoutSession(supabase, session)

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

      await supabase.from('profiles').update({ plan }).eq('id', userId)

      if (event.type === 'customer.subscription.updated') {
        const previous = event.data.previous_attributes as Partial<Stripe.Subscription> | undefined
        const previousPrice = previous?.items?.data?.[0]?.price?.id
        const currentPrice = priceId

        if (previous?.cancel_at_period_end === false && subscription.cancel_at_period_end) {
          await sendBillingEmail(supabase, {
            kind: 'cancellation_scheduled',
            dedupeKey: `${event.id}:cancellation_scheduled`,
            userId,
            planLabel: planLabelFromInterval(interval),
            periodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          })
        } else if (previous?.cancel_at_period_end === true && !subscription.cancel_at_period_end) {
          await sendBillingEmail(supabase, {
            kind: 'subscription_reactivated',
            dedupeKey: `${event.id}:subscription_reactivated`,
            userId,
            planLabel: planLabelFromInterval(interval),
            periodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          })
        } else if (previousPrice && currentPrice && previousPrice !== currentPrice) {
          await sendBillingEmail(supabase, {
            kind: 'plan_changed',
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

      await sendBillingEmail(supabase, {
        kind: 'subscription_ended',
        dedupeKey: `${event.id}:subscription_ended`,
        userId,
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

      const billingReason = invoice.billing_reason
      const kind = billingReason === 'subscription_create'
        ? 'premium_signup_receipt'
        : 'renewal_receipt'

      await sendBillingEmail(supabase, {
        kind,
        dedupeKey: `${event.id}:${kind}`,
        userId,
        customerEmail: contact.email,
        customerName: contact.name,
        planLabel: planLabelFromInterval(subscription?.billing_interval),
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
        periodEnd: invoicePeriodEnd(invoice),
        invoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
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

      await sendBillingEmail(supabase, {
        kind: 'payment_failed',
        dedupeKey: `${event.id}:payment_failed`,
        userId,
        customerEmail: contact.email,
        customerName: contact.name,
        planLabel: planLabelFromInterval(subscription?.billing_interval),
        amountDue: invoice.amount_due,
        currency: invoice.currency,
        periodEnd: invoicePeriodEnd(invoice),
        invoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        hostedPaymentUrl: invoice.hosted_invoice_url,
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
