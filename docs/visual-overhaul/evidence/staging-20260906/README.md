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
| Phone reader | The contents drawer renders and scrolls above the bottom navigation. | Passed on `ebd506fd`. | [reader-phone-contents.png](./reader-phone-contents.png) |
| Desktop coding | A failed assertion and a corrected submission both ran real tests; the final submission scored 7/7 tests and Hatch returned grounded feedback with a 7.4/10 score. | Passed on `ebd506fd`; reload persistence was not part of this capture. | [coding-desktop-feedback-ebd506fd.png](./coding-desktop-feedback-ebd506fd.png) |

## Stripe TEST billing results

| Check | Result | Evidence |
| --- | --- | --- |
| Checkout | Stripe TEST checkout completed and the application returned with Pro access visible. | [billing-checkout-pro-success.png](./billing-checkout-pro-success.png) |
| Customer portal | The Stripe TEST portal showed the active HackProduct Pro trial, renewal details, and TEST payment method. | [billing-test-portal.png](./billing-test-portal.png) |
| Scheduled cancellation | The portal showed the cancellation date and offered a reversal action. | [billing-test-portal-canceled.png](./billing-test-portal-canceled.png) |
