# E2E Test Users

`scripts/seed-test-users.ts` creates the six fixed personas used by the paywall and launch QA suites.

## Required Env

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
E2E_TEST_PASSWORD='use-a-long-shared-test-password'
```

The script uses the Supabase service role key from Node only. Do not expose this key in browser code.

When running a local production server with `next start` and no Upstash Redis, start it with the local-only fallback:

```bash
RATE_LIMIT_MEMORY_FALLBACK=true DISCUSSION_MODERATION_E2E_FALLBACK=true npx next start -p 3002
```

Do not set these fallback flags in production. Production should use `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` so rate limiting is shared across instances, and `OPENAI_API_KEY` so discussion moderation fails closed instead of bypassing review.

## Run

```bash
npx tsx scripts/seed-test-users.ts
```

Safe reset:

```bash
npx tsx scripts/seed-test-users.ts
```

Each run deletes existing auth users matching `e2e+*@hackproduct.com`, then recreates them with the same password.

Dry run:

```bash
npx tsx scripts/seed-test-users.ts --dry-run
```

Help:

```bash
npx tsx scripts/seed-test-users.ts --help
```

## Stripe Test Mode

By default, pro personas get app-level Pro subscription rows with Stripe-shaped test IDs. That is enough for paywall entitlement checks.

For real Stripe test customer and subscription IDs, set a test secret key and monthly test price, then pass `--with-stripe`:

```bash
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_TEST_PRICE_MONTHLY=price_...
npx tsx scripts/seed-test-users.ts --with-stripe
```

The Stripe path refuses live keys. If you need a price ID, run:

```bash
npm run stripe:test-flow
```

Test cards:

- Success: `4242 4242 4242 4242`
- Failed payment: `4000 0000 0000 0341`

## Personas

| Email | State |
| --- | --- |
| `e2e+free-new@hackproduct.com` | Free, no onboarding, no challenges |
| `e2e+free-active@hackproduct.com` | Free, onboarded, 2 completed challenges, streak 2 |
| `e2e+free-capped@hackproduct.com` | Free, onboarded, at Hatch chat and nudge caps |
| `e2e+pro-new@hackproduct.com` | Pro, newly subscribed, trialing |
| `e2e+pro-active@hackproduct.com` | Pro, active subscription, 10 completed challenges, streak 8 |
| `e2e+admin@hackproduct.com` | Admin via `profiles.role = 'admin'` |

The current schema does not have `profiles.is_admin`; admin access is keyed off `profiles.role = 'admin'` across the app and RLS policies.

## Notes For Paywall Tests

`e2e+free-capped@hackproduct.com` is seeded at the monthly limits for `hatch_chat_msgs` and `hatch_nudges`. Its `quick_takes` counter is seeded four below the free plan limit so the fifth quick-take submission crosses the cap.

Pro users are seeded with `profiles.plan = 'pro'` and a matching `subscriptions` row. Stripe webhook scenarios still need Stripe CLI events against real test-mode Stripe IDs, so use `--with-stripe` for N2.8 and N2.9.
