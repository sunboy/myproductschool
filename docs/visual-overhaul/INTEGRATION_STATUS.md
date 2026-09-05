# Approved design integration

Updated 2026-09-05. Stage 4 and 5 implementation has advanced; stage 6 is not passed.

## Implemented in real routes
- Dashboard: compact real continuation/recommendations and separate personalized Hatch suggestions, approved geometric composition. Existing loaders and progress remain.
- Practice: paginated searchable/filterable catalog, grid/list, real status, open/resume destinations and catalog return URLs remain.
- Standard workspace: desktop brief/reference navigation beside a spacious answer surface with step navigation; discussion/submission badges, hints and back navigation retained. Phone Brief/Your work switches between mounted panels; Solutions remains reachable.
- AI analytics: Brief / Guidance / Findings beside the existing persistent Claude Code terminal; explicit start/resume, connection status, multiline evidence, progress access and keyboard resizing. Suggested prompts wait for terminal readiness and reveal the phone workspace. Findings and the active step are validated and saved in the existing session artifact, restored on resume, and checkpointed before finalization. Save failures retain the finding and retry the save without another model call. Duplicate retries share one request. Owner/status/concurrent-update checks protect writes. No schema migration or new infrastructure.
- Analytics onboarding deliberately defaults to the brief rather than an automatic overlay plus automatic Hatch opening. How it works remains available; Hatch remains the universal contextual companion.
- Readers: feature-autopsy editorial detail and real bookmarking; shared sanitized GFM/math renderer fixes literal math and nested code-pill formatting. Legacy story readers gain a readable contents control, consistent headings and reduced-motion support.
- Interviews, Progress, sign-in/sign-up, first visit, account and billing adopt the shared hierarchy/type/geometry. Existing service calls, profile forms, payment controls and authentication behavior remain.

## Verification in this slice
- TypeScript passed.
- Full unit suite: 654 passed (487 Node + 167 Vitest). The default suite now includes the new analytics checkpoint tests and the reader/design regression tests.
- Focused checkpoint/finalization/reader/design run: 22 passed. Checkpoint tests cover payload validation, ownership, finalized sessions, preservation of existing artifacts and concurrent write conflicts using mocked service boundaries.
- Focused analytics lint: no errors, one existing unused terminal regex warning. This is not a claim that the entire repository is lint-clean.
- Independent high-effort review completed. Fixed dropped terminal prompts, finding restoration, checkpoint/finalization ordering, duplicate save retries, false pre-save completion and per-step editor state leakage.
- This record precedes preview publication. Deployment/build evidence must be obtained for this commit, not inferred from earlier previews.

## Remaining launch gates
- Authenticated browser verification of Home → Practice → workspace → save/submit → feedback, Hatch context, Library reading/bookmark/resume, interviews, Progress and account.
- Live analytics canary covering start, reconnect, prompt insertion, finding save/retry, refresh/resume, finalization and cleanup. Unit tests are not evidence of a real terminal session.
- Actual device/viewport screenshots at phone, tablet and desktop widths. Coding/canvas phone restrictions are removed in implementation. The compact code input shares real drafts/run/submit handlers, and design write-up/canvas controls remain mounted. Actual device testing is still required.
- Specialized coding/canvas and legacy cover compositions have been revised and statically reviewed; authenticated visual comparison against the reference remains unverified.
- Stripe test-mode checkout/portal/webhook checks without live charges; production readiness and rollback review.
- The browser is currently signed out. Connector access does not establish an authenticated browser session.

## Deferred existing debt
- Analytics adaptive machine streak and injection logs are not fully rehydrated after refresh; setup auto-advance is not separately checkpointed. Persisted findings/guidance/arc improve resume, but exact adaptive branching continuity needs the canary and follow-up.
- Broad infrastructure cleanup remains outside this visual integration slice. No production promotion or security-header relaxation is included.

## Completion pass after 32f92361
- Coding/canvas: shared brief/work switching at compact widths, native phone code input, reference tabs including Examples/Constraints/Notes, usable section controls, full-screen Run/Submit/Exit, compact history/feedback return headers and viewport-contained Hatch. No automatic Hatch opening in specialist workspaces.
- Feedback: removed invented fallback score and invented completion date; qualitative evidence leads the page, actual scores are optional. Preserved real dimension/diagram/response detail, recommendations, retries and contextual Hatch. Scoreless feedback does not advertise an empty scorecard share. Existing public scoreless links do not render a synthetic zero or oversized missing-score label.
- Library: saved stories filter reflects actual autopsy bookmarks, with truthful empty/unavailable states and retry; guide/plan completion remains account data, story scroll resume remains device-local.
- Readers: legacy cover now uses a responsive editorial split with actual content imagery and restrained shared geometry; removed the looping scroll indicator.
- Landing/pricing: preserved the newer hp-launch hero, aligned shared palette/corners, removed perpetual CSS motion and unsolicited audio playback, made the intro explicitly playable, removed the false sample-result retention promise, and added Analytics to the comparison when enabled.
- Recovery pages: shared visual treatment and network-failure recovery. Legacy E2E credential defaults removed; tests require explicit authorized test-account environment variables.
- Focused tests now cover qualitative-only score handling, real zero, invalid score rejection, compact editor saved-buffer/read-only behavior and saved-story load failure. TypeScript passed; targeted modified-component lint checked separately from historical repository lint debt.
- Independent reviewer checked data truthfulness and specialized control reachability. Full authenticated/device/analytics/payment gates remain open; missing browser authentication is a blocking dependency, not an implementation-complete claim.
