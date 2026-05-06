# Affiliate Workflow

Affiliate referrals use Stripe Promotion Codes for attribution and Stripe Connect transfers for payouts.

Required environment:

- `NEXT_PUBLIC_ENABLE_AFFILIATES=true`: build-time flag that exposes affiliate UI and enables affiliate routes.
- `STRIPE_AFFILIATE_COUPON_ID`: live Stripe coupon used when creating affiliate promotion codes.
- `STRIPE_TEST_AFFILIATE_COUPON_ID`: optional test-mode coupon override.
- `AFFILIATE_HASH_SECRET`: HMAC key for hashing referral click IP and user-agent signals.
- `CRON_SECRET`: authorizes `/api/cron/affiliate-payouts`.

Stripe setup:

- Enable Stripe Connect in the Stripe Dashboard before launch. `/api/affiliate/signup` creates Express connected accounts, and Stripe rejects that call until Connect is activated for the account.
- Create the shared affiliate coupon in live mode and set `STRIPE_AFFILIATE_COUPON_ID`. For test runs, create a test-mode coupon and set `STRIPE_TEST_AFFILIATE_COUPON_ID`.
- Keep the coupon terms in Stripe. The app creates one Promotion Code per affiliate against that shared coupon.
- Keep `NEXT_PUBLIC_ENABLE_AFFILIATES` unset until Connect, coupon ids, hash secret, and the real signup smoke are verified.
- When `NEXT_PUBLIC_ENABLE_AFFILIATES` is not exactly `true`, affiliate behavior is disabled across the active app surface: affiliate signup routes return unavailable, referral redirects do not set cookies, auth callbacks do not apply referral attribution, checkout does not pre-apply affiliate promotion codes, webhooks do not create affiliate commissions, and affiliate payout cron returns a disabled no-op response.

Flow:

1. A logged-in user opens `/affiliate` and creates an affiliate account.
2. `/api/affiliate/signup` creates a Stripe promotion code and a Stripe Express connected account.
3. The affiliate completes Stripe onboarding through the account link.
4. `/r/[code]` records a hashed click, stores `ref_code` for 30 days, and redirects to `/?ref=CODE`.
5. Email and OAuth signup callbacks read `ref_code` and write `profiles.referral_source` plus `profiles.affiliate_id`.
6. Checkout pre-applies the affiliate promotion code for attributed users.
7. `invoice.paid` inserts one pending `affiliate_commissions` row per invoice.
8. `/api/cron/affiliate-payouts` runs monthly and creates Stripe transfers for active connected accounts.

Operational notes:

- Keep affiliate discount terms in the shared Stripe coupon; each affiliate gets a distinct promotion code attached to that coupon.
- Pending affiliates can accrue commissions, but transfers only run after Connect has an active transfers capability.
- Duplicate `invoice.paid` webhooks are idempotent through the `(affiliate_id, invoice_id)` commission uniqueness constraint.
- Vercel cron schedule is `0 0 1 * *`. If the deployment plan allows only two cron jobs, move this route into the existing daily maintenance fanout with a first-day-of-month guard.
