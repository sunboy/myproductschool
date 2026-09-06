# Billing preview gate — September 6, 2026

## Verified in the connected HackProduct test account

The account is `acct_1PnserEGJUB78L7n`, with `livemode=false`.
No live account operations, charges, subscription changes, or webhook creations
were performed during this audit.

| Preview variable | Existing test price | USD amount |
| --- | --- | --- |
| `STRIPE_TEST_PRICE_MONTHLY` | `price_1TbiSTEGJUB78L7nn5ePQKVo` | $39/month |
| `STRIPE_TEST_PRICE_ANNUAL` | `price_1TTTaSEGJUB78L7nRkD275eQ` | $199/year |
| `STRIPE_TEST_PRICE_ANALYTICS_MONTHLY` | `price_1TedjCEGJUB78L7nE9tdkC6T` | $49.99/month |
| `STRIPE_TEST_PRICE_ANALYTICS_ANNUAL` | `price_1TedjDEGJUB78L7nehEgipO1` | $249.99/year |

These match the current US plan amounts in `src/lib/billing/plans.ts`. The
account also has regional prices; the table is not a regional-pricing audit.

The active default test portal configuration is
`bpc_1TTwgyEGJUB78L7nAlA5nFxu`. It enables invoice history, payment-method
updates, customer updates, and cancellation at the end of the billing period.
Subscription price changes are disabled.

Listing test webhook endpoints returned an empty list. Having products/prices
and a portal does not prove checkout-to-entitlement delivery.

## Configuration required before the canary

1. Confirm a preview uses an isolated staging database and test-owned users.
   Test Stripe credentials alone do not isolate application entitlement writes.
2. Configure that preview with `STRIPE_MODE=test`,
   `NEXT_PUBLIC_STRIPE_MODE=test`, a restricted test key in
   `STRIPE_TEST_SECRET_KEY`, its test publishable key, the four test prices above,
   and its own application URL. Store secrets in sensitive deployment variables.
3. Register a test webhook for that verified preview's `/api/stripe/webhook`
   route, using the events handled by the route. Store its signing secret as
   `STRIPE_WEBHOOK_SECRET` on that preview only. Do not reuse a production endpoint
   or production signing secret.
4. Deploy and exercise app checkout, webhook delivery, persisted entitlements,
   portal return, cancellation, and duplicate-event delivery with test-owned data.
   Do not infer success from a Stripe-only API call or a mocked unit test.

The continuation runtime has a read-capable Vercel connection, but no exposed
environment-write tool, Vercel CLI, or `VERCEL_TOKEN`. It has no local test key.
The existing preview previously returned `stripe_not_configured`; this audit
did not change its configuration or claim that a live billing journey passed.

## Code guardrails added in this pass

- Test setup validates the value in `STRIPE_TEST_SECRET_KEY`, refusing live or
  invalid values before constructing the Stripe client or creating products.
- Webhooks validate `event.livemode` against the configured runtime after
  signature verification and before database access. This prevents a
  misconfigured test/live endpoint from applying the opposite mode's events.
- Regression tests use local Stripe-generated signatures, including matching
  modes, mismatched modes, and an invalid signature. They do not contact Stripe.

These guards do not replace staging isolation or end-to-end billing verification.

## Desktop continuation status

Desktop Vercel CLI authentication and the local Stripe test key now work. The earlier cloud-runtime access limitation above is historical. Test prices and account are verified; billing remains deliberately unconfigured on the feature preview because it still uses the production database.

An isolated Supabase branch costs $0.01344/hour (about $0.32/day); the owner's cost confirmation remains pending. An agent prematurely created a branch, whose legacy migration replay failed on duplicate RLS policies. That empty branch was removed, never attached to Vercel, and only main remains. Do not recreate it without the pending approval. A hosted schema baseline or repaired replay must be verified before billing setup.

The prepared additive migration `20260906120000_stripe_event_processing_state.sql` introduces fenced event-processing claims and once-only payment-failure increments. It passed isolated PGlite checks. It must run before enabling the new webhook code; missing RPCs fail closed. No hosted migration, test webhook registration or complete checkout/portal/entitlement journey has passed. Production billing configuration and entitlements remain untouched by the preview test setup.
