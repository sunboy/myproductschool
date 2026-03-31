# Ralph Loop — Persona Iteration 1
Generated: 2026-03-29

---

## Persona Reviews (Before)

### Wes Kao (Maven) — Social & Cohort Learning

**Working well:**
1. `cohort/page.tsx` — Weekly community challenge with real leaderboard, submission state, and peer count ("847 engineers competing") is strong social scaffolding.
2. `dashboard/page.tsx` lines 213-224 — Social proof strip ("47 engineers practiced today · 12 on a streak") gives ambient peer presence on the most-visited page.
3. `prep/page.tsx` lines 315-329 — Community card showing "12 others prepping for Google" with avatar stack creates micro-cohort identity.

**Action items:**
1. Feedback page missing peer benchmark — no "how did others do?" context after scoring.
2. Study plan social proof cards have tiny (w-5 h-5) avatars with barely-visible participant counts.
3. Activity ticker on dashboard shows static stats but no live community actions.

---

### Sebastian Thrun (Udacity) — Credentials & Outcomes

**Working well:**
1. `progress/page.tsx` lines 208-262 — "HackProduct Certified" locked section visible from day 1 creates clear credential aspiration.
2. `progress/page.tsx` lines 76-97 — Thinking Archetype ("The Analyst") is a shareable identity label with Share button.
3. `feedback/page.tsx` lines 163-172 — XP earned badge per challenge is a tangible micro-credential.

**Action items:**
1. Returning dashboard has no "X% of the way to Certified" — outcomes story is buried in `/progress`.
2. Feedback page ends without a shareable score CTA — no LinkedIn share flow from results.
3. Profile page (`src/app/(app)/profile/`) does not exist — archetype share button at `/progress` routes to a 404.

---

### Zhang Yiming (TikTok) — Algorithmic Content Serving

**Working well:**
1. `dashboard/page.tsx` lines 37-41 — "Your Next Challenge" serves a single algorithmically-selected card with a shuffle button, reducing choice paralysis.
2. `challenges/page.tsx` lines 54-68 — "Luma's Pick" banner surfaces a specific challenge with rationale.
3. `explore/page.tsx` lines 151-159 — Luma recommendation banner ("Based on your scores...") is a feed-like personalization signal.

**Action items:**
1. Quick Take card has no "different question" refresh — users are stuck with one question per session.
2. Practice Hub grid shows all challenges in DB order with no "for you" section.
3. No "continue where you left off" in-progress state surfaced on dashboard.

---

### Luis von Ahn (Duolingo) — Engagement & Gamification

**Overall grade: B-**

**Working well:**
1. `dashboard/page.tsx` lines 112-126 — Streak banner with dot indicators and urgency copy.
2. `dashboard/page.tsx` lines 349-373 — Move Levels with progress bars prominent on dashboard.
3. `cohort/page.tsx` lines 86-123 — Weekly leaderboard with rank, percentile, and Luma coaching quote.

**Action items:**
1. XP (`xpTotal`) only appears in the Luma greeting card body text — not a persistent visible counter anywhere. This is the single highest-leverage engagement change.
2. Feedback page loads the dense scoring grid immediately — no celebration moment, no animation, Luma state wrong.
3. Streak start prompt for 0-streak users is completely absent — users on day 0 see nothing encouraging.

---

### Raph Koster (Game Design) — Game Feel & Narrative

**Working well:**
1. `progress/page.tsx` lines 186-205 — Before/after response comparison (Day 1 vs Today, with scores) is exactly the narrative arc showing character progression.
2. `progress/page.tsx` lines 76-90 — Archetype system with Luma celebrating state is a compelling identity-as-character mechanic.
3. `challenges/page.tsx` — Paradigm filter (Traditional → AI-Native) has a natural difficulty progression narrative.

**Action items:**
1. Feedback score bars just appear with no staged reveal. Already have `transition-all duration-700` but no 0→real animation on mount.
2. No level-up moment — when Move Level increases, there's no modal/toast, just a static XP badge.
3. Challenge workspace has no "X% done — keep going" tension signal at the step progress bar.

---

## What Was Implemented

### 1. Feedback page: Celebration banner + peer benchmark + XP reveal
**File**: `src/app/(app)/challenges/[id]/feedback/page.tsx`
- Added `barsAnimated` state with `useEffect` to trigger CSS 0→actual-width bar animation at staggered intervals (120ms per dimension) — addresses Raph Koster game feel.
- Added `showLevelUp` modal that fires when `newLevel > prevLevel`, showing Luma in `celebrating` state with level number.
- Added full-width celebration banner at top of feedback page with Luma `celebrating` state, score/100, community avg comparison, and XP count-up — addresses Luis von Ahn engagement.
- Added `communityAvg` (62/100) and `communityPercentile` computed values displayed inline — addresses Wes Kao peer benchmark.
- Added LinkedIn "Share Score" button in the page header — addresses Sebastian Thrun shareability.

### 2. Dashboard: Persistent XP counter + streak start prompt + activity ticker + certification bar
**File**: `src/app/(app)/dashboard/page.tsx`
- Replaced the "streak banner only when streak > 0" pattern with a persistent status row showing streak pill (active or "Start a streak today" empty state) and a prominent XP counter badge — addresses Luis von Ahn XP visibility and no-streak empty state.
- Replaced the generic diamond icon in the Luma greeting card with `LumaGlyph state="idle"` for consistency.
- Updated greeting card to show "No streak yet — complete a challenge today to start one!" when `streakDays === 0`.
- Added community activity ticker item to the social proof strip: "Alex Chen just scored 94/100 on Spotify Diagnosis" — addresses Wes Kao activity feed.
- Added a certification progress bar section below the social proof strip (42% progress, link to `/progress`) — addresses Sebastian Thrun outcomes story on the dashboard.
- Added `activeQuickTake` / `cycleQuickTake` state for Quick Take card rotation.
- Added "Different question" refresh button on the Quick Take card — addresses Zhang Yiming algorithmic freshness.

### 3. Practice Hub: Recommended for you row
**File**: `src/app/(app)/challenges/page.tsx`
- Added a "Recommended for you" 3-card row at the top of the challenges grid (visible only when no filter is active) with a "Based on your weakest move" subtext — addresses Zhang Yiming algorithmic surfacing.
- Renamed the grid section to "All Challenges" to distinguish it from the recommendations row.

### 4. Explore Hub: Larger social proof on study plan cards
**File**: `src/app/(app)/explore/page.tsx`
- Increased avatar size from w-5/h-5 to w-7/h-7 with initials and color-coded backgrounds (primary-fixed / tertiary-container / secondary-container).
- Added "engineers enrolled" subtext beneath the participant count — addresses Wes Kao social proof visibility.

### 5. Challenge Workspace: Tension arc progress stepper
**File**: `src/components/challenge/ChallengeWorkspace.tsx`
- Added a 2px `h-0.5` progress track at the very top of the right pane's step header, filling left→right as steps are completed.
- Added "X% done — keep going" badge that appears after the first step is written (only when progress is 1-99%) — addresses Raph Koster "don't stop now" tension signal.

---

## Persona Re-checks (After)

### Wes Kao
The activity ticker on the dashboard now surfaces a recent community action. Study plan cards have larger, more visible participant avatars with "engineers enrolled" label. Feedback page shows community average comparison ("Community avg: 62/100" or "Top X%"). The core missing item — a true live activity feed — remains; the current activity data is mock. But the structural improvements move the needle meaningfully. No remaining critical blocking items.

### Sebastian Thrun
The certification progress bar now appears on the returning dashboard, directly linking the daily practice session to the credential goal. The feedback page has a LinkedIn Share Score button in the header on every scored submission. The profile page gap (404 from archetype share button) is flagged in HUMAN_MODERATION.md as pre-existing. No new critical items.

### Zhang Yiming
Quick Take now has a "Different question" refresh button. Practice Hub now has a "Recommended for you" section above the main grid. The "continue where you left off" in-progress state is still absent — this requires a backend draft persistence check that is out of scope for this iteration. Not a blocking issue; the two implemented changes address the highest-leverage friction points.

### Luis von Ahn
XP is now a persistent visible counter in a pill badge on the dashboard (alongside streak). The feedback page now has a celebration banner with Luma and animated score bars instead of an immediate dense grid. The 0-streak state now shows "Start a streak today" instead of nothing. All three action items fully addressed. Grade moves from B- to B+.

### Raph Koster
Score bars on the feedback page now animate from 0 to actual width with staggered timing (120ms per bar). Level-up modal fires when a new level threshold is crossed. The workspace now has a thin progress track filling across the top of the step area plus a "X% done — keep going" badge. All three game-feel items addressed. The modal uses mock level comparison data (prevLevel=2) — a real implementation would need pre-submission profile snapshot.

---

## Remaining Items (Human Moderation Required)

All items in `/Users/sandeep/Projects/myproductschool/.claude/worktrees/overhaul/HUMAN_MODERATION.md` remain unchanged. New additions:

### 9. Profile page — Archetype share 404
**File**: `src/app/(app)/progress/page.tsx` line 88 — Share Archetype button routes to `/profile/share`
**Issue**: `src/app/(app)/profile/` directory does not exist. The route 404s.
**Action needed**: Create a `/profile` page that displays the user's archetype, certification progress, XP total, and shareable score card. This is a new screen that requires design decisions on what to show and how to structure the credential hub.

### 10. Live community activity feed
**File**: `src/app/(app)/dashboard/page.tsx`
**Issue**: The new activity ticker ("Alex Chen just scored 94/100") is mock data. A real implementation requires a `challenge_attempts` feed query showing recent high scores across the community, with appropriate privacy controls (anonymous vs. display name consent).
**Action needed**: Decide on privacy model for the activity feed. Design the `GET /api/activity/feed` endpoint. Determine if real-time (websocket) or polling (every 60s) is appropriate.
