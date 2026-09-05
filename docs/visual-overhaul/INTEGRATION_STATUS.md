# Approved design integration

Updated September 5, 2026. Core real-route integration is published on `feat/platform-rebuild-20260905`, draft PR #20. Launch verification is not complete; do not promote this branch as launch-ready.

## Implemented
- Shared cream, forest, amber and sage design, Literata/Nunito typography, compact dashboard, restrained geometric entrance and reduced-motion support.
- Home, searchable/filterable Practice catalog, coding/SQL and canvas workspaces, Library/readers, interview setup/debrief, Progress, authentication/recovery, account, pricing and billing integrated into existing services.
- Four main destinations: Home, Practice, Library, Progress. Hatch suggestions open contextual floating chat. Claude Code remains specific to analytics.
- Phone brief/work switching, native compact code editor, reference tabs, canvas/write-up controls, full-screen controls and history/feedback return paths implemented.
- Shared GFM and math rendering fixes literal formulas and nested code-pill styling. Editorial reader, contents, bookmarking and local reading-position restoration remain connected to real content.
- Analytics Brief / Guidance / Findings, explicit start, terminal, checkpoint/retry/resume and bounded startup state are implemented. Failed gateway startup no longer silently creates repeated sessions. No model suggestions run before the terminal is ready.
- Coding review schema now ships in the application; correctness fallback does not invent process scores. Unobserved collaboration/communication/testing dimensions are omitted from new coding reviews. Canvas collaboration is optional and its weight is omitted without conversation evidence.
- Canvas review failure leaves a saved, retryable attempt and a visible error; it no longer fabricates a neutral score. The canvas stays mounted during submission to preserve its scene and undo state.
- Interview entry now requires an explicit voice/chat choice. Flux settings corrected, voice errors tear down audio before chat fallback, and the opening request survives connection-state changes.

## Authenticated browser evidence
Tested against the branch preview, including READY deployment `dpl_8pdLh27V2gcEJA1cQhkspe3FUqRj` at commit `07b7d3369b4b072e23e8ab4c35c4de887f33ba95`. Subsequent fixes listed above require their own deployed recheck.

| Journey | Observed result |
| --- | --- |
| Home and Hatch | Real continuation retained. Dashboard suggestion opened floating Hatch, prefilled the request, and produced a contextual response. Existing user drafts were preserved. |
| Practice | Real catalog, search/filter and grid/list destinations working; 1,470 challenges were available at test time. Coding, SQL, analytics and data-modeling workspaces opened. |
| Coding | Range Sum: 5/5 visible and 7/7 submitted tests passed; draft survived refresh. Its Progress review now redirects to the correct workspace attempt and shows actual test evidence. Seating Arrangement: 7/7 tests passed and fresh detailed Hatch review succeeded. |
| SQL | Refund Rate per Seller: schema/sample data loaded, query ran 3/3 visible tests and passed 5/5 including hidden tests on submit. |
| Canvas | Ski Rental Schema: opened canvas, inserted starter diagram, returned to write-up, and restored diagram plus text after refresh. All four sections reachable. Full write-up submitted and real feedback correctly distinguished thoughtful notes from the deliberately incomplete starter diagram. |
| Reader | LLM Internals attention chapter visually renders inline math and dark code blocks correctly. Gmail Undo Send bookmark persisted in Saved stories. Outline navigation reached the selected section; refresh restored the same section and scroll position. |
| Interviews | Google Product Sense scenario selection, text conversation, end confirmation and saved debrief passed. Voice failed on a provider schema field; corrected code and explicit-mode flow await a deployed voice check. |
| Progress | Real completed work appears. Normalized challenge scores now populate Scored 80+. Actual completed guide chapters and guide links replace the false empty state. Interview score display corrected separately to match /10 debrief. |
| Account/billing | Authenticated account/settings loaded. Manage billing reached the server but returned 503 because preview Stripe credentials are not configured. No charge or subscription change was made. |
| Analytics | Start reached provisioning; gateway virtual-key creation timed out/returned 500. No terminal connected. This is a failed canary, not a passed journey. |

Test-owned examples used existing authorized browser authentication. Earlier user work was not deleted or overwritten. These examples are not user achievement claims.

## Code verification
- Final deployed follow-up: chat-mode interview opened without a microphone request, exchanged a real answer/follow-up, and saved a 5.6/10 debrief. Lobby scores now match debriefs. `/simulation` loads its real page. Reader bookmark, outline and restored section remain available, with internal metadata removed.
- Analytics failure canary now stops at the retry panel while the brief remains readable. It did not establish a terminal connection. Header status was then corrected to report connection unavailable instead of continuing to say preparing.
- The deployed canvas check exposed continued overlap at the far-right Next button. Navigation is now grouped at the left edge, clear of the Hatch dock; final deployment verification remains required.
- Deployment `dpl_F4gCp8nj1BVpjHCnG4e6RYWKYShw` (commit `a8c5a05e27eef9670d0b01410baf40f90071f478`) reached READY. Fresh SQL feedback passed: 5/5 tests, detailed 8.0/10 review, and no unsupported collaboration or interview-communication dimension for an independent attempt. New interview entry displayed the explicit voice/chat choice, with voice disabled until microphone checking.
- Final route audit removed two redirects into nonexistent `/prep` pages, restoring the existing simulation and company interview-prep routes. Interview lobby scores now use the same /10 scale as debriefs.
- TypeScript passed after the final submission-error and scoring refinements.
- Full unit suite: 658 passed (491 Node + 167 Vitest), including coding/canvas independence regressions.
- Independent high-effort review checked voice lifecycle, scoring truthfulness, analytics retries, draft/checkpoint handling and control reachability. Findings were addressed.
- Focused lint: zero errors and five existing unused-code warnings in live interview files; separate from historical repository-wide lint debt. Actual device tests and live service tests are not implied by unit counts.
- No production promotion, security-header relaxation or database migration in this integration batch.

## Remaining launch gates
1. Verify the final published commit: explicit interview mode choice, score display, canvas Next button clearance, error/retry handling and optional collaboration scoring.
2. Restore the analytics gateway configuration and run a real canary: start, terminal interaction, prompt insertion, finding checkpoint, refresh/reconnect, finalization and cleanup. The current runtime has GitHub/Vercel/Supabase connectors but no callable GCP administration connection or local ADC. Existing infrastructure observations in `docs/architecture/analytics-backend-simplification.md` are historical, not a fresh cost audit.
3. Configure a Stripe test-mode preview and verify checkout, portal and webhook entitlement changes without live charges. Current billing failure is `stripe_not_configured`.
4. Obtain actual phone/tablet/desktop viewport screenshots and interaction checks. Prior 390/768/1440 composition-container checks are not device/browser viewport verification; the available browser session does not expose viewport resizing.
5. Production readiness and rollback review after these gates pass. PR #20 remains a draft.

## Known follow-up debt
- Analytics exact adaptive branching continuity after refresh still needs the canary; persisted findings and active step alone do not prove the complete session lifecycle.
- Historical feedback can contain scores from the old fallback/collaboration rubric. This batch prevents new unsupported scores; it does not silently rewrite existing learning history.
- Infrastructure consolidation and cost savings require live provider verification. No new monthly savings claim is made.
