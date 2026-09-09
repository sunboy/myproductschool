import Stripe from 'stripe'
import type { StripeRuntimeMode } from './config'

export type StoredBillingReferences = {
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
}

export type BillingCustomerResolution = {
  customerId: string | null
  blockingSubscription: Stripe.Subscription | null
  source: 'stored_customer' | 'stored_subscription' | 'created_customer' | null
}

export type CheckoutCustomerPersistence = {
  persistIfUnclaimed: (customerId: string) => Promise<boolean>
  reloadStored: () => Promise<StoredBillingReferences | null>
}

const CHECKOUT_BLOCKING_STATUSES = new Set<Stripe.Subscription.Status>([
  'active',
  'trialing',
  'past_due',
])

function isRuntimeMode(livemode: boolean, mode: StripeRuntimeMode) {
  return livemode === (mode === 'live')
}

function isMissingStripeResource(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const candidate = error as { code?: string; statusCode?: number }
  return candidate.code === 'resource_missing' || candidate.statusCode === 404
}

function customerIdOf(subscription: Stripe.Subscription) {
  return typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id
}

function blocksCheckout(subscription: Stripe.Subscription) {
  return CHECKOUT_BLOCKING_STATUSES.has(subscription.status)
}

async function retrieveCustomer(
  stripe: Stripe,
  customerId: string,
  mode: StripeRuntimeMode
) {
  try {
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted || !isRuntimeMode(customer.livemode, mode)) return null
    return customer
  } catch (error) {
    if (isMissingStripeResource(error)) return null
    throw error
  }
}

async function retrieveSubscription(
  stripe: Stripe,
  subscriptionId: string,
  mode: StripeRuntimeMode
) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return isRuntimeMode(subscription.livemode, mode) ? subscription : null
  } catch (error) {
    if (isMissingStripeResource(error)) return null
    throw error
  }
}

/**
 * Resolve only Stripe objects explicitly referenced by this user's database row.
 * We deliberately do not search by email because that could adopt or mutate an
 * unrelated Stripe customer with the same address.
 */
export async function resolveBillingCustomer(input: {
  stripe: Stripe
  mode: StripeRuntimeMode
  userId: string
  stored: StoredBillingReferences | null
}): Promise<BillingCustomerResolution> {
  const { stripe, mode, userId, stored } = input
  const storedCustomerId = stored?.stripe_customer_id ?? null
  const storedSubscriptionId = stored?.stripe_subscription_id ?? null

  const [storedCustomer, storedSubscription] = await Promise.all([
    storedCustomerId ? retrieveCustomer(stripe, storedCustomerId, mode) : null,
    storedSubscriptionId
      ? retrieveSubscription(stripe, storedSubscriptionId, mode)
      : null,
  ])

  // A contradictory metadata owner is stronger evidence than the local row.
  // Do not adopt that subscription's customer, even if the row is historical.
  const subscriptionOwnedByUser = storedSubscription
    ? !storedSubscription.metadata.user_id
      || storedSubscription.metadata.user_id === userId
    : false

  let customerId: string | null = storedCustomer?.id ?? null
  let source: BillingCustomerResolution['source'] = storedCustomer
    ? 'stored_customer'
    : null

  // Historical rows can contain a stale customer alongside the real active
  // subscription. Prefer the protected subscription only when the user-owned
  // row and its metadata do not disagree about ownership.
  if (
    storedSubscription
    && subscriptionOwnedByUser
    && (blocksCheckout(storedSubscription) || !customerId)
  ) {
    const subscriptionCustomerId = customerIdOf(storedSubscription)
    const subscriptionCustomer = await retrieveCustomer(
      stripe,
      subscriptionCustomerId,
      mode
    )
    if (subscriptionCustomer) {
      customerId = subscriptionCustomer.id
      source = 'stored_subscription'
    } else if (blocksCheckout(storedSubscription)) {
      throw new Error('The stored active subscription customer could not be verified')
    }
  }

  if (!customerId) {
    return { customerId: null, blockingSubscription: null, source: null }
  }

  // Listing the resolved customer's complete Stripe state prevents a second
  // charge even when the local subscription id is missing or stale.
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 100,
  })
  const storedBlockingSubscription = storedSubscription
    && subscriptionOwnedByUser
    && blocksCheckout(storedSubscription)
    && customerIdOf(storedSubscription) === customerId
    ? storedSubscription
    : null
  const blockingSubscription = subscriptions.data.find(blocksCheckout)
    ?? storedBlockingSubscription
    ?? null

  return { customerId, blockingSubscription, source }
}

/**
 * Give every checkout a stable customer before creating a session. Stripe's
 * per-user, per-mode idempotency key collapses concurrent first requests; the
 * conditional database write prevents either request from overwriting a paid
 * row written by a webhook in the meantime.
 */
export async function resolveOrCreateCheckoutCustomer(input: {
  stripe: Stripe
  mode: StripeRuntimeMode
  userId: string
  email?: string | null
  stored: StoredBillingReferences | null
  persistence: CheckoutCustomerPersistence
}): Promise<BillingCustomerResolution> {
  const resolved = await resolveBillingCustomer(input)
  if (resolved.customerId) return resolved

  if (input.stored?.stripe_customer_id || input.stored?.stripe_subscription_id) {
    throw new Error('Stored billing references could not be verified in this Stripe mode')
  }

  const customer = await input.stripe.customers.create(
    {
      ...(input.email ? { email: input.email } : {}),
      metadata: {
        user_id: input.userId,
        stripe_mode: input.mode,
      },
    },
    { idempotencyKey: `billing-customer-${input.mode}-${input.userId}` }
  )

  if (!isRuntimeMode(customer.livemode, input.mode)) {
    throw new Error('Created Stripe customer mode did not match the billing runtime')
  }

  if (await input.persistence.persistIfUnclaimed(customer.id)) {
    return {
      customerId: customer.id,
      blockingSubscription: null,
      source: 'created_customer',
    }
  }

  // A checkout or webhook won the row race. Re-read and verify that canonical
  // state rather than overwriting it or continuing with an orphan customer.
  const canonicalStored = await input.persistence.reloadStored()
  const canonical = await resolveBillingCustomer({
    stripe: input.stripe,
    mode: input.mode,
    userId: input.userId,
    stored: canonicalStored,
  })
  if (!canonical.customerId) {
    throw new Error('Billing customer could not be persisted safely')
  }
  return canonical
}
