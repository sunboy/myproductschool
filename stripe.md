# Stripe and Paywall Audit

Last audited: 2026-05-04

## Current Stripe Account Snapshot

- Connected account: `HackProduct` (`acct_1PnserEGJUB78L7n`)
- Pro product: `prod_UJnkC9dnIfyRhl`
- Live monthly price: `price_1TLA97EGJUB78L7nf8fBRt7J` at `$29/mo`
- Live annual price: `price_1TLA97EGJUB78L7ngjZRwz8Y` at `$199/yr`
- Current local `STRIPE_SECRET_KEY` is not a usable Stripe SDK key. It starts with `mk_`, and the Stripe SDK rejects it. Use a standard `sk_live_...` key for live or `sk_test_...` for local test mode.
- `STRIPE_WEBHOOK_SECRET` is empty locally, so signed webhook handling cannot be verified until `stripe listen` provides a `whsec_...` secret.

## Changes Made

- Centralized Pro pricing in `src/lib/billing/plans.ts`.
- Updated checkout fallback prices and visible paywall/pricing UI to match Stripe: `$29/mo` and `$199/yr`.
- Added Stripe runtime config in `src/lib/stripe/config.ts`.
- Added support for test mode:
  - `STRIPE_MODE=test`
  - `NEXT_PUBLIC_STRIPE_MODE=test`
  - `STRIPE_TEST_SECRET_KEY=sk_test_...`
  - `NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...`
  - `STRIPE_TEST_PRICE_MONTHLY=price_...`
  - `STRIPE_TEST_PRICE_ANNUAL=price_...`
- Hardened checkout creation:
  - Rejects missing or mode-mismatched Stripe keys with a clear `503`.
  - Sets `client_reference_id` to the Supabase user id.
  - Stores `user_id`, `plan`, and `stripe_mode` metadata on the Checkout Session and Subscription.
  - Applies HackProduct Checkout-session branding using `/images/logo.png` as the icon and `/images/wordmark.png` as the logo.
- Hardened webhook entitlement sync:
  - `checkout.session.completed` now reads `client_reference_id` or `metadata.user_id`.
  - Subscription updates now update `profiles.plan` to `pro` only for `active` or `trialing`; other subscription states sync back to `free`.
- Fixed embedded checkout so the modal does not create a duplicate Checkout Session before rendering Stripe Checkout.

## Test Stripe Flow

Generate or reuse test-mode Pro prices:

```bash
STRIPE_TEST_SECRET_KEY=sk_test_... npm run stripe:test-flow
```

Optionally create a test Payment Link for a quick Stripe-hosted smoke test:

```bash
STRIPE_TEST_SECRET_KEY=sk_test_... npm run stripe:test-flow -- --payment-link
```

The script prints the `STRIPE_TEST_PRICE_MONTHLY` and `STRIPE_TEST_PRICE_ANNUAL` values to add to local env. Payment Links are useful for visually checking Stripe-hosted checkout, but they do not carry app user metadata. For entitlement QA, use the app checkout flow while logged in.

## Local Webhook QA

1. Set local test env:

```bash
STRIPE_MODE=test
NEXT_PUBLIC_STRIPE_MODE=test
STRIPE_TEST_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...
STRIPE_TEST_PRICE_MONTHLY=price_...
STRIPE_TEST_PRICE_ANNUAL=price_...
```

2. Start the app:

```bash
npm run dev
```

3. Forward webhooks:

```bash
stripe listen --api-key sk_test_... --forward-to localhost:3000/api/stripe/webhook \
  --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted
```

4. Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`, restart the app, then complete checkout with a Stripe test card such as `4242 4242 4242 4242`.

Expected result: `profiles.plan` becomes `pro`, `subscriptions` is upserted with the Stripe customer/subscription ids, and `/api/usage/me` returns Pro limits.

## Branding Assets

Stripe branding requirements: PNG/JPG, under 512KB, at least 128x128. The selected assets pass those checks:

- Icon: `public/images/logo.png` (`1254x1254`, ~379KB)
- Logo / wordmark: `public/images/wordmark.png` (`2172x724`, ~318KB)

Validate assets without mutating Stripe:

```bash
npm run stripe:branding -- --dry-run
```

Attempt an API branding update with a standard key:

```bash
STRIPE_SECRET_KEY=sk_live_... npm run stripe:branding -- --live
```

Stripe rejected account-level branding updates in test mode with `Only live keys can access this method.` Test Checkout still receives the per-session branding override from the app checkout route. For account-wide branding, use a standard live key or upload these exact assets in Stripe Dashboard → Branding settings.

## Stripe References

- Account branding requirements and where branding appears: https://docs.stripe.com/get-started/account/branding
- Checkout `branding_settings` override: https://docs.stripe.com/payments/checkout/customization/appearance?integration=api&payment-ui=stripe-hosted
