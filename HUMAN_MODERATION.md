# Human Moderation Required

Items flagged during the Ralph Loop Iteration 1 audit that require human action
(cannot be fully implemented by the AI agent alone).

---

## 1. Live Cohort Scheduling — Cohort Page

**File**: `src/app/(app)/cohort/page.tsx`

**Issue**: The cohort challenge "closes in 2d 14h 31m" countdown is hardcoded.
The "Week 12 · Optimize Move" badge and the challenge title are mock data.
A real weekly cohort system requires:
- A human curator to write and schedule each week's challenge prompt
- A backend cron job to publish the active challenge and archive the previous one
- A real submission deadline stored in the DB (`cohort_challenges` table)

**Action needed**: Decide on moderation workflow for weekly challenge creation.
Does the team manually author each challenge? Or is it AI-generated + human-approved?

---

## 2. Live Interview Simulation — Human Evaluator Path

**File**: `src/app/(app)/simulation/page.tsx`, `/simulation/[sessionId]/page.tsx`

**Issue**: The "Live Interview" simulation mode implies a real human interviewer.
The current flow only routes to AI simulation. If a human-conducted mock interview
feature is intended, it requires:
- Interviewer recruitment and vetting process
- Scheduling infrastructure (calendar integration)
- Payment/incentive model for interviewers

**Action needed**: Confirm whether "Live Interview" is AI-only (Luma) or includes
real human interviewers. If human, define the recruitment and scheduling process.

---

## 3. Team Cohorts — B2B Waitlist

**File**: `src/app/(app)/cohort/page.tsx` (Team Modal)

**Issue**: The "Create Team" modal collects email for a waitlist but there is no
actual backend route to store these leads. The modal just shows "Thanks! We'll
be in touch." with no persistence.

**Action needed**:
1. Create an API route to persist team interest leads to Supabase
2. Decide pricing/packaging for team plans
3. Assign a human to follow up with waitlist signees

---

## 4. Privacy Policy and Terms of Service — Legal Pages

**Files**: Multiple pages link to `/privacy` and `/terms`

**Issue**: The `/privacy` and `/terms` routes do not appear to exist in the
`(marketing)` routes. These are legal documents requiring human authorship
and legal review.

**Action needed**: Write and publish actual Privacy Policy and Terms of Service
pages. This is a launch blocker if users are being asked to agree to them.

---

## 5. About / Methodology Page

**File**: `src/components/marketing/GradientFooter.tsx`

**Issue**: The "Methodology" and "Documentation" footer links now point to `/about`,
which does not yet exist.

**Action needed**: Create a static `/about` page explaining the FLOW methodology
(Frame, List, Optimize, Win) and the platform's pedagogical approach. This should
be human-authored product copy.

---

## 6. Shareable Score Card — Social Share Text

**File**: `src/app/(workspace)/challenges/[id]/share/page.tsx`

**Issue**: The LinkedIn and Twitter share buttons are wired with hardcoded score
(84/100) and challenge title ("The Feature That Backfired"). The share page needs
to receive real challenge context via URL params or session state.

**Action needed**: Determine whether the share card should be a server-rendered
OG image (using `next/og`) or a client-side canvas export. Decision affects
implementation significantly.

---

---

## 7. Simulation Error Recovery — Pro Gate

**File**: `src/app/(app)/simulation/page.tsx`

**Issue**: When `POST /api/simulation/start` returns a non-sessionId response
(e.g., Pro paywall rejection), the UI now shows the error string from `data.error`.
If the API returns a Pro gate error, the UX should ideally redirect to the
paywall modal rather than showing a raw error message.

**Action needed**: Confirm the API error shape when a free user hits the simulation
endpoint (is it `{ error: "pro_required" }` or a different shape?). Once confirmed,
the Start button handler can branch on this error code to open the paywall instead.

---

## 8. Waitlist Count — Live DB Fetch

**File**: `src/app/(marketing)/waitlist/page.tsx`

**Issue**: `const WAITLIST_COUNT = 1100 // TODO: fetch from supabase at build/request time`
This is hardcoded. The count will drift from the real number over time.

**Action needed**: Decide whether this should be a static build-time value
(revalidated via ISR) or a live client fetch. If the waitlist grows fast, live fetch
is worth the extra request; otherwise ISR every 10 minutes is cleaner.

---

*Last updated: 2026-03-29 — Ralph Loop Iteration 2*
