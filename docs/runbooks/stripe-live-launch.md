# Stripe Live Launch Runbook

Operational checklist for flipping HackProduct's Stripe integration from `STRIPE_MODE=test` to live. Use this once when going live, and again any time the live Stripe account changes (key rotation, webhook endpoint move, price changes, etc.).

Companion docs:
- Audit log: [`docs/notes/stripe-paywall-audit.md`](../notes/stripe-paywall-audit.md) — what was verified, known gaps, bug fixes shipped
- Verification script: [`scripts/audit/verify-prod-stripe-config.ts`](../../scripts/audit/verify-prod-stripe-config.ts) — run this after completing the manual steps below

**Estimated time**: 30–60 minutes of clicking + however long Stripe Tax registration takes if not already done.

---

## Pre-flight (5 min)

Confirm you have:

- [ ] Stripe Dashboard access on the live account (`acct_1PnserEGJUB78L7n`)
- [ ] Vercel (or your production env) access to set environment variables
- [ ] Supabase project access for prod migrations
- [ ] A real credit card for the post-launch smoke test
- [ ] Resend dashboard access if email config needs touching

---

## Step 1 — Decide on pricing (5 min think)

Current live state (verified 2026-05-27 via Stripe MCP):

- Monthly: `price_1TLA97EGJUB78L7nf8fBRt7J` — **$29.00/month**
- Annual: `price_1TLA97EGJUB78L7ngjZRwz8Y` — **$199.00/year**

Code + UI defaults in the repo are **$39/month** (see `src/lib/billing/plans.ts`). Three options:

| Option | Action | Notes |
|--------|--------|-------|
| **A — keep $29 live** | Update `src/lib/billing/plans.ts` to `$29` | Cleanest. Test mode was updated to $39 during audit; you can either match (revert test) or leave the mismatch (test mirrors planned future price) |
| **B — raise live to $39** | Create new $39 price on `prod_UJnkC9dnIfyRhl`, archive old $29 | Existing customers stay grandfathered on the old price unless you migrate them |
| **C — $29 is launch, $39 later** | Keep both, document the migration date | Same setup as A today; revisit at launch+6mo |

**Recommendation**: Option A for launch — match code to reality. Tweak pricing post-launch when you have real conversion data.

## Step 1A — Create Claude Code Analytics prices (only required when enabling Claude Code Analytics)

Skip this step unless `NEXT_PUBLIC_CC_ANALYTICS_ENABLED=true` is part of the launch.

Stripe Dashboard → **Product catalog → Add product** (live mode):

- [ ] Product name: `HackProduct Analytics`
- [ ] Monthly recurring price: `$49.99/month` → save the `price_...` ID as `STRIPE_PRICE_ANALYTICS_MONTHLY`
- [ ] Annual recurring price: `$254.99/year` → save the `price_...` ID as `STRIPE_PRICE_ANALYTICS_ANNUAL`

Then add these production env vars before deploying the analytics launch:

```env
STRIPE_PRICE_ANALYTICS_MONTHLY=price_...
STRIPE_PRICE_ANALYTICS_ANNUAL=price_...
NEXT_PUBLIC_CC_ANALYTICS_ENABLED=true
```

---

## Step 2 — Register the live webhook endpoint (10 min)

Stripe Dashboard → **Developers → Webhooks → Add endpoint** (toggle to **Live mode** in the top-right first).

**Endpoint URL**: `https://hackproduct.com/api/stripe/webhook`

**Events to subscribe** (copy this list — 16 events; everything the handler covers):

```
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
customer.subscription.paused
customer.subscription.resumed
customer.subscription.trial_will_end
invoice.paid
invoice.payment_failed
invoice.payment_action_required
charge.refunded
charge.dispute.created
charge.dispute.closed
charge.dispute.updated
charge.dispute.funds_withdrawn
charge.dispute.funds_reinstated
```

After creation:

1. Click the new endpoint → **Signing secret** → Reveal → copy
2. Paste into prod env as `STRIPE_WEBHOOK_SECRET=whsec_...`
3. Click **Send test webhook** in Stripe → send a `checkout.session.completed` event → confirm **200 OK** response in the delivery log

**Affiliate / Connect events** — only subscribe if launching with Connect payouts:
```
account.updated
v2.core.account.updated
```

---

## Step 3 — Configure the Billing Portal (5 min)

Stripe Dashboard (live mode) → **Settings → Billing → Customer portal**

Toggle ON:
- [ ] Customers can update payment method
- [ ] Customers can cancel subscriptions
- [ ] Customers can switch plans (between monthly and annual)
- [ ] Customers can view invoice history

Optional but recommended:
- [ ] Cancellation reasons enabled — collects "why did you cancel" data, useful for retention analysis
- [ ] Pause subscription disabled — adds complexity, low value at this scale

Save. The default config is what `POST /api/stripe/portal` will use automatically. If you want a non-default config, capture its `bpc_...` ID and add `STRIPE_BILLING_PORTAL_CONFIG_ID=bpc_...` to prod env (the create-portal route would need a one-line code change to honor it).

---

## Step 4 — Stripe Tax registration (varies, can take days for new jurisdictions)

Stripe Dashboard (live mode) → **Tax → Registrations**

The code has `automatic_tax: { enabled: true }` in `src/app/api/stripe/create-checkout/route.ts`, so tax calculation only works in jurisdictions where you're registered.

**Minimum for US launch**: California. Add others as revenue thresholds hit (Stripe Tax → Monitoring tab shows when you're approaching a state's threshold).

**International**: each EU country, UK, Canada, etc. needs separate registration. Defer unless you have known international customers.

If you skip this step entirely:
- Tax will show as $0 on invoices
- You may owe back taxes when audited
- For closed-beta / friends-and-family launch only — not a public launch

**This has tax-law implications. Defer to your accountant if uncertain.**

---

## Step 5 — Stripe Connect (only if launching affiliates)

Stripe Dashboard (live mode) → **Connect → Accounts**

If launching with the affiliate program:
- [ ] At least one test affiliate has completed Connect onboarding end-to-end
- [ ] Affiliate payout schedule configured (Stripe defaults to daily auto-payout)
- [ ] `STRIPE_AFFILIATE_COUPON_ID=1kgAyNZl` exists in live mode (✓ confirmed — "Affiliate Launch 20", 20% off, repeating)

If NOT launching affiliates yet, skip this step. The webhook handler tolerates zero Connect accounts; the affiliate code paths short-circuit when no referral cookie/metadata is present.

---

## Step 6 — Set production environment variables (5 min)

In Vercel (or your prod env provider), set these. Mark any test-mode equivalents as **REMOVE**.

```env
# Mode
STRIPE_MODE=live

# Keys — from Stripe Dashboard (live) → Developers → API keys
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Product + prices — from Step 1 decision
STRIPE_PRODUCT_PRO=prod_UJnkC9dnIfyRhl
STRIPE_PRICE_MONTHLY=price_1TLA97EGJUB78L7nf8fBRt7J     # $29 (Option A) — update if Option B
STRIPE_PRICE_ANNUAL=price_1TLA97EGJUB78L7ngjZRwz8Y      # $199

# Webhook signing secret — from Step 2
STRIPE_WEBHOOK_SECRET=whsec_...

# Affiliates — already exists; verify scope is live
STRIPE_AFFILIATE_COUPON_ID=1kgAyNZl

# Email — verify these are set in prod (same values as dev/.env.local)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=...
RESEND_REPLY_TO=...

# App URL — must be the canonical prod domain for Checkout success redirects
NEXT_PUBLIC_APP_URL=https://hackproduct.com
```

**REMOVE from prod env** (if present):
- `STRIPE_TEST_SECRET_KEY`
- `STRIPE_TEST_PRICE_MONTHLY`
- `STRIPE_TEST_PRICE_ANNUAL`
- `NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY`
- `STRIPE_TEST_AFFILIATE_COUPON_ID`
- `NEXT_PUBLIC_STRIPE_MODE=test`

Deploy. Confirm the deployment uses the new env.

---

## Step 7 — Confirm prod migrations are applied (2 min)

```bash
# From the prod Supabase project (Dashboard → SQL Editor):
SELECT * FROM plan_limits WHERE plan='free' ORDER BY feature;
# Expected rows: challenges=3, interviews=1, others as documented

SELECT * FROM information_schema.tables WHERE table_name='stripe_events';
# Expected: 1 row — table exists
```

If either query returns unexpected results, the migrations weren't applied. Run:
```bash
supabase db push --linked
```
…and confirm again.

---

## Step 8 — Customer backfill check (5 min)

```sql
SELECT user_id, stripe_customer_id
FROM subscriptions
WHERE stripe_customer_id IS NOT NULL;
```

If this returns **rows** in prod: those `cus_...` IDs were created in test mode and **do not exist in live**. Options:
- **Null them out** (cleanest if no real subscriptions yet): `UPDATE subscriptions SET stripe_customer_id = NULL, stripe_subscription_id = NULL, plan='free', status='active' WHERE stripe_customer_id LIKE 'cus_%';`
- **Migrate manually** (if these users actually paid you in test mode and you want to honor it): create real Connect customers via Stripe API and update the rows

If the query returns **no rows**: nothing to do. Move on.

---

## Step 9 — Run the verification script (2 min)

```bash
# From the project root, with prod env loaded:
npx tsx scripts/audit/verify-prod-stripe-config.ts
```

Expected: all green checks. Any red item must be fixed before proceeding to Step 10.

---

## Step 10 — Production smoke test (10 min)

Pick a real credit card (yours). Do not use a Stripe test card in live mode — it will fail.

1. Open https://hackproduct.com in an incognito window
2. Sign up with a fresh email
3. Complete onboarding + calibration
4. Trigger the paywall (do something gated, or click an upgrade CTA)
5. Subscribe with the real card → 7-day free trial means $0 today
6. Confirm:
   - [ ] Receipt email lands in your inbox within 1 min
   - [ ] Dashboard shows Pro state (`UpgradedBanner` visible)
   - [ ] Stripe Dashboard → Webhooks → endpoint → recent deliveries: 200 OK for `checkout.session.completed` + `customer.subscription.created`
   - [ ] Previously-gated content now accessible
7. Open Billing Portal → cancel subscription
8. Confirm:
   - [ ] Cancellation email lands
   - [ ] Stripe Dashboard shows `cancel_at_period_end=true`
   - [ ] App still shows Pro until period end (this is correct behavior)
9. (Optional, day 7 of trial) wait for `invoice.payment_failed` because the card was cancelled, or use Stripe Dashboard to issue a refund and confirm downgrade

**If anything fails this checklist, do not announce launch.** Roll back env vars to test mode, debug, retry.

---

## Step 11 — Post-launch monitoring (ongoing)

Set up these alerts. Skipping these means you find out about Stripe outages from users, not from monitoring.

- [ ] **Stripe Dashboard → Developers → Webhooks → endpoint → Edit → Notifications**: enable email alerts on endpoint failure
- [ ] **Sentry / log monitoring**: alert on `[stripe.webhook]` console.error patterns
- [ ] **DB monitoring**: weekly query for `SELECT count(*) FROM stripe_events WHERE received_at > now() - interval '7 days' GROUP BY type` — confirms event volume matches expectations
- [ ] **Email deliverability**: weekly query for `SELECT template, status, count(*) FROM email_dedupes WHERE created_at > now() - interval '7 days' GROUP BY template, status` — surfaces silent Resend failures

---

## Rollback procedure

If launch goes wrong:

1. In Vercel (or env provider): set `STRIPE_MODE=test`, restore `STRIPE_TEST_*` vars
2. Deploy
3. Open the webhook endpoint in Stripe Dashboard (live) → **disable** (don't delete — preserves signing secret for next attempt)
4. Communicate to any users who subscribed in the brief live window (Stripe → Customers → filter recent → email)
5. Debug, fix, retry from Step 1

---

## Known limitations / post-launch backlog

Carried over from the audit (not blockers, document only):

- **CODEX-5 dispute funds events** (`charge.dispute.funds_withdrawn` / `funds_reinstated`) are code-review-verified but not end-to-end tested — Stripe CLI can't trigger them. Validate on the first real dispute that lands.
- **CODEX-6 partial refunds** are intentionally no-op. Support handles via Supabase dashboard: `UPDATE profiles SET pro_access=false WHERE id='...'`. Document this in your support runbook when there is one.
- **3DS / declined card flows** — verified in test mode, not yet in live. Low risk because the code paths are identical, but consider a small-amount live charge with a 3DS-required card you control as belt-and-suspenders.
- **Mid-subscription dunning with real card** — covered by `stripe trigger invoice.payment_failed` only. The first real failed renewal will be the real test. Monitor `email_dedupes` for `payment_failed` rows.
