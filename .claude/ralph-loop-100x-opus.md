# Ralph Loop 100x -- Opus Iteration 2

**Date**: 2026-03-29
**Commit**: `f9dfa1b` feat(100x-opus): visceral copy, actionable dashboard, sharper coaching

## Philosophy

The gap between "functional" and "insanely good" is mostly about specificity. Generic platforms say "improve your skills." Great ones say "Your PRs get merged, but you never get asked 'what should we build?'" This iteration rewrites copy and restructures information hierarchy so that every screen answers: **what exactly will I get, and why should I care right now?**

## Changes Made

### 1. Welcome Page (the first impression)

**Before**: Generic headline ("Coding isn't the moat"), four thinking-move cards with taglines, and a CTA to "Take the Assessment."

**After**:
- Headline rewritten: "Your code ships. Your product thinking doesn't." -- hits the engineer identity directly.
- Added a **live scenario preview card** showing what the assessment actually produces: a real challenge title ("Spotify's 15% Session Drop"), a Luma coaching snippet, and four dimension score bars. This is the "show what you GET" principle -- before asking for commitment, show the output.
- Each thinking-move card now reveals an **example challenge** on hover (e.g., "Cut free tier from 10K to 1K API calls -- or find a smarter lever?").
- CTA changed from "Take the Assessment" to "Find out where you stand" -- outcome-oriented.
- Social proof section adds a **specific testimonial**: a Staff promotion story tied to thinking-trap detection.
- Built-for section header changed from "Built for" to "Built for engineers who want Staff-level product sense."

**File**: `src/app/(onboarding)/welcome/page.tsx`

### 2. Role Select Page

**Before**: Disabled "Skip assessment" button with no explanation. Role descriptions were good but didn't mirror the user's internal monologue.

**After**:
- Added **painPoint** micro-copy to each role: "Your PRs get merged, but you never get asked 'what should we build?'" (SWE), "Your model improved recall by 12% -- and nobody in leadership noticed" (ML Eng).
- Wired the disabled "Skip assessment" button to actually navigate to `/dashboard` with clear label "Skip to challenges."

**File**: `src/app/(onboarding)/role/page.tsx`

### 3. Dashboard -- Returning User (the command center)

**Before**: Luma greeting was generic: "You're on a N-day streak with X XP! Your Y move is at Level Z."

**After**: The greeting now answers "what should I do right now?" in priority order:
1. If there's an **unfinished draft**: surfaces it by name with a clickable "Pick up where you left off" link. Luma state is `listening` (it's waiting for your input).
2. If there's a **streak going**: names the weakest move and says the next challenge targets it.
3. Otherwise: clear time-commitment framing ("It takes about 10 minutes").

This is the single biggest lever for daily retention -- the dashboard should feel like a coach who knows your state, not a static display.

**File**: `src/app/(app)/dashboard/page.tsx`

### 4. Dashboard -- No Calibration (first-time user)

**Before**: "Discover your product thinking level" + "Take a 10-minute calibration challenge."

**After**:
- Hero reframed: "Where does your product thinking stand?" + "Most engineers never get honest feedback on how they think about products -- only on the code they ship."
- "What to expect" section → "What you'll get in 5 minutes" with concrete outputs:
  - **Your skill radar**: "A 4-dimension score. No vague 'you're doing great.'"
  - **Thinking traps detected**: "Luma catches patterns like premature solutions, aggregate fallacies -- things your manager never tells you."
  - **A personalized plan**: "Targeted challenges for your role and level."

**File**: `src/app/(app)/dashboard/page.tsx`

### 5. Feedback Page (the money moment)

**Before**: Ended with "Next Challenge" button. No guidance on what to practice next.

**After**: Added a full **"What to practice next"** bridge section:
- Identifies the weakest dimension by score (e.g., "Focus area: Recommendation -- you scored 2.5/5")
- Explains why guided mode helps for that dimension
- Clear dual CTA: "Pick next challenge" (primary) + "View skill ladder" (secondary)
- Celebration banner now includes **score-tier-specific guidance** instead of just "Challenge complete!":
  - 80+: "This is Staff-level product thinking."
  - 60-79: "A few moves need sharpening. Check below."
  - <60: "Scroll down to see what Luma caught and what to practice next."

**File**: `src/app/(app)/challenges/[id]/feedback/page.tsx`

### 6. Explore Page

**Before**: Paradigm cards had generic descriptions and "Core collection" / "Growing library" labels.

**After**:
- Each paradigm card includes an **example challenge teaser** in a mini quote box (e.g., Agentic: "Your agent auto-approved 40 refunds overnight. 3 were fraudulent.")
- Luma recommendation banner is now **context-aware**: changes based on the active paradigm filter.
- Header copy: "Real scenarios from real companies. Pick a paradigm or follow a structured plan."

**File**: `src/app/(app)/explore/page.tsx`

### 7. Challenge Workspace (coaching prompts)

**Before**: Generic coaching tips like "Great product thinkers frame problems before jumping to solutions."

**After**: Staff-level specific coaching that names exact traps and gives concrete frameworks:
- Frame: "The biggest trap? Jumping to 'we should A/B test it' before understanding what broke."
- List: "The aggregate fallacy kills more analyses than bad data. 'Average users' don't exist."
- Optimize: "A 2x2 matrix (effort vs. impact) is your best friend."
- Win: "Weak recs say 'we should test this.' Strong recs say 'Ship X to segment Y, measure Z in 2 weeks, roll back if below threshold.'"

**File**: `src/components/challenge/ChallengeWorkspace.tsx`

### 8. Cohort Page

- Replaced "Team Cohorts -- Coming Soon" with a proper feature description explaining private leaderboards, team-wide skill growth, and a CTA to leave email.

**File**: `src/app/(app)/cohort/page.tsx`

## What I didn't change (and why)

- **Progress page**: Already improved in iteration 1. Has good Luma empty states and clear data.
- **Results/calibration pages**: Already solid from previous iteration.
- **Nav rail / layout**: These are shared shells and structurally sound.
- **API routes**: All changes are presentation-layer. No backend changes needed for this pass.

## Key principle applied

**Show, don't tell.** The welcome page shows a skill radar before asking you to take the assessment. The feedback page shows exactly which dimension to work on. The dashboard says the name of your unfinished challenge. Every screen answers "what's in it for me?" in under 3 seconds.
