'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type CouponDuration = 'once' | 'repeating' | 'forever'
type DiscountType = 'percent' | 'amount'

interface CouponRow {
  id: string
  name: string | null
  percent_off: number | null
  amount_off: number | null
  currency: string | null
  duration: CouponDuration
  duration_in_months: number | null
  max_redemptions: number | null
  times_redeemed: number
  redeem_by: number | null
  valid: boolean
  created: number
}

interface PromotionCodeRow {
  id: string
  code: string
  coupon_id: string
  coupon_name: string | null
  active: boolean
  max_redemptions: number | null
  times_redeemed: number
  expires_at: number | null
  created: number
}

interface CouponsResponse {
  mode?: 'live' | 'test'
  coupons?: CouponRow[]
  promotionCodes?: PromotionCodeRow[]
  error?: string
}

function formatDiscount(coupon: CouponRow) {
  if (coupon.percent_off != null) return `${coupon.percent_off}%`
  if (coupon.amount_off != null) return `${(coupon.amount_off / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: (coupon.currency ?? 'usd').toUpperCase(),
  })}`
  return '-'
}

function formatDuration(coupon: CouponRow) {
  if (coupon.duration === 'forever') return 'Forever'
  if (coupon.duration === 'repeating') return `${coupon.duration_in_months ?? '-'} months`
  return 'Once'
}

function formatUnixDate(value: number | null) {
  if (!value) return '-'
  return new Date(value * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function redemptionLabel(timesRedeemed: number, maxRedemptions: number | null) {
  return `${timesRedeemed.toLocaleString()}${maxRedemptions ? ` / ${maxRedemptions.toLocaleString()}` : ''}`
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponRow[]>([])
  const [promotionCodes, setPromotionCodes] = useState<PromotionCodeRow[]>([])
  const [mode, setMode] = useState<'live' | 'test' | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<'coupon' | 'promotion_code' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [couponForm, setCouponForm] = useState({
    name: '',
    discount_type: 'percent' as DiscountType,
    percent_off: '20',
    amount_off: '10',
    currency: 'usd',
    duration: 'once' as CouponDuration,
    duration_in_months: '3',
    max_redemptions: '',
  })
  const [promotionForm, setPromotionForm] = useState({
    coupon: '',
    code: '',
    max_redemptions: '',
    expires_at: '',
  })

  async function loadCoupons() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/coupons')
      const data = await res.json() as CouponsResponse
      if (!res.ok) throw new Error(data.error ?? 'Could not load coupons')
      setCoupons(data.coupons ?? [])
      setPromotionCodes(data.promotionCodes ?? [])
      setMode(data.mode ?? null)
      setPromotionForm(current => ({
        ...current,
        coupon: current.coupon || data.coupons?.[0]?.id || '',
      }))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load coupons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoupons().catch(() => {})
  }, [])

  const activePromotionCodes = useMemo(
    () => promotionCodes.filter(code => code.active).length,
    [promotionCodes]
  )
  const totalRedemptions = useMemo(
    () => promotionCodes.reduce((sum, code) => sum + code.times_redeemed, 0),
    [promotionCodes]
  )

  async function createCoupon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving('coupon')
    setError(null)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_coupon', ...couponForm }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not create coupon')
      setCouponForm(current => ({ ...current, name: '', max_redemptions: '' }))
      await loadCoupons()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create coupon')
    } finally {
      setSaving(null)
    }
  }

  async function createPromotionCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving('promotion_code')
    setError(null)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_promotion_code', ...promotionForm }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not create promotion code')
      setPromotionForm(current => ({ ...current, code: '', max_redemptions: '', expires_at: '' }))
      await loadCoupons()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create promotion code')
    } finally {
      setSaving(null)
    }
  }

  return (
    <main className="max-w-7xl p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Link href="/admin" className="text-on-surface-variant transition-colors hover:text-on-surface" aria-label="Back to admin">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
            <p className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              Revenue controls
            </p>
          </div>
          <h1 className="font-headline text-3xl font-bold text-on-surface">Coupons</h1>
          <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-on-surface-variant">
            Create Stripe coupons and promotion codes for launch discounts, student offers, and tracked partner codes.
          </p>
        </div>
        <Link
          href="/admin/revenue"
          className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2 font-label text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[17px]">payments</span>
          Revenue
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-error/10 px-4 py-3 font-body text-sm text-error">{error}</div>
      )}

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          { label: 'Stripe mode', value: mode ?? (loading ? '...' : 'Not configured') },
          { label: 'Coupons', value: loading ? '...' : coupons.length.toLocaleString() },
          { label: 'Active codes', value: loading ? '...' : activePromotionCodes.toLocaleString() },
          { label: 'Code redemptions', value: loading ? '...' : totalRedemptions.toLocaleString() },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-outline-variant bg-surface-container p-4">
            <p className="font-label text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{stat.label}</p>
            <p className="mt-2 font-headline text-2xl font-bold capitalize text-on-surface">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form onSubmit={createCoupon} className="rounded-2xl border border-outline-variant bg-surface-container p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-headline text-lg font-bold text-on-surface">Create coupon</h2>
              <p className="mt-1 font-body text-xs text-on-surface-variant">Define the discount Stripe will apply.</p>
            </div>
            <span className="material-symbols-outlined text-primary">local_offer</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="font-label text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Name</span>
              <input
                required
                value={couponForm.name}
                onChange={event => setCouponForm(current => ({ ...current, name: event.target.value }))}
                placeholder="Launch 20"
                className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </label>

            <label>
              <span className="font-label text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Discount type</span>
              <select
                value={couponForm.discount_type}
                onChange={event => setCouponForm(current => ({ ...current, discount_type: event.target.value as DiscountType }))}
                className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="percent">Percent</option>
                <option value="amount">Fixed amount</option>
              </select>
            </label>

            {couponForm.discount_type === 'percent' ? (
              <label>
                <span className="font-label text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Percent off</span>
                <input
                  required
                  type="number"
                  min={1}
                  max={100}
                  step="0.01"
                  value={couponForm.percent_off}
                  onChange={event => setCouponForm(current => ({ ...current, percent_off: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </label>
            ) : (
              <div className="grid grid-cols-[1fr_88px] gap-2">
                <label>
                  <span className="font-label text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Amount off</span>
                  <input
                    required
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={couponForm.amount_off}
                    onChange={event => setCouponForm(current => ({ ...current, amount_off: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm text-on-surface focus:border-primary focus:outline-none"
                  />
                </label>
                <label>
                  <span className="font-label text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Currency</span>
                  <input
                    required
                    value={couponForm.currency}
                    onChange={event => setCouponForm(current => ({ ...current, currency: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm uppercase text-on-surface focus:border-primary focus:outline-none"
                  />
                </label>
              </div>
            )}

            <label>
              <span className="font-label text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Duration</span>
              <select
                value={couponForm.duration}
                onChange={event => setCouponForm(current => ({ ...current, duration: event.target.value as CouponDuration }))}
                className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="once">Once</option>
                <option value="repeating">Repeating</option>
                <option value="forever">Forever</option>
              </select>
            </label>

            <label>
              <span className="font-label text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Duration months</span>
              <input
                type="number"
                min={1}
                disabled={couponForm.duration !== 'repeating'}
                value={couponForm.duration_in_months}
                onChange={event => setCouponForm(current => ({ ...current, duration_in_months: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm text-on-surface disabled:opacity-50 focus:border-primary focus:outline-none"
              />
            </label>

            <label className="sm:col-span-2">
              <span className="font-label text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Max redemptions</span>
              <input
                type="number"
                min={1}
                value={couponForm.max_redemptions}
                onChange={event => setCouponForm(current => ({ ...current, max_redemptions: event.target.value }))}
                placeholder="Optional"
                className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving !== null}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 font-label text-sm font-bold text-on-primary transition-opacity disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[17px]">add</span>
            {saving === 'coupon' ? 'Creating...' : 'Create coupon'}
          </button>
        </form>

        <form onSubmit={createPromotionCode} className="rounded-2xl border border-outline-variant bg-surface-container p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-headline text-lg font-bold text-on-surface">Create promotion code</h2>
              <p className="mt-1 font-body text-xs text-on-surface-variant">Attach a customer-facing code to an existing coupon.</p>
            </div>
            <span className="material-symbols-outlined text-primary">confirmation_number</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="font-label text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Coupon</span>
              <select
                required
                value={promotionForm.coupon}
                onChange={event => setPromotionForm(current => ({ ...current, coupon: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="">Select coupon</option>
                {coupons.map(coupon => (
                  <option key={coupon.id} value={coupon.id}>
                    {coupon.name ?? coupon.id} - {formatDiscount(coupon)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="font-label text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Code</span>
              <input
                required
                value={promotionForm.code}
                onChange={event => setPromotionForm(current => ({ ...current, code: event.target.value.toUpperCase() }))}
                placeholder="LAUNCH20"
                className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm uppercase text-on-surface focus:border-primary focus:outline-none"
              />
            </label>

            <label>
              <span className="font-label text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Max redemptions</span>
              <input
                type="number"
                min={1}
                value={promotionForm.max_redemptions}
                onChange={event => setPromotionForm(current => ({ ...current, max_redemptions: event.target.value }))}
                placeholder="Optional"
                className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </label>

            <label className="sm:col-span-2">
              <span className="font-label text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Expires on</span>
              <input
                type="date"
                value={promotionForm.expires_at}
                onChange={event => setPromotionForm(current => ({ ...current, expires_at: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 font-body text-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving !== null || coupons.length === 0}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 font-label text-sm font-bold text-on-primary transition-opacity disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[17px]">add</span>
            {saving === 'promotion_code' ? 'Creating...' : 'Create promotion code'}
          </button>
        </form>
      </section>

      <section className="mb-8 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container">
        <div className="border-b border-outline-variant px-4 py-3">
          <h2 className="font-headline text-lg font-bold text-on-surface">Promotion codes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-sm">
            <thead className="bg-surface-container-high">
              <tr>
                {['Code', 'Coupon', 'Status', 'Redemptions', 'Expires', 'Created'].map(label => (
                  <th key={label} className="px-4 py-3 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {promotionCodes.map(code => (
                <tr key={code.id} className="hover:bg-surface-container-high">
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-on-surface">{code.code}</td>
                  <td className="px-4 py-3">
                    <p className="font-body text-sm text-on-surface">{code.coupon_name ?? code.coupon_id}</p>
                    <p className="font-mono text-[11px] text-on-surface-variant">{code.coupon_id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 font-label text-xs font-semibold ${code.active ? 'bg-primary-fixed text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                      {code.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-sm tabular-nums text-on-surface">{redemptionLabel(code.times_redeemed, code.max_redemptions)}</td>
                  <td className="px-4 py-3 font-body text-xs text-on-surface-variant">{formatUnixDate(code.expires_at)}</td>
                  <td className="px-4 py-3 font-body text-xs text-on-surface-variant">{formatUnixDate(code.created)}</td>
                </tr>
              ))}
              {!loading && promotionCodes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center font-body text-sm text-on-surface-variant">
                    No promotion codes yet.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center font-body text-sm text-on-surface-variant">
                    Loading promotion codes...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container">
        <div className="border-b border-outline-variant px-4 py-3">
          <h2 className="font-headline text-lg font-bold text-on-surface">Coupons</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-surface-container-high">
              <tr>
                {['Name', 'Discount', 'Duration', 'Redemptions', 'Valid', 'Redeem by', 'Created', 'ID'].map(label => (
                  <th key={label} className="px-4 py-3 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {coupons.map(coupon => (
                <tr key={coupon.id} className="hover:bg-surface-container-high">
                  <td className="px-4 py-3 font-body text-sm font-semibold text-on-surface">{coupon.name ?? '-'}</td>
                  <td className="px-4 py-3 font-body text-sm text-on-surface">{formatDiscount(coupon)}</td>
                  <td className="px-4 py-3 font-body text-sm text-on-surface">{formatDuration(coupon)}</td>
                  <td className="px-4 py-3 font-body text-sm tabular-nums text-on-surface">{redemptionLabel(coupon.times_redeemed, coupon.max_redemptions)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 font-label text-xs font-semibold ${coupon.valid ? 'bg-primary-fixed text-primary' : 'bg-error-container text-on-error-container'}`}>
                      {coupon.valid ? 'Valid' : 'Invalid'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-xs text-on-surface-variant">{formatUnixDate(coupon.redeem_by)}</td>
                  <td className="px-4 py-3 font-body text-xs text-on-surface-variant">{formatUnixDate(coupon.created)}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-on-surface-variant">{coupon.id}</td>
                </tr>
              ))}
              {!loading && coupons.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center font-body text-sm text-on-surface-variant">
                    No coupons yet.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center font-body text-sm text-on-surface-variant">
                    Loading coupons...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
