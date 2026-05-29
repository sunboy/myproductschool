import { NextResponse, type NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { createUnsubscribeToken } from '@/lib/notifications/unsubscribe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createStripeClient } from '@/lib/stripe/config'
import { planLabelFromInterval } from '@/lib/email/billing'
import { sendTrialEndingEmail } from '@/lib/email/transactional'

const ONE_DAY_SECONDS = 24 * 60 * 60
const TWO_DAYS_SECONDS = 2 * ONE_DAY_SECONDS

type AdminClient = ReturnType<typeof createAdminClient>

type NotificationPrefRow = {
  billing_alerts: boolean | null
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}

function appUrl(request: NextRequest, path: string) {
  return new URL(path, process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin).toString()
}

function customerId(customer: Stripe.Subscription['customer']) {
  if (typeof customer === 'string') return customer
  return customer.id
}

function customerContact(customer: Stripe.Customer | Stripe.DeletedCustomer) {
  if ('deleted' in customer && customer.deleted) {
    return { email: null, name: null }
  }

  return {
    email: customer.email,
    name: customer.name,
  }
}

async function getCustomerContact(stripe: Stripe, customer: Stripe.Subscription['customer']) {
  if (typeof customer !== 'string') return customerContact(customer)

  const loaded = await stripe.customers.retrieve(customer)
  return customerContact(loaded)
}

async function findUserId(
  admin: AdminClient,
  subscription: Stripe.Subscription,
  stripeCustomerId: string
) {
  if (subscription.metadata?.user_id) return subscription.metadata.user_id

  const { data: bySubscription } = await admin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (bySubscription?.user_id) return bySubscription.user_id as string

  const { data: byCustomer } = await admin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle()

  return byCustomer?.user_id as string | undefined
}

async function billingAlertsEnabled(admin: AdminClient, userId: string | null | undefined) {
  if (!userId) return true

  const { data } = await admin
    .from('notification_prefs')
    .select('billing_alerts')
    .eq('user_id', userId)
    .maybeSingle()

  const prefs = data as NotificationPrefRow | null
  return prefs?.billing_alerts !== false
}

function trialEndsInReminderWindow(trialEnd: number | null, nowSeconds: number) {
  if (!trialEnd) return false
  const secondsUntilTrialEnd = trialEnd - nowSeconds
  return secondsUntilTrialEnd >= ONE_DAY_SECONDS && secondsUntilTrialEnd < TWO_DAYS_SECONDS
}

function planInterval(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0]
  return item?.price?.recurring?.interval ?? item?.plan?.interval ?? null
}

async function loadTrialingSubscriptions(stripe: Stripe) {
  const subscriptions: Stripe.Subscription[] = []
  let startingAfter: string | undefined

  do {
    const page = await stripe.subscriptions.list({
      status: 'trialing',
      limit: 100,
      expand: ['data.customer'],
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    })

    subscriptions.push(...page.data)
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined
  } while (startingAfter)

  return subscriptions
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized()

  const { stripe, config } = createStripeClient()
  if (!stripe) {
    return NextResponse.json(
      { error: config.error ?? 'Stripe not configured', mode: config.mode },
      { status: 503 }
    )
  }

  const admin = createAdminClient()
  const nowSeconds = Math.floor(Date.now() / 1000)
  const subscriptions = await loadTrialingSubscriptions(stripe)
  let attempted = 0
  let sent = 0
  let skipped = 0

  for (const subscription of subscriptions) {
    if (!trialEndsInReminderWindow(subscription.trial_end, nowSeconds) || subscription.cancel_at_period_end) {
      skipped += 1
      continue
    }

    const stripeCustomerId = customerId(subscription.customer)
    const userId = await findUserId(admin, subscription, stripeCustomerId)
    if (!(await billingAlertsEnabled(admin, userId))) {
      skipped += 1
      continue
    }

    const contact = await getCustomerContact(stripe, subscription.customer)
    const trialEndIso = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
    const token = userId ? createUnsubscribeToken({ userId, preference: 'billing_alerts' }) : null
    const dedupeKey = `trial_ending:${subscription.id}:${subscription.trial_end ?? 'unknown'}`

    attempted += 1
    await sendTrialEndingEmail(admin, {
      dedupeKey,
      userId,
      to: contact.email,
      name: contact.name,
      planLabel: planLabelFromInterval(planInterval(subscription)),
      periodEnd: trialEndIso,
      url: appUrl(request, '/settings'),
      unsubscribeUrl: token ? appUrl(request, `/api/notifications/unsubscribe?token=${token}`) : null,
    })

    const { data: emailEvent } = await admin
      .from('email_dedupes')
      .select('status')
      .eq('dedupe_key', dedupeKey)
      .maybeSingle()

    if (emailEvent?.status === 'sent') sent += 1
  }

  return NextResponse.json({
    ok: true,
    scanned: subscriptions.length,
    attempted,
    sent,
    skipped,
  })
}
