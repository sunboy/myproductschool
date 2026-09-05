# HackProduct rebuild — execution checkpoint

## Product contract
Professional upskilling and learning for tech workers, including interview preparation. Hatch is the universal contextual companion; Claude Code belongs only to AI analytics. Avoid gym/reps/loops/graded branding. Preserve data, payments, auth, challenge execution, reading progress, feedback, and existing URLs.

## Visual contract
Primary references: HackProduct Engineering Interview Practice.png, Dashboard Concept 1 (image-gen-1(6).png), Dashboard Concept 3 (image-gen-3(5).png). Warm cream, deep forest, restrained amber, responsive geometric fields. Literata editorial headings, actual Nunito Sans functional text. Compact dashboard hero, clear next action. Mockups establish composition and visual character, not fabricated readiness scores. Visual refinement continues on implemented screens.

## Execution order and ownership
1. Baseline main and inventory existing journeys/resources. Branch: feat/platform-rebuild-20260905.
2. Shared shell and typography (root/navigation agent); dashboard, Practice, Library in parallel with disjoint ownership.
3. Analytics audit: preserve session isolation and spend enforcement; prove idle cost sources before changes. Add safe provisioning safeguards, then evaluate removal of dedicated gateway database.
4. Marketing/auth, Progress, workspaces/interviews, and remaining routes after core integration.
5. Independent review, static checks, browser tests, real authenticated journeys and payment/analytics verification.
6. Deploy only verified changes; inspect production and report limitations explicitly.

## Canonical navigation
Home /dashboard; Practice /challenges (interviews and analytics accessible inside); Library /explore; Progress /progress. Preserve contextual subroutes and compatibility URLs. Challenge links use existing challengePath resolver and /workspace/challenges/[slug].

## Verified facts
- Main checkout c2c4d6e4.
- Root layout incorrectly loaded Raleway into --font-nunito-sans and CSS inflated weight utilities. Corrected in working tree.
- Cloud Run project hackproduct, region us-central1. cc-sandbox reports Ready; cc-llm-gateway latest configuration fails startup.
- Cloud SQL cc-llm-db is db-f1-micro with activationPolicy NEVER (already stopped). Do not claim its compute is presently running.
- Vercel connected team reports hobby. No current invoice totals verified.
- Supabase HackProduct tikkhvxlclivixqqqjyb has no development branches. Eight cron jobs, including session reap and reap-health. Other projects are outside this cleanup scope.

## Acceptance gates
- Actual fonts/weights and responsive geometry checked at mobile/tablet/desktop; no clipped controls.
- All primary navigation/CTAs work; challenge catalog remains searchable and leads to usable workspaces.
- Hatch suggestions open the existing floating conversation with context.
- Auth recovery, entitlements, checkout/webhooks/portal verified without live charges.
- Analytics provision/connect/query/artifact/feedback/end/reconnect/expiry tested; secrets isolated, budgets enforced and compute released.
- Reader content, outline, bookmarks and progress remain functional.
- No deletion of data or infra before dependency validation and recoverable migration.
- Distinguish local/mock checks from real integration checks; never report untested flows as complete.

## Implementation checkpoint — 2026-09-05
- Rebuilt primary shell, compact dashboard, real challenge browsing, Library catalog, autopsy and guide readers, Progress, marketing hero, authentication styling, and workspace layout.
- Restored real Quick Take, canonical challenge resume URLs, paused interviews, bookmarks, and contextual Hatch prompt actions after independent review.
- Typography uses bundled Nunito Sans Variable and Literata Variable. Removed mislabeled Raleway and global weight inflation.
- Analytics code now bounds session duration/spend, fails closed on absent gateway in production, and protects shared Cloud Run traffic updates using etags. Infrastructure migration remains a separate live canary gate.
- Full production build completed locally. Existing Turbopack dynamic file-tracing warnings remain. Deferred notes admin-client initialization until request use so build does not require service-role secrets.
- Unit suite: 467 Node tests + 106 Vitest tests passed (573 total), including new provider/provisioning and dashboard action checks.
- Browser checks so far: public landing, sign-in navigation, actual computed heading/body font families, restored anonymous challenge form. Hosted Vercel preview verifies catalog filtering: Analytics aria-pressed=true and Showing 1 of 6 challenges. Local dev had an unhydrated runtime; hosted behavior is correct. Authenticated and responsive device coverage is not yet complete.
- No production deployment or cloud resource deletion has been performed. No current dollar savings are claimed.

## Hosted checkpoint
- Preview1699668 is READY on Vercel; PR20 holds the durable source.
- Runtime reset restored from this branch; no committed work lost.
- Second pass refines first-run wording, settings touch targets, evidence-only profile insight and interview selection. These changes preserve existing API/security contracts.

- Hosted anonymous feedback form successfully accepted a generated sample answer and returned specific live feedback. Authenticated sign-in handoff requested through the secure browser form.
- Public preview detail links now preserve returnTo and connect three verified published challenge slugs directly; marketing-only scenarios go to a discipline catalog with honest related-challenge wording.
