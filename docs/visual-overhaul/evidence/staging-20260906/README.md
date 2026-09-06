# Staging browser evidence — 2026-09-06

These screenshots capture browser checks against staging deployment commit `1ae7b4bc02d35aa1f11cc4d995aeaaf678c6b7c0`. They are **before-fix evidence** for two responsive layout issues found during the pass. Two local, uncommitted style fixes were pending deployment and require a fresh staging recheck.

The data-modeling checks and the TEST-mode billing checks below were exercised against commit `1ae7b4bc02d35aa1f11cc4d995aeaaf678c6b7c0`. The independent billing helper also verified that the signed checkout-completion event was processed exactly once. These screenshots do not establish analytics-sandbox readiness; that canary remains a separate gate.

## Results

| Viewport | Check | Result | Evidence |
| --- | --- | --- | --- |
| Tablet | The write-up page scrolls vertically and the **Next: List** action remains reachable. | Passed before the pending style fixes. | [canvas-tablet-navigation.png](./canvas-tablet-navigation.png) |
| Phone | The collapsed Hatch control overlaps the lower navigation/action area. | Failed before fix; requires deployed recheck. | [canvas-phone-overlap-before.png](./canvas-phone-overlap-before.png) |
| Desktop | A 223-character write-up persisted and was restored on the List step. | Passed before the pending style fixes. | [canvas-desktop-restored-writeup.png](./canvas-desktop-restored-writeup.png) |
| Desktop canvas | The starter diagram loaded with two tables and one relationship link. | Passed before the pending style fixes. | [canvas-desktop-header-before.png](./canvas-desktop-header-before.png) |
| Desktop canvas | The canvas header/title area is clipped at the top edge. | Failed before fix; requires deployed recheck. | [canvas-desktop-header-before.png](./canvas-desktop-header-before.png) |
| Billing checkout | TEST checkout completed and the application returned with Pro access visible. | Passed on commit `1ae7b4bc`. | [billing-checkout-pro-success.png](./billing-checkout-pro-success.png) |
| Billing portal | The Stripe TEST portal showed the active HackProduct Pro trial, renewal details, and payment method. | Passed on commit `1ae7b4bc`. | [billing-test-portal.png](./billing-test-portal.png) |
| Billing portal | Scheduling cancellation updated the TEST portal to show the cancellation date and the option to reverse it. | Passed on commit `1ae7b4bc`. | [billing-test-portal-canceled.png](./billing-test-portal-canceled.png) |

## Pending deployed recheck

After the two style fixes are deployed, repeat the phone and desktop canvas checks against the new exact deployment SHA:

1. Confirm the Hatch control no longer covers write-up navigation or actions at phone width.
2. Confirm the canvas header and title are fully visible at desktop width.
3. Reconfirm tablet scrolling and **Next** navigation.
4. Reconfirm the 223-character write-up restoration and the starter diagram's two tables and one link.

Keep any post-fix screenshots separate from these files so the before/after evidence remains unambiguous.
