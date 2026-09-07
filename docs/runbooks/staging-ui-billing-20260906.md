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

## Optional 3DS challenge — pass

Follow-up canary (September 6-7, 2026) ran the real Stripe test-mode 3DS
challenge (the "3D Secure 2 Test Page" ACS iframe) end to end, both authenticate
paths:

- **Authenticate and succeed** (`4000 0025 0000 3155`): Checkout Session
  `cs_test_b1nbsYyxTa2bLp7aOK8Pa1z6MvaTgdB1JGDj2Oi4BbKSRDLgzKiB6gJQqq` completed,
  subscription `sub_1UCsSDEGJUB78L7nIbf0ajTE` created `trialing`. Signed events
  `checkout.session.completed` (`evt_1UCsSEEGJUB78L7nWedogdvG`), `invoice.paid`
  (`evt_1UCsSFEGJUB78L7n7aNfe6W9`), and `customer.subscription.created`
  (`evt_1UCsSGEGJUB78L7nG8oXHWSR`) each processed exactly once. Profile reached
  `pro_access=true`. Cleaned up via cancellation event `evt_1UCsTFEGJUB78L7nPqg7PMK6`.
- **Authenticate and fail** (`4000 0000 0000 3220`): Checkout Session
  `cs_test_b10LZeCNE40QfBb3kLAg9VKexLamU6mLYXEIzaUlzOKWZGmx6O0Yj8JoBX` never
  completed (no subscription, no new webhook events); profile and subscription
  state were unchanged from Free. The dangling open session was expired.

Full evidence, screenshots, and event IDs are in
[the 3DS evidence folder](../visual-overhaul/evidence/staging-20260906/stripe-3ds/README.md).

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

## Settings explicit-cancellation representation — display pass, reactivation failure

Candidate `cf7e9fee` correctly rendered Stripe's explicit end-of-trial cancellation representation: subscription `sub_1UCnbmEGJUB78L7nBviwSiZK` was `trialing` with `cancel_at=1789334894`, `cancel_at_period_end=false`, and `current_period_end=1789334894`. Both Settings surfaces showed **Access ends**, the September 13 date, and **Keep Pro**. The browser evidence is [settings-explicit-cancel-date-cf7e9fee.png](../visual-overhaul/evidence/staging-20260906/settings-explicit-cancel-date-cf7e9fee.png).

After password reauthentication succeeded, selecting **Keep Pro** failed with “Billing update failed.” Vercel request `tlw44-1788730280579-8e48797339ea` at `2026-09-06T21:31:20Z` returned HTTP 500 from `POST /api/billing/subscription`. Stripe request `req_83iaFtD4bk29o3` reported `StripeInvalidRequestError` / `invalid_request_error`: “Received both cancel_at_period_end and cancel_at parameters. Please pass in only one.” Stripe supplied no `code` or `param`. The failure screenshot is [settings-keep-pro-failure-cf7e9fee.png](../visual-overhaul/evidence/staging-20260906/settings-keep-pro-failure-cf7e9fee.png). A route correction that sends only `cancel_at: null` for this provider state is pending deployment and browser recheck.

The exact failed fixture was cleaned up after evidence capture. Its pre-cleanup state is preserved at `.vercel/staging-settings-reactivate-failed-cf7e9fee.json` with mode `0600`. Guarded cleanup canceled only `sub_1UCnbmEGJUB78L7nBviwSiZK`; signed TEST deletion event `evt_1UCnn3EGJUB78L7naSvJ71Y0` was processed once with `attempt_count=1`, non-null `processed_at`, cleared processing lease and token, and no error. Final independent verification found:

- Stripe subscription state: `canceled`, TEST mode.
- Staging subscription mirror: `plan=free`, `status=canceled`, `cancel_at_period_end=false`, `cancel_at=null`.
- Staging profile and authenticated hosted profile: Free, `pro_access=false`, `subscription_status=canceled`.
- Nonterminal Stripe subscriptions for staging customer `cus_VD8uoGxB0kKnmM`: zero.

## Settings reactivation retry — pass

Candidate `b01d65855e1620731a950cfe26a980b2e98ceb8b`, deployed as `dpl_3Mhe4EHhhtsCVNW3Lcyj8tTm8oJh`, passed the exact explicit-date reactivation retry. Guarded run `3c0107d1-55ab-4997-8c96-7f4a35b6498f` created only TEST subscription `sub_1UCoE1EGJUB78L7nYcTOpach`. Genuine creation event `evt_1UCoE2EGJUB78L7n4ccxxoIl` and explicit-date update event `evt_1UCoE5EGJUB78L7nIiR5SxrF` processed before the browser check. Stripe represented the pending cancellation with `cancel_at=1789337265`, equal to `current_period_end`, and `cancel_at_period_end=false`.

After successful password reauthentication, **Keep Pro** completed without the previous failure. Stripe cleared the cancellation to `cancel_at=null`, `cancel_at_period_end=false`, and `canceled_at=null` while the subscription remained `trialing`. Genuine update event `evt_1UCoGOEGJUB78L7nSZE68IZw` carried the same null/false state, reached `pending_webhooks=0`, and processed once in staging with `attempt_count=1`, a non-null `processed_at`, a cleared processing lease and token, and no error. The subscription mirror remained Pro/trialing/monthly; the profile and authenticated hosted profile reported Pro access. Reloaded Settings showed **Next billing** and **Cancel at renewal**. Browser evidence is [settings-reactivation-confirmed-b01d6585.png](../visual-overhaul/evidence/staging-20260906/settings-reactivation-confirmed-b01d6585.png).

The exact retry fixture was then cleaned up under its TEST-account, customer, subscription, user, metadata, and run-ID guards. Signed deletion event `evt_1UCoNAEGJUB78L7nored50ic` reached `pending_webhooks=0` and processed once with `attempt_count=1`, non-null `processed_at`, cleared processing lease and token, and no error. Final independent verification found the Stripe subscription canceled, the staging subscription row `plan=free` and `status=canceled`, both database and authenticated hosted profiles Free with `pro_access=false`, and zero nonterminal subscriptions for the staging customer. The verified pre-cleanup state is preserved mode `0600` at `.vercel/staging-settings-reactivate-retry-verified-b01d6585.json`; the final cleanup state remains mode `0600` at `.vercel/staging-settings-reactivate-retry-state.json`.

## Settings immediate post-action reactivation — pass

Candidate `7e3c4d2822abee64560fc9db3d12734729618457`, deployment `dpl_4gzMyq6K7V9xeAxaS5C8qHfJECpS`, passed the first-read reactivation check. The guarded fixture created only TEST subscription `sub_1UCocKEGJUB78L7ntGwmPc7L`; creation event `evt_1UCocLEGJUB78L7nbNJ8Ohys` and explicit-date update event `evt_1UCocNEGJUB78L7nvs4vDuuX` were each processed once with non-null `processed_at`, cleared processing lease/token, and no error. Stripe represented the pending cancellation as `cancel_at=1789338772`, equal to `current_period_end`, with `cancel_at_period_end=false`.

After password confirmation and **Keep Pro**, the first post-action Settings read showed **Next billing** and **Cancel at renewal** without a reload. Provider inspection found `cancel_at=null` and `cancel_at_period_end=false` while the subscription remained `trialing`; genuine update event `evt_1UCoeaEGJUB78L7nzlA367xR` was processed once with non-null `processed_at`, cleared processing lease/token, and no error. Database and authenticated hosted mirrors remained Pro. Evidence: [settings-immediate-reactivation-7e3c4d28.png](../visual-overhaul/evidence/staging-20260906/settings-immediate-reactivation-7e3c4d28.png) and mode-`0600` `.vercel/staging-settings-reactivate-immediate-verified-7e3c4d28.json`.

The guarded cleanup canceled only `sub_1UCocKEGJUB78L7ntGwmPc7L`. Signed TEST deletion event `evt_1UCofSEGJUB78L7nvCAI6HQK` was processed once with non-null `processed_at`, cleared processing lease/token, and no error. Final provider state was canceled; the profile, subscription row, and authenticated hosted profile returned to Free, and the read-only preflight found zero blocking subscriptions. Cleanup evidence is preserved in mode-`0600` `.vercel/staging-settings-reactivate-immediate-cleanup-verified-7e3c4d28.json`.
