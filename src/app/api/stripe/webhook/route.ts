import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createStripeClient } from '@/lib/stripe/config'
import {
  invoicePeriodEnd,
  planLabelFromInterval,
} from '@/lib/email/billing'
import { affiliatesEnabled } from '@/lib/affiliate/config'
import { invoiceSubscriptionId, recordAffiliateCommission } from '@/lib/affiliate/commissions'
import {
  sendCancellationConfirmedEmail,
  sendCancellationScheduledEmail,
  sendPaymentFailedEmail,
  sendPaymentReceiptEmail,
  sendPlanChangedEmail,
  sendSubscriptionReactivatedEmail,
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

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id ?? session.metadata?.user_id
      if (!userId) break
      const invoiceId = checkoutInvoiceId(session)
      const invoice = invoiceId ? await stripe.invoices.retrieve(invoiceId) : null

      await supabase.from('profiles').update({ plan: 'pro' }).eq('id', userId)

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: checkoutCustomerId(session),
        stripe_subscription_id: checkoutSubscriptionId(session),
        plan: 'pro',
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

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

      await supabase.from('profiles').update({ plan }).eq('id', userId)

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
      if (affiliatesEnabled()) {
        await recordAffiliateCommission(stripe, supabase, invoice)
      }

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
  }

  return NextResponse.json({ received: true })
}
