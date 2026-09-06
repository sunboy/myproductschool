# Staging browser evidence — September 6, 2026

The before-fix checks ran against commit `1ae7b4bc02d35aa1f11cc4d995aeaaf678c6b7c0`. The responsive layout fixes were then deployed and rechecked at commit `ebd506fd6a3b636cb7d62382294d8fedafb15531` in deployment `dpl_5oJMNrYbo1jsShYamDzETgp9RN4h`.

Billing screenshots use the isolated Supabase staging branch and Stripe TEST mode described in [the staging billing runbook](../../../runbooks/staging-ui-billing-20260906.md). They do not establish analytics sandbox readiness; that canary remains a separate gate.

## Before-fix results

| Viewport | Check | Result | Evidence |
| --- | --- | --- | --- |
| Tablet | The write-up page scrolls vertically and the **Next: List** action remains reachable. | Passed. | [canvas-tablet-navigation.png](./canvas-tablet-navigation.png) |
| Phone | The collapsed Hatch control overlaps the lower navigation area. | Failed; fixed and rechecked below. | [canvas-phone-overlap-before.png](./canvas-phone-overlap-before.png) |
| Desktop | A 223-character write-up persists after returning to the List step. | Passed. | [canvas-desktop-restored-writeup.png](./canvas-desktop-restored-writeup.png) |
| Desktop canvas | The starter diagram loads two tables and one relationship link. | Passed. | [canvas-desktop-header-before.png](./canvas-desktop-header-before.png) |
| Desktop canvas | The canvas header and title are clipped at the top edge. | Failed; fixed and rechecked below. | [canvas-desktop-header-before.png](./canvas-desktop-header-before.png) |

## Post-fix results

| Viewport | Check | Result | Evidence |
| --- | --- | --- | --- |
| Desktop canvas | The header, title, and **Done** action stay in bounds; the starter diagram still shows two tables and one relationship link. | Passed on `ebd506fd`. | [canvas-desktop-header-fixed-ebd506fd.png](./canvas-desktop-header-fixed-ebd506fd.png) |
| Phone | At maximum List-step scroll, **Back** and **Next: Optimize** clear the Hatch control and footer. Selecting **Next: Optimize** advances successfully. | Passed on `ebd506fd`. | [canvas-phone-clearance-fixed-ebd506fd.png](./canvas-phone-clearance-fixed-ebd506fd.png) |
| Tablet | At maximum List-step scroll, **Back** and **Next: Optimize** clear the Hatch control and footer. Selecting **Next: Optimize** advances successfully. | Passed on `ebd506fd`. | [canvas-tablet-clearance-fixed-ebd506fd.png](./canvas-tablet-clearance-fixed-ebd506fd.png) |
| Phone reader | The contents drawer opens and selecting Timeline closes it and jumps to that section; reading progress survives reload. | Passed on `1ae7b4bc`. | [reader-phone-contents.png](./reader-phone-contents.png) |
| Desktop coding | A failed assertion and a corrected submission both ran real tests; the final submission scored 7/7 tests and Hatch returned grounded feedback with a 7.4/10 score. | Passed on `ebd506fd`; reload persistence was not part of this capture. | [coding-desktop-feedback-ebd506fd.png](./coding-desktop-feedback-ebd506fd.png) |
| Phone coding | After reload, Submissions → Attempt 1 restores the same 7/7 result, 7.4/10 feedback, and submitted Python source. Progress → Review also restores that attempt. | Passed on `ebd506fd`; attempt `9d644f31-d218-4534-913d-868e42f856f7`. | [coding-phone-saved-feedback-ebd506fd.png](./coding-phone-saved-feedback-ebd506fd.png) |
| Phone coding | Run and Submit remain accessible; fullscreen entry and exit work. | Passed on `ebd506fd`. | [coding-phone-controls-ebd506fd.png](./coding-phone-controls-ebd506fd.png) |

Actual viewport overrides were 390×844 (phone), 768×1024 (tablet), and 1440×1000 (desktop). These are browser viewport checks, not physical-device testing. Reduced-motion emulation is not exposed by the available browser capabilities and remains unverified.

The bare coding workspace URL starts a fresh attempt after a completed submission. Submitted work is preserved, but refreshing immediately after completion unexpectedly shows starter code. A pending fix pins the completed attempt in the URL; its deployed refresh behavior still requires verification.

## Voice readiness only

The real interview room `36f5455a-1905-4e87-a54e-402aaceeb955` reaches the explicit microphone preflight on `cf7e9fee`: Allow mic is available, voice start is disabled until the check passes, and Continue in chat is available. [Readiness screenshot](./voice-microphone-readiness-cf7e9fee.png). No microphone permission, spoken turn, transcription, audio response, or voice debrief is claimed from this capture; user participation remains pending.

## Stripe TEST billing results

| Check | Result | Evidence |
| --- | --- | --- |
| Checkout | Stripe TEST checkout completed and the application returned with Pro access visible. | [billing-checkout-pro-success.png](./billing-checkout-pro-success.png) |
| Customer portal | The Stripe TEST portal showed the active HackProduct Pro trial, renewal details, and TEST payment method. | [billing-test-portal.png](./billing-test-portal.png) |
| Scheduled cancellation | The portal showed the cancellation date and offered a reversal action. | [billing-test-portal-canceled.png](./billing-test-portal-canceled.png) |
| Explicit cancellation date | On `cf7e9fee`, Settings shows **Access ends**, the September 13 date, and **Keep Pro** when Stripe supplies `cancel_at` with `cancel_at_period_end=false`. | [settings-explicit-cancel-date-cf7e9fee.png](./settings-explicit-cancel-date-cf7e9fee.png) |
| Reactivation | **Failed on `cf7e9fee`**: after successful password reauthentication, Keep Pro displays “Billing update failed.” The provider request correction is pending deployment and recheck. | [settings-keep-pro-failure-cf7e9fee.png](./settings-keep-pro-failure-cf7e9fee.png) |
