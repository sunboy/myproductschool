import { describe, expect, it } from 'vitest'
import type Stripe from 'stripe'
import {
  affiliatesEnabled,
  commissionAmountCents,
  getAffiliateCouponId,
  normalizeAffiliateCode,
  suggestAffiliateCode,
} from '../../src/lib/affiliate/config'
import { applyReferralAttribution } from '../../src/lib/affiliate/attribution'
import { recordAffiliateCommission } from '../../src/lib/affiliate/commissions'
import {
  affiliateAccountStatus,
  affiliateProgramStatusFromAccountStatus,
  createAffiliateAccountLink,
  hasActiveAffiliateTransfers,
} from '../../src/lib/affiliate/connect'
import { runAffiliatePayouts } from '../../src/lib/affiliate/payouts'
import { invoicePromotionCodeId } from '../../src/lib/affiliate/stripe'

type AffiliateRow = {
  id: string
  user_id: string
  code: string
  status: 'pending' | 'active' | 'disabled'
}

type ProfileRow = {
  id: string
  affiliate_id: string | null
  referral_source?: string | null
}

class AffiliateSupabaseStub {
  affiliates = new Map<string, AffiliateRow>()
  profiles = new Map<string, ProfileRow>()
  updates: Array<{ table: string; values: Record<string, unknown> }> = []
  nextUpdateError: { message: string } | null = null

  from(table: string) {
    return new AffiliateQueryStub(this, table)
  }
}

class AffiliateQueryStub {
  private field: string | null = null
  private value: unknown = null
  private updateValues: Record<string, unknown> | null = null

  constructor(
    private readonly store: AffiliateSupabaseStub,
    private readonly table: string
  ) {}

  select() {
    return this
  }

  eq(field: string, value: unknown) {
    this.field = field
    this.value = value
    return this
  }

  is() {
    return this
  }

  update(values: Record<string, unknown>) {
    this.updateValues = values
    return this
  }

  async maybeSingle() {
    if (this.table === 'affiliates' && this.field === 'code') {
      return {
        data: [...this.store.affiliates.values()].find(row => row.code === this.value) ?? null,
        error: null,
      }
    }

    if (this.table === 'profiles' && this.field === 'id') {
      return {
        data: this.store.profiles.get(String(this.value)) ?? null,
        error: null,
      }
    }

    return { data: null, error: null }
  }

  then(resolve: (value: { error: { message: string } | null }) => void) {
    if (this.updateValues && this.table === 'profiles' && this.field === 'id') {
      this.store.updates.push({ table: this.table, values: this.updateValues })
      const profile = this.store.profiles.get(String(this.value))
      if (profile && !profile.affiliate_id) {
        profile.affiliate_id = String(this.updateValues.affiliate_id)
        profile.referral_source = String(this.updateValues.referral_source)
      }
    }

    resolve({ error: this.store.nextUpdateError })
  }
}

class CommissionSupabaseStub {
  affiliates = new Map<string, Record<string, unknown>>()
  commissionUpserts: Record<string, unknown>[] = []

  from(table: string) {
    return new CommissionQueryStub(this, table)
  }
}

class CommissionQueryStub {
  private filters: Record<string, unknown> = {}

  constructor(
    private readonly store: CommissionSupabaseStub,
    private readonly table: string
  ) {}

  select() {
    return this
  }

  eq(field: string, value: unknown) {
    this.filters[field] = value
    return this
  }

  async maybeSingle() {
    if (this.table !== 'affiliates') return { data: null }

    const row = [...this.store.affiliates.values()].find(affiliate => (
      Object.entries(this.filters).every(([field, value]) => affiliate[field] === value)
    ))

    return { data: row ?? null }
  }

  async upsert(values: Record<string, unknown>) {
    this.store.commissionUpserts.push(values)
    return { error: null }
  }
}

class PayoutSupabaseStub {
  commissions: Array<Record<string, unknown>> = []
  affiliates: Array<Record<string, unknown>> = []
  updates: Array<{ ids: string[]; values: Record<string, unknown> }> = []

  from(table: string) {
    return new PayoutQueryStub(this, table)
  }
}

class PayoutQueryStub {
  private filters: Record<string, unknown> = {}
  private idFilter: string[] | null = null
  private updateValues: Record<string, unknown> | null = null

  constructor(
    private readonly store: PayoutSupabaseStub,
    private readonly table: string
  ) {}

  select() {
    return this
  }

  eq(field: string, value: unknown) {
    this.filters[field] = value
    return this
  }

  in(field: string, values: unknown[]) {
    if (field === 'id') this.idFilter = values.map(String)
    return this
  }

  order() {
    return this
  }

  update(values: Record<string, unknown>) {
    this.updateValues = values
    return this
  }

  then(resolve: (value: { data?: Record<string, unknown>[]; error: null }) => void) {
    if (this.table === 'affiliate_commissions' && this.updateValues) {
      const ids = this.idFilter ?? []
      this.store.updates.push({ ids, values: this.updateValues })
      for (const row of this.store.commissions) {
        if (ids.includes(String(row.id)) && row.status === this.filters.status) {
          Object.assign(row, this.updateValues)
        }
      }
      resolve({ error: null })
      return
    }

    if (this.table === 'affiliate_commissions') {
      resolve({
        data: this.store.commissions.filter(row => (
          Object.entries(this.filters).every(([field, value]) => row[field] === value)
        )),
        error: null,
      })
      return
    }

    if (this.table === 'affiliates') {
      resolve({
        data: this.idFilter
          ? this.store.affiliates.filter(row => this.idFilter?.includes(String(row.id)))
          : this.store.affiliates,
        error: null,
      })
      return
    }

    resolve({ data: [], error: null })
  }
}

describe('affiliate flow helpers', () => {
  it('normalizes valid affiliate codes and rejects invalid codes', () => {
    expect(normalizeAffiliateCode(' hatch-20 ')).toBe('HATCH-20')
    expect(normalizeAffiliateCode('abc')).toBeNull()
    expect(normalizeAffiliateCode('bad code')).toBeNull()
    expect(normalizeAffiliateCode('code_with_underscore')).toBeNull()
  })

  it('suggests a stable uppercase code from profile data', () => {
    expect(suggestAffiliateCode('Ada Lovelace', 'user_123')).toBe('ADA-LOVELACE')
    expect(suggestAffiliateCode('ada@example.com', 'user_123')).toBe('HP-USER123')
  })

  it('uses mode-specific affiliate coupon ids', () => {
    expect(getAffiliateCouponId('test', {
      STRIPE_AFFILIATE_COUPON_ID: 'coupon_live',
      STRIPE_TEST_AFFILIATE_COUPON_ID: 'coupon_test',
    })).toBe('coupon_test')

    expect(getAffiliateCouponId('live', {
      STRIPE_AFFILIATE_COUPON_ID: 'coupon_live',
      STRIPE_TEST_AFFILIATE_COUPON_ID: 'coupon_test',
    })).toBe('coupon_live')
  })

  it('keeps affiliates disabled unless the explicit launch flag is true', () => {
    expect(affiliatesEnabled({})).toBe(false)
    expect(affiliatesEnabled({ NEXT_PUBLIC_ENABLE_AFFILIATES: 'false' })).toBe(false)
    expect(affiliatesEnabled({ NEXT_PUBLIC_ENABLE_AFFILIATES: 'true' })).toBe(true)
  })

  it('calculates invoice commission in cents', () => {
    expect(commissionAmountCents(2900, 20)).toBe(580)
    expect(commissionAmountCents(19900, 12.5)).toBe(2488)
    expect(commissionAmountCents(0, 20)).toBe(0)
  })

  it('extracts promotion code ids from expanded invoice discounts', () => {
    const invoice = {
      discounts: [
        {
          id: 'di_123',
          object: 'discount',
          promotion_code: { id: 'promo_123', object: 'promotion_code' },
        },
      ],
    } as unknown as Stripe.Invoice

    expect(invoicePromotionCodeId(invoice)).toBe('promo_123')
  })

  it('maps Stripe Accounts v2 recipient capability status to affiliate readiness', () => {
    const activeAccount = {
      id: 'acct_v2_active',
      object: 'v2.core.account',
      closed: false,
      livemode: false,
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: { status: 'active', status_details: [] },
            },
          },
        },
      },
    } as unknown as Stripe.V2.Core.Account

    const restrictedAccount = {
      ...activeAccount,
      id: 'acct_v2_restricted',
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: { status: 'restricted', status_details: [] },
            },
          },
        },
      },
    } as unknown as Stripe.V2.Core.Account

    expect(affiliateAccountStatus(activeAccount)).toBe('active')
    expect(affiliateProgramStatusFromAccountStatus('active')).toBe('active')
    expect(hasActiveAffiliateTransfers(activeAccount)).toBe(true)
    expect(affiliateAccountStatus(restrictedAccount)).toBe('restricted')
    expect(affiliateProgramStatusFromAccountStatus('restricted')).toBe('pending')
    expect(hasActiveAffiliateTransfers(restrictedAccount)).toBe(false)
  })

  it('creates Accounts v2 onboarding links for the recipient configuration', async () => {
    const calls: unknown[] = []
    const stripe = {
      v2: {
        core: {
          accountLinks: {
            create: async (input: unknown) => {
              calls.push(input)
              return { url: 'https://connect.stripe.test/onboard' }
            },
          },
        },
      },
    } as unknown as Stripe

    const link = await createAffiliateAccountLink(stripe, {
      accountId: 'acct_v2',
      refreshUrl: 'https://hackproduct.test/affiliate?connect=refresh',
      returnUrl: 'https://hackproduct.test/api/affiliate/connect-callback',
    })

    expect(link.url).toBe('https://connect.stripe.test/onboard')
    expect(calls).toMatchObject([{
      account: 'acct_v2',
      use_case: {
        type: 'account_onboarding',
        account_onboarding: {
          configurations: ['recipient'],
          collection_options: {
            fields: 'eventually_due',
            future_requirements: 'include',
          },
        },
      },
    }])
  })

  it('attributes a valid referral code to an unattributed profile', async () => {
    const supabase = new AffiliateSupabaseStub()
    supabase.affiliates.set('aff_1', {
      id: 'aff_1',
      user_id: 'affiliate-user',
      code: 'HATCH20',
      status: 'pending',
    })
    supabase.profiles.set('buyer-user', { id: 'buyer-user', affiliate_id: null })

    const result = await applyReferralAttribution(
      supabase as never,
      'buyer-user',
      ' hatch20 '
    )

    expect(result).toEqual({ applied: true, affiliateId: 'aff_1', code: 'HATCH20' })
    expect(supabase.profiles.get('buyer-user')).toMatchObject({
      affiliate_id: 'aff_1',
      referral_source: 'HATCH20',
    })
  })

  it('does not attribute disabled affiliate codes', async () => {
    const supabase = new AffiliateSupabaseStub()
    supabase.affiliates.set('aff_disabled', {
      id: 'aff_disabled',
      user_id: 'affiliate-user',
      code: 'STOPPED',
      status: 'disabled',
    })
    supabase.profiles.set('buyer-user', { id: 'buyer-user', affiliate_id: null })

    const result = await applyReferralAttribution(
      supabase as never,
      'buyer-user',
      'STOPPED'
    )

    expect(result).toEqual({ applied: false, reason: 'disabled' })
    expect(supabase.updates).toHaveLength(0)
    expect(supabase.profiles.get('buyer-user')?.affiliate_id).toBeNull()
  })

  it('does not overwrite an existing attribution or allow self-referral', async () => {
    const supabase = new AffiliateSupabaseStub()
    supabase.affiliates.set('aff_1', {
      id: 'aff_1',
      user_id: 'affiliate-user',
      code: 'HATCH20',
      status: 'active',
    })
    supabase.profiles.set('buyer-user', { id: 'buyer-user', affiliate_id: 'aff_existing' })

    await expect(applyReferralAttribution(
      supabase as never,
      'affiliate-user',
      'HATCH20'
    )).resolves.toEqual({ applied: false, reason: 'self_referral' })

    await expect(applyReferralAttribution(
      supabase as never,
      'buyer-user',
      'HATCH20'
    )).resolves.toEqual({ applied: false, reason: 'already_attributed' })

    expect(supabase.updates).toHaveLength(0)
  })

  it('records an invoice commission from a tracked promotion code', async () => {
    const supabase = new CommissionSupabaseStub()
    supabase.affiliates.set('aff_1', {
      id: 'aff_1',
      stripe_promo_code_id: 'promo_123',
      commission_pct: 20,
      status: 'active',
    })

    await recordAffiliateCommission({} as Stripe, supabase as never, {
      id: 'in_123',
      amount_paid: 2900,
      currency: 'usd',
      discounts: [{
        id: 'di_123',
        object: 'discount',
        promotion_code: { id: 'promo_123', object: 'promotion_code' },
      }],
    } as unknown as Stripe.Invoice)

    expect(supabase.commissionUpserts).toMatchObject([{
      affiliate_id: 'aff_1',
      invoice_id: 'in_123',
      amount_cents: 580,
      currency: 'usd',
      status: 'pending',
    }])
  })

  it('skips disabled affiliates when recording invoice commissions', async () => {
    const supabase = new CommissionSupabaseStub()
    supabase.affiliates.set('aff_disabled', {
      id: 'aff_disabled',
      stripe_promo_code_id: 'promo_disabled',
      commission_pct: 20,
      status: 'disabled',
    })

    await recordAffiliateCommission({} as Stripe, supabase as never, {
      id: 'in_disabled',
      amount_paid: 2900,
      currency: 'usd',
      discounts: [{
        id: 'di_disabled',
        object: 'discount',
        promotion_code: { id: 'promo_disabled', object: 'promotion_code' },
      }],
    } as unknown as Stripe.Invoice)

    expect(supabase.commissionUpserts).toHaveLength(0)
  })

  it('pays active affiliate commissions and sends a payout email', async () => {
    const supabase = new PayoutSupabaseStub()
    supabase.commissions = [
      { id: 'comm_1', affiliate_id: 'aff_1', amount_cents: 500, currency: 'usd', status: 'pending' },
      { id: 'comm_2', affiliate_id: 'aff_1', amount_cents: '250', currency: 'usd', status: 'pending' },
    ]
    supabase.affiliates = [{
      id: 'aff_1',
      user_id: 'affiliate-user',
      code: 'HATCH20',
      stripe_connect_account_id: 'acct_active',
      status: 'active',
    }]
    const emails: unknown[] = []
    const transfers: unknown[] = []
    const stripe = {
      accounts: {
        retrieve: async () => ({
          id: 'acct_active',
          object: 'account',
          capabilities: { transfers: 'active' },
          payouts_enabled: false,
        }),
      },
      transfers: {
        create: async (input: unknown) => {
          transfers.push(input)
          return { id: 'tr_123' }
        },
      },
    } as unknown as Stripe

    const { result, status } = await runAffiliatePayouts({
      admin: supabase as never,
      stripe,
      dashboardUrl: 'https://example.test/affiliate',
      sendEmail: async input => {
        emails.push(input)
      },
    })

    expect(status).toBe(200)
    expect(result.paid).toEqual([{
      affiliateId: 'aff_1',
      transferId: 'tr_123',
      amount: 750,
      commissions: 2,
    }])
    expect(transfers).toMatchObject([{
      amount: 750,
      currency: 'usd',
      destination: 'acct_active',
    }])
    expect(supabase.updates[0]).toMatchObject({
      ids: ['comm_1', 'comm_2'],
      values: {
        status: 'paid',
        stripe_transfer_id: 'tr_123',
      },
    })
    expect(emails).toMatchObject([{
      dedupeKey: 'affiliate_payout:tr_123',
      userId: 'affiliate-user',
      amount: 750,
      currency: 'usd',
      url: 'https://example.test/affiliate',
    }])
  })

  it('skips payouts until the affiliate has active Connect transfers', async () => {
    const supabase = new PayoutSupabaseStub()
    supabase.commissions = [
      { id: 'comm_1', affiliate_id: 'aff_1', amount_cents: 500, currency: 'usd', status: 'pending' },
      { id: 'comm_2', affiliate_id: 'aff_2', amount_cents: 500, currency: 'usd', status: 'pending' },
    ]
    supabase.affiliates = [
      {
        id: 'aff_1',
        user_id: 'affiliate-user-1',
        code: 'PENDING',
        stripe_connect_account_id: 'acct_pending',
        status: 'pending',
      },
      {
        id: 'aff_2',
        user_id: 'affiliate-user-2',
        code: 'INACTIVE',
        stripe_connect_account_id: 'acct_inactive',
        status: 'active',
      },
    ]
    const stripe = {
      accounts: {
        retrieve: async () => ({
          id: 'acct_inactive',
          object: 'account',
          capabilities: { transfers: 'inactive' },
          payouts_enabled: false,
        }),
      },
      transfers: {
        create: async () => {
          throw new Error('transfer should not run')
        },
      },
    } as unknown as Stripe

    const { result, status } = await runAffiliatePayouts({
      admin: supabase as never,
      stripe,
      dashboardUrl: 'https://example.test/affiliate',
      sendEmail: async () => {},
    })

    expect(status).toBe(200)
    expect(result.paid).toEqual([])
    expect(result.skipped).toEqual([
      { affiliateId: 'aff_1', reason: 'connect_not_active' },
      { affiliateId: 'aff_2', reason: 'transfers_capability_inactive' },
    ])
    expect(supabase.updates).toHaveLength(0)
  })
})
