import type Stripe from 'stripe'
import type { createAdminClient } from '@/lib/supabase/admin'

type SupabaseAdminClient = ReturnType<typeof createAdminClient>

export type AffiliateAccountStatus =
  | 'not_started'
  | 'created'
  | 'onboarding'
  | 'active'
  | 'restricted'
  | 'disabled'

export type AffiliateProgramStatus = 'pending' | 'active' | 'disabled'

const ACCOUNT_INCLUDE: Array<Stripe.V2.Core.AccountRetrieveParams.Include> = [
  'configuration.recipient',
  'requirements',
  'future_requirements',
  'identity',
  'defaults',
]

function recipientCapabilities(account: Stripe.V2.Core.Account) {
  return account.configuration?.recipient?.capabilities ?? {}
}

function transferCapabilityStatus(account: Stripe.V2.Core.Account) {
  return recipientCapabilities(account).stripe_balance?.stripe_transfers?.status
}

export function affiliateAccountStatus(account: Stripe.V2.Core.Account): AffiliateAccountStatus {
  if (account.closed) return 'disabled'

  const transferStatus = transferCapabilityStatus(account)
  if (transferStatus === 'active') return 'active'
  if (transferStatus === 'restricted') return 'restricted'
  if (transferStatus === 'unsupported') return 'disabled'
  if (transferStatus === 'pending') return 'onboarding'
  return 'created'
}

export function affiliateProgramStatusFromAccountStatus(
  accountStatus: AffiliateAccountStatus
): AffiliateProgramStatus {
  if (accountStatus === 'active') return 'active'
  if (accountStatus === 'disabled') return 'disabled'
  return 'pending'
}

export function hasActiveAffiliateTransfers(account: Stripe.Account | Stripe.V2.Core.Account) {
  if (account.object === 'account') {
    return account.capabilities?.transfers === 'active' || account.payouts_enabled
  }

  return transferCapabilityStatus(account) === 'active'
}

export async function createAffiliateConnectAccount(
  stripe: Stripe,
  input: {
    email: string
    displayName: string
    userId: string
    country?: string
    currency?: string
  }
) {
  return stripe.v2.core.accounts.create({
    contact_email: input.email,
    display_name: input.displayName,
    dashboard: 'express',
    identity: {
      country: (input.country || 'US').toUpperCase(),
      entity_type: 'individual',
    },
    configuration: {
      recipient: {
        capabilities: {
          stripe_balance: {
            stripe_transfers: { requested: true },
          },
        },
      },
    },
    defaults: {
      currency: (input.currency || 'usd').toLowerCase(),
      responsibilities: {
        fees_collector: 'application',
        losses_collector: 'application',
      },
    },
    metadata: {
      hackproduct_user_id: input.userId,
      source: 'hackproduct_affiliate',
    },
    include: ACCOUNT_INCLUDE,
  })
}

export async function retrieveAffiliateConnectAccount(stripe: Stripe, accountId: string) {
  return stripe.v2.core.accounts.retrieve(accountId, {
    include: ACCOUNT_INCLUDE,
  })
}

export async function createAffiliateAccountLink(
  stripe: Stripe,
  input: {
    accountId: string
    refreshUrl: string
    returnUrl: string
  }
) {
  return stripe.v2.core.accountLinks.create({
    account: input.accountId,
    use_case: {
      type: 'account_onboarding',
      account_onboarding: {
        configurations: ['recipient'],
        refresh_url: input.refreshUrl,
        return_url: input.returnUrl,
        collection_options: {
          fields: 'eventually_due',
          future_requirements: 'include',
        },
      },
    },
  })
}

export async function syncAffiliateConnectAccount(
  admin: SupabaseAdminClient,
  account: Stripe.V2.Core.Account
) {
  const accountStatus = affiliateAccountStatus(account)
  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, status')
    .eq('stripe_connect_account_id', account.id)
    .maybeSingle()

  if (!affiliate) {
    return {
      accountStatus,
      programStatus: affiliateProgramStatusFromAccountStatus(accountStatus),
      updated: false,
    }
  }

  const programStatus = affiliate.status === 'disabled'
    ? 'disabled'
    : affiliateProgramStatusFromAccountStatus(accountStatus)

  await admin
    .from('affiliates')
    .update({
      status: programStatus,
      stripe_account_livemode: account.livemode,
      stripe_account_status: accountStatus,
      stripe_requirements: account.requirements ?? {},
      stripe_future_requirements: account.future_requirements ?? {},
      stripe_capabilities: recipientCapabilities(account),
      updated_at: new Date().toISOString(),
    })
    .eq('id', affiliate.id)

  return { accountStatus, programStatus, updated: true }
}

export async function refreshAffiliateConnectAccount(
  stripe: Stripe,
  admin: SupabaseAdminClient,
  accountId: string
) {
  const account = await retrieveAffiliateConnectAccount(stripe, accountId)
  const sync = await syncAffiliateConnectAccount(admin, account)
  return { account, ...sync }
}
