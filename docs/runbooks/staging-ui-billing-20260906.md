# Staging Stripe UI billing evidence — September 6, 2026

This browser canary used only isolated Supabase branch `fkqsjjiunvvclwtgjqyc`, Stripe TEST account `acct_1PnserEGJUB78L7n`, synthetic staging customer `cus_VD8uoGxB0kKnmM`, and the feature-branch preview. It did not change production billing objects or production database records.

## Checkout entitlement — pass

The Stripe-hosted Checkout page accepted a standard TEST Visa ending in `4242`, future expiry, CVC, and a synthetic US billing address. Link enrollment remained unchecked. Checkout returned to the application dashboard, where the Pro badge and “Welcome Pro” message rendered.

| Evidence | Value |
| --- | --- |
| Checkout Session | `cs_test_b18hfbXFYVokmeMV3klsncLYU0gFeulV9YCpZKudh8IpECb7b0UcPInDLM` |
| Checkout state | `complete`, `paid`, TEST mode |
| Subscription | `sub_1UCmgYEGJUB78L7n1GtSov2Y` |
| Subscription state after Checkout | `trialing`, monthly |
| Price | `price_1TbiSTEGJUB78L7nn5ePQKVo`, $39/month |
| Payment method | Stripe TEST Visa ending in `4242` |

Signed `checkout.session.completed` event `evt_1UCmgZEGJUB78L7nfW7G8iOx` was processed once in staging with `attempt_count=1`, a non-null `processed_at`, a cleared processing lease, and no error. The authenticated `/api/profile` response reported Pro access.

## Payment-method challenge — pass

Stripe's standard TEST card that requires 3DS completed its hosted challenge for a $39 TEST payment. The browser returned to the application successfully.

## Customer portal cancellation — pass

The Stripe TEST portal initially showed an active HackProduct Pro trial with renewal details and the TEST payment method. After scheduling cancellation, it showed “Cancels Sep 13” and offered the option to reverse the cancellation. Returning from the portal reached the application successfully.

Stripe represented the end-of-trial cancellation as `cancel_at=1789331344` (`2026-09-13T20:29:04.000Z`), equal to the subscription period end, with `canceled_at=1788726723`; `cancel_at_period_end` remained `false`. This representation matters because the portal scheduled a cancellation even though the period-end boolean alone did not indicate one.

The corresponding signed `customer.subscription.updated` event `evt_1UCmjQEGJUB78L7n2IvnPnTm` was processed once in staging with `attempt_count=1`, a non-null `processed_at`, a cleared processing lease, and no error. Before cleanup, the subscription remained `trialing`; the stored and hosted effective plan remained Pro.

## Exact TEST cleanup — pass

After capturing the UI evidence, cleanup reverified the exact Checkout Session, subscription, TEST account, customer, staging user metadata, and TEST mode before canceling only `sub_1UCmgYEGJUB78L7n1GtSov2Y`.

Signed TEST deletion event `evt_1UCmlDEGJUB78L7nqPKDHFCU` was processed once with `attempt_count=1`, a non-null `processed_at`, a cleared processing lease, and no error. The final state was:

- Stripe subscription: canceled.
- Staging subscription row: `plan=free`, `status=canceled`.
- Staging profile: `plan=free`, `pro_access=false`, `subscription_status=canceled`.
- Authenticated hosted profile: effective plan Free with `pro_access=false`.
- Nonterminal Stripe subscriptions for the staging customer: zero.
- Open Stripe Checkout Sessions for the staging customer: zero.

An earlier owned API-canary Checkout Session, `cs_test_b1mVlbXX9cmmO5NxbkilSbOJi2CEwiOpGdGQSs69WIB4BRP1bgPVMduzlH`, was still open after subscription cleanup. Its TEST account, customer, user metadata, plan, and staging ownership were reverified at `2026-09-06T16:44:02Z` before it alone was expired. It was not used as failed-event evidence.

The screenshots are indexed in [the staging browser evidence](../visual-overhaul/evidence/staging-20260906/README.md).
