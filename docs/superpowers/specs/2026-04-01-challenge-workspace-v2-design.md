# Challenge Workspace V2 — Design Spec

**Date:** 2026-04-01  
**Status:** Approved  
**Branch:** spec/content-management

---

## Goal

The user launches a challenge, travels through FLOW (Frame → List → Optimize → Win), answers all questions, and sees a final results screen with Luma's feedback. Everything happens on a single page (`/workspace/challenges/[id]`) — no navigation, no route changes.

---

## What Already Exists

The V2 backend is complete and correct:
- `FlowWorkspace.tsx` — state machine managing `phase: loading | question | reveal | complete`
- `StepQuestion.tsx` + `OptionCard.tsx` — MCQ rendering
- `StepReveal.tsx` — per-step score reveal (being replaced)
- `ChallengeComplete.tsx` — final results
- All API routes: `/api/v2/challenges/[id]/start`, `/step/[step]`, `/step/[step]/submit`, `/coaching`, `/complete`

The backend data model is untouched. Only the UI phases change.

---

## The Four Phases (all render in the same container)

### Phase 0: Scenario Intro

Shown when the challenge first loads (`phase === 'intro'`), before any attempt is started.

**Content (from `detail.challenge`):**
- Role badge: `scenario_role` (e.g. "Product Lead")
- Meta badges: `industry` · `difficulty` · `estimated_minutes` min
- Title: `challenge.title` (headline font)
- "The situation" block: `scenario_context`
- "What just happened" block: `scenario_trigger`
- "Your challenge" block: `scenario_question` — dark background card, stands out
- FLOW preview: 4 small tiles (Frame / List / Optimize / Win) with one-line descriptions
- CTA: "Start Challenge →" button

**On click:** Call `startAttempt(initialRoleId)`, set `phase = 'question'`. No animation needed — just swap.

**New `phase` value to add:** `'intro'` — insert before `'loading'` in the state machine. The `phase` initial value becomes `'intro'`. Loading the challenge detail happens in the background while the intro is shown; the Start button is disabled until `detail` is ready.

---

### Phase 1: Question

Current question screen, with two changes:

**Add: Compact scenario context bar**  
Below the stepper, above the nudge — a single collapsed card showing `challenge.title` + role badge. Gives user context without re-showing the full intro. Not interactive.

**Remove: The per-step reveal screen entirely**  
`StepReveal.tsx` is removed from the question flow. When `result.step_complete === true` after a submit, instead of switching to `phase = 'reveal'`, treat it the same as a mid-step completion — show the inline reveal on the final question of the step, then the "Next" button label becomes "Next: [step name]" (or "See Results" on the Win step).

**Question progression (unchanged):**
- User picks option(s), hits Submit
- Submit calls the API, gets back `revealed_options`, `score`, `grade_label`, coaching
- Transitions to the inline reveal state on the same question (see below)

---

### Phase 1b: Inline Reveal (same screen, replaces Submit button area)

After submit returns, the question card updates in place:

**Option cards flip to revealed state:**
- All 4 options now show their quality label badge + explanation text below the option text
- Selected option gets a green border + "Your choice" marker
- Best option (points=3) gets primary green badge ("Best · 3 pts")
- good_but_incomplete → amber/tertiary badge ("Good, but incomplete")
- surface → secondary badge ("Surface")
- plausible_wrong → error-tint badge ("Plausible but wrong")
- Non-selected options dim slightly (opacity ~70%)

**Luma coaching bubble appears below options:**
- Luma glyph (`state="speaking"`) + role_context text + career_signal in italic
- Styled as a card: `bg-surface-container-low`, rounded, subtle border

**Submit button replaced by Next button:**
- Mid-step: "Next question →"
- Last question of a non-final step: "Next: [step name] →"  
- Last question of Win step: "See Results →"

**Score stays hidden** — no points shown inline, no step score. Only the quality label (Best / Good, but incomplete / Surface / Plausible but wrong).

---

### Phase 2: Complete (final results — score revealed here for the first time)

`ChallengeComplete.tsx` — already mostly correct. Minor updates:

**Keep:**
- Luma glyph (celebrating / reviewing based on score)
- Grade label + total score
- XP badge
- Step breakdown (horizontal bars, one per step)
- Competency deltas
- Try Again / Next Challenge buttons

**Change:**
- Step breakdown: switch from vertical bar chart (4 columns, bars growing up) to horizontal bars (label + bar + score/max) — easier to read at a glance, matches the mockup
- Grade label gets its own prominent line before the score number

---

## State Machine Changes

Current `phase` type: `'loading' | 'question' | 'reveal' | 'complete'`

New `phase` type: `'intro' | 'loading' | 'question' | 'complete'`

- `'reveal'` is removed — inline reveal is a sub-state within `'question'`, tracked by a boolean `revealed: boolean` alongside the existing `revealedOptions` state
- `'intro'` is added as the initial phase
- `'loading'` still used while the attempt is being created after Start is clicked

### New state variable:
```typescript
const [revealed, setRevealed] = useState(false)
```
Set to `true` after `submitAnswer` returns. Reset to `false` when advancing to the next question.

### handleSubmit change:
After getting result back, instead of:
```typescript
if (result.step_complete) setPhase('reveal')
else { setQuestionIdx(i => i + 1); ... }
```

Do:
```typescript
setRevealedOptions(result.revealed_options ?? [])
setRevealed(true)
// coaching fetch stays the same
// don't advance yet — wait for Next button click
```

### handleNext (new):
```typescript
function handleNext() {
  setRevealed(false)
  setSelectedOptionId(null)
  setElaboration('')
  setRevealedOptions([])
  startTimeRef.current = Date.now()

  if (result.step_complete) {
    // advance step or complete
    const stepIdx = FLOW_STEPS.indexOf(currentStep)
    if (stepIdx === FLOW_STEPS.length - 1) {
      // call /complete, setPhase('complete')
    } else {
      setCompletedSteps(prev => [...prev, currentStep])
      setCurrentStep(FLOW_STEPS[stepIdx + 1])
      setQuestionIdx(0)
    }
  } else {
    setQuestionIdx(i => i + 1)
  }
}
```

Note: `result.step_complete` needs to be stored in state between submit and Next click.

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/v2/FlowWorkspace.tsx` | Add `'intro'` phase, remove `'reveal'` phase, add `revealed` state, wire `handleNext`, add scenario intro render block, add compact context bar in question phase |
| `src/components/v2/StepQuestion.tsx` | Pass `revealed` + `revealedOptions` down; show quality badge + explanation on each `OptionCard` when revealed |
| `src/components/v2/OptionCard.tsx` | Already supports reveal — verify quality label colors match spec above |
| `src/components/v2/StepReveal.tsx` | **Delete** — no longer used |
| `src/components/v2/ChallengeComplete.tsx` | Switch step breakdown from vertical bar chart to horizontal bars |

---

## Files NOT to Change

- All API routes under `src/app/api/v2/` — backend is correct
- `FlowStepper.tsx` — already correct
- `FlowWorkspaceShell.tsx` — no changes needed
- `src/app/(workspace)/challenges/[id]/page.tsx` — no changes needed
- DB schema, hooks, grading logic — untouched

---

## Mock Mode Support

In mock mode (`NEXT_PUBLIC_USE_MOCK_DATA=true`), the V2 API routes return mock data. The intro phase relies on `detail.challenge` which is returned by `useChallengeV2`. Verify the mock returns `scenario_context`, `scenario_trigger`, `scenario_question`, `scenario_role` fields — add them to the mock if missing.

---

## Verification

1. Navigate to `/workspace/challenges/c1-notification-fatigue`
2. Scenario intro screen shows with role, situation, trigger, challenge question
3. Click "Start Challenge" — transitions to Frame Q1
4. Select option B, click Submit — options flip, quality labels appear, Luma coaching bubble appears below
5. Click "Next question →" — moves to next question (or next step if last in step)
6. Complete all questions through Win step
7. Click "See Results →" — final results screen appears with grade, score, step breakdown, competency deltas
8. Score was never shown during questions — only quality labels (Best / Good, etc.)
9. "Try Again" resets to intro screen; "Next Challenge" exits
