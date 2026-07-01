# Runbook: Changing Limits, Pricing, and Running Promotions

Last updated: 2026-06-12. Everything here is operator-level: no code changes
needed for the common cases.

## TL;DR — which lever for which job

| I want to... | Lever | Deploy needed? | Takes effect |
|---|---|---|---|
| Raise/lower free or Pro limits (challenges, interviews, AI budgets) | `/admin/paywall-config` UI | No | ~60 seconds |
| Run a discount promo (e.g. 50% off 3 months) | Promo code via `scripts/billing/create-promo.ts` or Stripe Dashboard | No | Immediately |
| Permanently change the Pro/Analytics price | New Stripe price + Vercel env var | Yes (redeploy) | On deploy |

---

## 1. Changing limits (free or Pro allowances)

**Source of truth:** the `plan_limits` table. Enforcement (`checkUsageLimit`)
and all user-facing copy read it live with a 60s cache.

**Process:**
1. Go to `/admin/paywall-config` (requires `profiles.role = 'admin'`).
2. Click Edit on the row (e.g. `free / challenges`), change the limit, Save.
3. Done. Within ~60s this propagates to:
   - Enforcement (402s at `/api/challenges/[id]/start`, `/api/live-interview/start`)
   - Pricing page copy (`/pricing` free + Pro cards and comparison table)
   - All paywall gates and upgrade modals (they fetch `/api/billing/limits`)

**Notes:**
- dev and prod share the same Supabase DB, so a change here is live everywhere
  at once. There is no staging lever.
- Limits are rolling 30-day windows counted from `usage_events`, not calendar
  months. Lowering a limit can immediately gate users who are over the new cap.
- Code fallbacks exist for DB-unreachable moments only. If you make a
  *permanent* change, sync them in the next regular deploy (cosmetic, not urgent):
  - `src/lib/usage/check-limit.ts` → `FALLBACK_LIMITS`
  - `src/lib/usage/public-limits.ts` → `DEFAULT_PLAN_LIMITS`
  - `src/context/SessionContext.tsx` → `DEFAULT_USAGE`
- Granular AI sub-limits (chat msgs, nudges, quick takes...) also live in
  `plan_limits` and are editable the same way; their fallbacks are in
  `src/lib/usage/assert-plan-limit.ts`.
- For audit history, optionally record the change as a migration in
  `supabase/migrations/` (see `20260611120000_free_quota_20_5.sql` as a template).

## 2. Running a promotion (discount codes)

Checkout already passes `allow_promotion_codes: true`, so any active Stripe
promotion code can be typed at checkout. Nothing to deploy.

**Process (script):**
```bash
# 50% off the first 3 months, code LAUNCH50, capped at 100 redemptions
ENV_PATH=.env.production.local npx tsx scripts/billing/create-promo.ts \
  --code LAUNCH50 --percent 50 --duration repeating --months 3 --max-redemptions 100

# Flat $10 off once, auto-expires July 31
ENV_PATH=.env.production.local npx tsx scripts/billing/create-promo.ts \
  --code SUMMER10 --amount-off 1000 --duration once --expires 2026-07-31
```
The env file's `STRIPE_SECRET_KEY` decides test vs live mode. Use
`.env.local` (sk_test_) to rehearse, then the prod env file (sk_live_) for real.

**Process (dashboard):** Stripe Dashboard → Product catalog → Coupons →
Create coupon → then "Add promotion code" on the coupon. Same result.

**Ending a promo:** deactivate the promotion code in the Dashboard (or
`stripe promotion_codes update <id> --active=false`). Existing subscribers
keep the discount per the coupon's duration.

**Promo + limits combo:** for a "promo month" with raised limits, pair a promo
code with a temporary bump in `/admin/paywall-config` — and calendar-remind
yourself to revert the limits, nothing reverts automatically.

## 3. Permanently changing the price

Display price on `/pricing` is fetched live from Stripe, but checkout uses the
price ID pinned in env vars, so a price change is: new Stripe price → swap env.

1. Stripe Dashboard → the Pro product → Add another price (e.g. $29/mo).
   Don't edit the old price (Stripe prices are immutable anyway); existing
   subscribers keep their current price unless you migrate them.
2. Copy the new `price_...` id into the matching Vercel Production env var:
   - `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL` (Pro)
   - `STRIPE_PRICE_ANALYTICS_MONTHLY` / `STRIPE_PRICE_ANALYTICS_ANNUAL`
   (test mode uses `STRIPE_TEST_PRICE_*`)
3. Redeploy. `/pricing` and checkout pick up the new price together.
4. Update the cosmetic fallback `unitAmount` in `src/lib/billing/plans.ts`
   (`BILLING_PLANS` / `ANALYTICS_PLANS`) in the next regular commit.
5. Verify with `ENV_PATH=.env.production.local npx tsx scripts/audit/verify-prod-stripe-config.ts`
   — it checks the env price IDs resolve in live mode (its expected-amount
   check reads the plans.ts fallback, another reason to do step 4).

**Temporary sale price?** Don't swap prices — use a promotion code (section 2).
Price swaps are for permanent repricing only.

## 4. Sanity checks after any change

```bash
# What enforcement + copy currently see (free/pro x challenges/interviews)
curl -s https://www.hackproduct.com/api/billing/limits

# Full plan_limits state
# (Supabase SQL editor) SELECT plan, feature, limit_value, window_days FROM plan_limits ORDER BY plan, feature;

# Stripe config health (live)
ENV_PATH=.env.production.local npx tsx scripts/audit/verify-prod-stripe-config.ts
```
