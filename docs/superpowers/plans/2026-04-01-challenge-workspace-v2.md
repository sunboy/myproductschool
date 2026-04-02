# Challenge Workspace V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the V2 challenge workspace UI so users go through a scenario intro → answer MCQ questions → see inline option reveals with Luma coaching → final results screen, all on one page with no navigation.

**Architecture:** The existing `FlowWorkspace.tsx` state machine is refactored: add `'intro'` phase (scenario context before questions), remove the `'reveal'` phase (replaced by inline reveal on the same question card), add `revealed` boolean state so options flip in place after submit. The V2 API routes get mock mode support so the flow works with `NEXT_PUBLIC_USE_MOCK_DATA=true`. `StepReveal.tsx` is deleted. `ChallengeComplete.tsx` gets horizontal step bars.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Supabase (real data already seeded), mock mode via `NEXT_PUBLIC_USE_MOCK_DATA=true`

---

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `src/components/v2/FlowWorkspace.tsx` | Modify | Add `'intro'` phase + render block, remove `'reveal'` phase, add `revealed` + `stepComplete` state, add `handleNext`, add compact context bar |
| `src/components/v2/StepReveal.tsx` | **Delete** | No longer used anywhere |
| `src/components/v2/ChallengeComplete.tsx` | Modify | Horizontal step bars instead of vertical bar chart |
| `src/components/v2/index.ts` | Modify | Remove `StepReveal` export |
| `src/app/api/v2/challenges/[id]/route.ts` | Modify | Add mock fallback when `USE_MOCK_DATA=true` |
| `src/app/api/v2/challenges/[id]/start/route.ts` | Modify | Add mock fallback |
| `src/app/api/v2/challenges/[id]/step/[step]/route.ts` | Modify | Add mock fallback |
| `src/app/api/v2/challenges/[id]/step/[step]/submit/route.ts` | Modify | Add mock fallback |
| `src/app/api/v2/challenges/[id]/coaching/route.ts` | Modify | Add mock fallback |
| `src/app/api/v2/challenges/[id]/complete/route.ts` | Modify | Add mock fallback |

---

## Task 1: Add mock support to V2 API routes

The V2 routes require `auth.getUser()` and return 401 in mock mode. Add a mock bypass to each route so the workspace is testable without a real user session.

**Files:**
- Modify: `src/app/api/v2/challenges/[id]/route.ts`
- Modify: `src/app/api/v2/challenges/[id]/start/route.ts`
- Modify: `src/app/api/v2/challenges/[id]/step/[step]/route.ts`
- Modify: `src/app/api/v2/challenges/[id]/step/[step]/submit/route.ts`
- Modify: `src/app/api/v2/challenges/[id]/coaching/route.ts`
- Modify: `src/app/api/v2/challenges/[id]/complete/route.ts`

### Pattern to use in every route

At the top of each route handler, before the auth check, add:

```typescript
const isMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'
```

Then replace the auth block:
```typescript
// BEFORE:
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// AFTER:
const { data: { user } } = await supabase.auth.getUser()
if (!user && !isMock) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
const userId = user?.id ?? 'mock-user-00000000-0000-0000-0000-000000000000'
```

Replace every subsequent `user.id` reference with `userId`.

### `GET /api/v2/challenges/[id]/route.ts`

The route already reads from Supabase (which has real seeded data). With `isMock`, the challenge query works as-is since the data is in the DB. Only auth needs patching.

- [ ] **Step 1: Add mock bypass to challenge detail route**

Open `src/app/api/v2/challenges/[id]/route.ts`. Replace:
```typescript
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```
With:
```typescript
  const isMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !isMock) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user?.id ?? 'mock-user-00000000-0000-0000-0000-000000000000'
```

Also update the `current_attempt` query — replace `.eq('user_id', user.id)` with `.eq('user_id', userId)`.

- [ ] **Step 2: Add mock bypass to start route**

Open `src/app/api/v2/challenges/[id]/start/route.ts`. Apply the same pattern:

Replace:
```typescript
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```
With:
```typescript
  const isMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !isMock) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user?.id ?? 'mock-user-00000000-0000-0000-0000-000000000000'
```

Replace all `user.id` with `userId`. In the free tier check, when `isMock` is true the subscription check will return null — `isFreeTier` will be true but mock users don't hit the daily limit in practice (they can just reset). No special handling needed.

- [ ] **Step 3: Add mock bypass to step load route**

Open `src/app/api/v2/challenges/[id]/step/[step]/route.ts`. Apply same auth pattern. Check all `user.id` references and replace with `userId`.

- [ ] **Step 4: Add mock bypass to submit route**

Open `src/app/api/v2/challenges/[id]/step/[step]/submit/route.ts`. Apply same pattern. This route also writes `step_attempts` records — with `userId = 'mock-user-...'`, these writes will fail FK constraint against `auth.users`. Wrap the `insert` into `step_attempts` in a conditional:

```typescript
if (!isMock) {
  // insert step_attempts record
  await adminClient.from('step_attempts').insert({ ... })
}
```

The grading logic still runs and returns the result — only the persistence is skipped in mock mode.

- [ ] **Step 5: Add mock bypass to coaching route**

Open `src/app/api/v2/challenges/[id]/coaching/route.ts`. Apply same auth pattern.

In mock mode, skip the Claude API call and return a static coaching response:
```typescript
if (isMock) {
  return NextResponse.json({
    role_context: 'As a software engineer, framing the problem before jumping to solutions is the instinct that separates senior engineers from mid-level ones.',
    career_signal: 'This kind of thinking shows up in staff-level design reviews.',
  })
}
```
Add this block right after the auth check.

- [ ] **Step 6: Add mock bypass to complete route**

Open `src/app/api/v2/challenges/[id]/complete/route.ts`. Apply same auth pattern.

In mock mode, skip the DB writes (competency updates, XP award, profile update) and return a synthetic completion result. Add this block right after the auth check:
```typescript
if (isMock) {
  return NextResponse.json({
    total_score: 2.4,
    max_score: 3.0,
    grade_label: 'Strong',
    xp_awarded: 240,
    step_breakdown: [
      { step: 'frame', score: 2.4, max_score: 3.0 },
      { step: 'list', score: 2.1, max_score: 3.0 },
      { step: 'optimize', score: 2.7, max_score: 3.0 },
      { step: 'win', score: 2.4, max_score: 3.0 },
    ],
    competency_deltas: [
      { competency: 'strategic_thinking', before: 50, after: 56 },
      { competency: 'cognitive_empathy', before: 50, after: 53 },
    ],
  })
}
```

- [ ] **Step 7: Verify TypeScript**

```bash
cd /Users/sandeep/Projects/myproductschool-content && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```
Expected: no errors related to the changed routes.

- [ ] **Step 8: Commit**

```bash
cd /Users/sandeep/Projects/myproductschool-content
git add src/app/api/v2/challenges/
git commit -m "feat(v2): add mock mode support to all V2 challenge API routes"
```

---

## Task 2: Refactor FlowWorkspace — add intro phase, remove reveal phase

This is the core state machine change. We're replacing `phase: 'loading' | 'question' | 'reveal' | 'complete'` with `phase: 'intro' | 'loading' | 'question' | 'complete'` and adding inline reveal.

**Files:**
- Modify: `src/components/v2/FlowWorkspace.tsx`

- [ ] **Step 1: Replace the phase type and add new state**

At the top of `FlowWorkspace`, replace the existing state declarations with the updated set. The current state block (lines ~39–55) becomes:

```typescript
const [attemptId, setAttemptId] = useState<string | null>(null)
const [currentStep, setCurrentStep] = useState<FlowStep>('frame')
const [completedSteps, setCompletedSteps] = useState<FlowStep[]>([])
const [phase, setPhase] = useState<'intro' | 'loading' | 'question' | 'complete'>('intro')

// Per-question state
const [questionIdx, setQuestionIdx] = useState(0)
const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
const [elaboration, setElaboration] = useState('')
const [revealedOptions, setRevealedOptions] = useState<RevealedOption[]>([])
const [revealed, setRevealed] = useState(false)
const [stepComplete, setStepComplete] = useState(false)
const [roleContext, setRoleContext] = useState('')
const [careerSignal, setCareerSignal] = useState('')
const [completionData, setCompletionData] = useState<CompletionData | null>(null)
```

- [ ] **Step 2: Update the bootstrap useEffect**

The challenge detail now loads in the background while the intro is showing. Replace the second `useEffect` (lines ~64–80) so that it only starts the attempt when the user clicks Start — not automatically:

```typescript
useEffect(() => {
  reload()
}, [reload])

// Remove the second useEffect that auto-called startAttempt
// startAttempt is now called from handleStartChallenge
```

Delete the `useEffect` that watches `detail && !attemptId` and calls `startAttempt`.

- [ ] **Step 3: Add handleStartChallenge**

After the existing `startTimeRef` declaration, add:

```typescript
const handleStartChallenge = useCallback(async () => {
  if (!detail) return
  setPhase('loading')
  const attempt = await startAttempt(initialRoleId)
  if (attempt) {
    setAttemptId(attempt.id)
    setCurrentStep(attempt.current_step === 'done' ? 'frame' : attempt.current_step as FlowStep)
    setPhase('question')
  }
}, [detail, initialRoleId, startAttempt])
```

- [ ] **Step 4: Update handleSubmit — inline reveal instead of phase switch**

Replace the entire `handleSubmit` callback with:

```typescript
const handleSubmit = useCallback(async () => {
  if (!attemptId || !currentQuestion) return

  const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
  const result = await submitAnswer({
    attemptId,
    questionId: currentQuestion.id,
    selectedOptionId,
    userText: elaboration || null,
    responseType: currentQuestion.response_type,
    timespentSeconds: elapsed,
  })

  if (!result) return

  setRevealedOptions(result.revealed_options ?? [])
  setStepComplete(result.step_complete)
  setRevealed(true)

  const coaching = await fetchCoaching({
    attemptId,
    questionId: currentQuestion.id,
    optionId: selectedOptionId,
    roleId: initialRoleId,
    userText: elaboration || null,
  })
  if (coaching) {
    setRoleContext(coaching.role_context)
    setCareerSignal(coaching.career_signal)
  }
}, [attemptId, currentQuestion, selectedOptionId, elaboration, submitAnswer, fetchCoaching, initialRoleId])
```

- [ ] **Step 5: Add handleNext**

Add a new `handleNext` callback after `handleSubmit`:

```typescript
const handleNext = useCallback(async () => {
  setRevealed(false)
  setSelectedOptionId(null)
  setElaboration('')
  setRevealedOptions([])
  setRoleContext('')
  setCareerSignal('')
  startTimeRef.current = Date.now()

  if (stepComplete) {
    const stepIdx = FLOW_STEPS.indexOf(currentStep)
    if (stepIdx === FLOW_STEPS.length - 1) {
      // Last step — call complete
      try {
        const res = await fetch(`/api/v2/challenges/${challengeId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attempt_id: attemptId }),
        })
        if (res.ok) {
          const data = await res.json()
          setCompletionData({
            total_score: data.total_score,
            max_score: data.max_score,
            grade_label: data.grade_label,
            xp_awarded: data.xp_awarded,
            step_breakdown: data.step_breakdown ?? [],
            competency_deltas: data.competency_deltas ?? [],
          })
        }
      } catch {
        // fail silently — show complete with null data
      }
      setPhase('complete')
    } else {
      setCompletedSteps((prev) => [...prev, currentStep])
      setCurrentStep(FLOW_STEPS[stepIdx + 1])
      setQuestionIdx(0)
    }
  } else {
    setQuestionIdx((i) => i + 1)
  }
}, [stepComplete, currentStep, challengeId, attemptId])
```

- [ ] **Step 6: Determine next button label**

Add a derived value after the `canSubmit` declaration:

```typescript
const isLastStepLastQuestion = stepComplete && FLOW_STEPS.indexOf(currentStep) === FLOW_STEPS.length - 1
const nextLabel = isLastStepLastQuestion
  ? 'See Results →'
  : stepComplete
  ? `Next: ${FLOW_STEPS[FLOW_STEPS.indexOf(currentStep) + 1].charAt(0).toUpperCase() + FLOW_STEPS[FLOW_STEPS.indexOf(currentStep) + 1].slice(1)} →`
  : 'Next question →'
```

- [ ] **Step 7: Add the intro phase render block**

In the render section, before the `challengeLoading` check, add:

```typescript
if (phase === 'intro') {
  const c = detail?.challenge
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {c?.scenario_role && (
          <span className="bg-primary-fixed text-on-surface rounded-full px-3 py-1 font-label text-xs font-semibold">{c.scenario_role}</span>
        )}
        {c?.industry && (
          <span className="bg-secondary-container text-on-secondary-container rounded-full px-3 py-1 font-label text-xs font-semibold">{c.industry}</span>
        )}
        {c?.difficulty && (
          <span className="bg-surface-container-highest text-on-surface-variant rounded-full px-3 py-1 font-label text-xs font-semibold capitalize">{c.difficulty.replace('_', ' ')}</span>
        )}
        {c?.estimated_minutes && (
          <span className="bg-surface-container-highest text-on-surface-variant rounded-full px-3 py-1 font-label text-xs font-semibold">~{c.estimated_minutes} min</span>
        )}
      </div>

      {/* Title */}
      {c?.title && (
        <h1 className="font-headline text-2xl text-on-surface">{c.title}</h1>
      )}

      {/* Situation */}
      {c?.scenario_context && (
        <div className="bg-surface-container rounded-xl p-4 space-y-1">
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-wide">The situation</p>
          <p className="font-body text-sm text-on-surface leading-relaxed">{c.scenario_context}</p>
        </div>
      )}

      {/* Trigger */}
      {c?.scenario_trigger && (
        <div className="bg-surface-container rounded-xl p-4 space-y-1">
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-wide">What just happened</p>
          <p className="font-body text-sm text-on-surface leading-relaxed">{c.scenario_trigger}</p>
        </div>
      )}

      {/* Challenge question */}
      {c?.scenario_question && (
        <div className="bg-inverse-surface rounded-xl p-4 space-y-1">
          <p className="font-label text-xs text-inverse-primary uppercase tracking-wide">Your challenge</p>
          <p className="font-body text-sm text-inverse-on-surface leading-relaxed font-medium">{c.scenario_question}</p>
        </div>
      )}

      {/* FLOW preview */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { step: 'Frame', desc: 'Define the problem' },
          { step: 'List', desc: 'Map the options' },
          { step: 'Optimize', desc: 'Weigh trade-offs' },
          { step: 'Win', desc: 'Make the call' },
        ].map(({ step, desc }) => (
          <div key={step} className="bg-surface-container-low rounded-xl p-3 text-center space-y-1">
            <p className="font-label text-xs font-semibold text-on-surface">{step}</p>
            <p className="font-label text-[10px] text-on-surface-variant">{desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex justify-end">
        <button
          onClick={handleStartChallenge}
          disabled={!detail || challengeLoading}
          className="bg-primary text-on-primary rounded-full px-8 py-3 font-label font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {challengeLoading ? 'Loading…' : 'Start Challenge →'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Remove the 'reveal' phase render block**

Delete the entire `if (phase === 'reveal')` block (currently lines ~222–239). It imports `StepReveal` which will be deleted next.

Remove the `StepReveal` import at the top of the file.

- [ ] **Step 9: Update question phase render to add context bar and inline reveal**

Replace the `// phase === 'question'` render block's return statement. The full updated return:

```typescript
return (
  <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
    <FlowStepper currentStep={currentStep} completedSteps={completedSteps} />

    {/* Compact context bar */}
    {detail && (
      <div className="flex items-center gap-2 bg-surface-container-low rounded-xl px-4 py-2.5">
        <span
          className="material-symbols-outlined text-on-surface-variant text-[16px]"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
        >
          work
        </span>
        <p className="font-label text-sm text-on-surface truncate">{detail.challenge.title}</p>
        {detail.challenge.scenario_role && (
          <span className="bg-primary-fixed text-on-surface rounded-full px-2.5 py-0.5 font-label text-[11px] font-semibold shrink-0">{detail.challenge.scenario_role}</span>
        )}
      </div>
    )}

    {/* Nudge */}
    {stepData?.nudge && (
      <div className="flex items-start gap-2 bg-secondary-container rounded-xl px-4 py-3">
        <span
          className="material-symbols-outlined text-on-secondary-container text-[18px] shrink-0 mt-0.5"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
        >
          lightbulb
        </span>
        <p className="font-body text-sm text-on-secondary-container">{stepData.nudge}</p>
      </div>
    )}

    {/* Question */}
    {stepLoading ? (
      <div className="flex justify-center py-8">
        <LumaGlyph size={40} state="reviewing" className="text-primary" />
      </div>
    ) : stepError ? (
      <p className="font-body text-error text-sm text-center">{stepError}</p>
    ) : currentQuestion ? (
      <StepQuestion
        question={currentQuestion}
        responseType={currentQuestion.response_type}
        selectedOptionId={selectedOptionId}
        elaboration={elaboration}
        revealed={revealed}
        revealedOptions={revealedOptions}
        onOptionSelect={setSelectedOptionId}
        onElaborationChange={setElaboration}
        disabled={submitting || revealed}
      />
    ) : null}

    {/* Luma coaching (shown after reveal) */}
    {revealed && (roleContext || careerSignal) && (
      <div className="flex items-start gap-3 bg-surface-container-low rounded-xl p-4 border border-outline-variant">
        <LumaGlyph size={36} state="speaking" className="text-primary shrink-0" />
        <div className="flex-1 min-w-0 space-y-1">
          {roleContext && <p className="font-body text-sm text-on-surface">{roleContext}</p>}
          {careerSignal && <p className="font-body text-xs text-on-surface-variant italic">{careerSignal}</p>}
        </div>
      </div>
    )}

    {/* Action buttons */}
    {currentQuestion && (
      <div className="flex justify-end">
        {revealed ? (
          <button
            onClick={handleNext}
            className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            {nextLabel}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Grading…' : 'Submit'}
          </button>
        )}
      </div>
    )}
  </div>
)
```

- [ ] **Step 10: Update onRetry to go back to intro**

In the `ChallengeComplete` `onRetry` prop, change:
```typescript
// BEFORE:
onRetry={() => {
  setAttemptId(null)
  setCompletedSteps([])
  setCurrentStep('frame')
  setPhase('loading')
  reload()
}}

// AFTER:
onRetry={() => {
  setAttemptId(null)
  setCompletedSteps([])
  setCurrentStep('frame')
  setRevealed(false)
  setStepComplete(false)
  setQuestionIdx(0)
  setPhase('intro')
}}
```

- [ ] **Step 11: Verify TypeScript**

```bash
cd /Users/sandeep/Projects/myproductschool-content && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```
Expected: no errors in `FlowWorkspace.tsx`.

- [ ] **Step 12: Commit**

```bash
cd /Users/sandeep/Projects/myproductschool-content
git add src/components/v2/FlowWorkspace.tsx
git commit -m "feat(v2): refactor FlowWorkspace — add intro phase, inline reveal, remove step reveal screen"
```

---

## Task 3: Delete StepReveal, update index exports

**Files:**
- Delete: `src/components/v2/StepReveal.tsx`
- Modify: `src/components/v2/index.ts`

- [ ] **Step 1: Check nothing else imports StepReveal**

```bash
cd /Users/sandeep/Projects/myproductschool-content && grep -r "StepReveal" src/ --include="*.tsx" --include="*.ts" -l
```
Expected: only `src/components/v2/index.ts` (and possibly `FlowWorkspace.tsx` which we already removed the import from in Task 2).

- [ ] **Step 2: Remove StepReveal from index.ts**

Read `src/components/v2/index.ts`. Remove the line that exports `StepReveal`. Example — if it contains:
```typescript
export { StepReveal } from './StepReveal'
```
Delete that line.

- [ ] **Step 3: Delete the file**

```bash
rm /Users/sandeep/Projects/myproductschool-content/src/components/v2/StepReveal.tsx
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd /Users/sandeep/Projects/myproductschool-content && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/sandeep/Projects/myproductschool-content
git add src/components/v2/
git commit -m "chore(v2): delete StepReveal component — replaced by inline reveal in FlowWorkspace"
```

---

## Task 4: Update ChallengeComplete — horizontal step bars

**Files:**
- Modify: `src/components/v2/ChallengeComplete.tsx`

- [ ] **Step 1: Replace the step breakdown section**

In `ChallengeComplete.tsx`, find the step breakdown div (currently a `grid grid-cols-4` with vertical bars). Replace it with horizontal bars:

```typescript
{/* Step breakdown — horizontal bars */}
<div className="bg-surface-container rounded-xl p-5 space-y-4">
  <h2 className="font-headline text-base text-on-surface">Step breakdown</h2>
  <div className="space-y-3">
    {stepBreakdown.map(({ step, score, maxScore: ms }) => {
      const pct = ms > 0 ? (score / ms) * 100 : 0
      return (
        <div key={step} className="flex items-center gap-3">
          <p className="font-label text-xs text-on-surface w-14 shrink-0 capitalize">{STEP_LABELS[step]}</p>
          <div className="flex-1 bg-surface-container-high rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.max(2, pct)}%` }}
            />
          </div>
          <p className="font-label text-xs text-on-surface-variant w-10 text-right shrink-0">
            {score.toFixed(1)}<span className="text-on-surface-variant opacity-60">/{ms.toFixed(0)}</span>
          </p>
        </div>
      )
    })}
  </div>
</div>
```

- [ ] **Step 2: Make grade label its own prominent line**

In the hero section, currently the grade label and score are on the same line pattern. Update to:

```typescript
{/* Hero */}
<div className="text-center space-y-2">
  <div className="flex justify-center">
    <LumaGlyph size={80} state={isHighScore ? 'celebrating' : 'reviewing'} className="text-primary" />
  </div>
  <p className="font-label text-sm text-on-surface-variant uppercase tracking-wide">Challenge complete</p>
  <h1 className={`font-headline text-4xl font-bold ${gradeColorClass}`}>{gradeLabel}</h1>
  <p className="font-headline text-2xl text-on-surface">
    {totalScore.toFixed(1)} <span className="text-on-surface-variant text-lg font-normal">/ {maxScore.toFixed(1)}</span>
  </p>
  <span className="inline-block bg-primary text-on-primary rounded-full px-5 py-1.5 font-label font-semibold text-sm">
    +{xpAwarded} XP
  </span>
</div>
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/sandeep/Projects/myproductschool-content && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/sandeep/Projects/myproductschool-content
git add src/components/v2/ChallengeComplete.tsx
git commit -m "feat(v2): update ChallengeComplete — horizontal step bars, prominent grade label"
```

---

## Task 5: End-to-end verification

**Goal:** Walk through the complete flow in the browser to confirm everything works.

- [ ] **Step 1: Start dev server**

```bash
cd /Users/sandeep/Projects/myproductschool-content && npm run dev
```
Expected: compiles clean, available at http://localhost:3000

- [ ] **Step 2: Navigate to a seeded challenge**

Open http://localhost:3000/workspace/challenges/c1-notification-fatigue

Expected: Scenario intro screen shows with:
- "Product Lead" role badge
- "B2B SaaS", "standard", "~20 min" badges
- Title: "Notification Fatigue: Fixing a B2B SaaS Drop-off"
- "The situation" block with context text
- "What just happened" block with trigger text
- Dark "Your challenge" card with scenario question
- 4 FLOW preview tiles (Frame / List / Optimize / Win)
- "Start Challenge →" button (enabled)

- [ ] **Step 3: Click Start Challenge**

Expected: transitions to Frame Q1. Verify:
- FlowStepper shows Frame as active
- Compact context bar shows title + "Product Lead" badge
- Nudge card shows step nudge text
- Question text appears
- 4 option cards (A/B/C/D) are shown
- Submit button is disabled (no option selected)

- [ ] **Step 4: Select an option and submit**

Click option B. Submit button enables. Click Submit.

Expected after submit:
- Submit button disappears (replaced by "Next question →")
- All 4 options show quality labels inline:
  - A: "Surface" badge
  - B: "Best · 3 pts" — green border, "Your choice" marker (or equivalent)  
    *(Note: the plan spec says no points shown — but the quality label "Best" is shown. The "3 pts" text should be removed from the badge: just show "Best" not "Best · 3 pts")*
  - C: "Plausible but wrong" badge
  - D: "Good, but incomplete" badge
- Explanations appear below each option
- Luma coaching bubble appears below options
- "Next question →" button visible

- [ ] **Step 5: Click through all questions**

Progress through all questions in all 4 steps. Verify:
- Last question in Frame step shows "Next: List →" button
- Last question in Win step shows "See Results →" button
- Score is never shown during questions (only quality labels)

- [ ] **Step 6: Click See Results**

Expected: ChallengeComplete screen shows:
- Luma glyph (celebrating or reviewing)
- Grade label prominent (e.g. "Strong")
- Score (e.g. "2.4 / 3.0")
- XP badge
- Horizontal step bars for Frame/List/Optimize/Win
- Competency deltas section
- Try Again / Next Challenge buttons

- [ ] **Step 7: Click Try Again**

Expected: returns to scenario intro screen (not question screen).

- [ ] **Step 8: Fix any issues found, commit when clean**

```bash
cd /Users/sandeep/Projects/myproductschool-content
git add -p
git commit -m "fix(v2): address issues found during end-to-end verification"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Scenario intro with role/situation/trigger/challenge | Task 2, Step 7 |
| Start Challenge → question (no animation, just swap) | Task 2, Steps 3+7 |
| Compact context bar in question phase | Task 2, Step 9 |
| Remove per-step reveal screen | Task 2, Steps 4+8 |
| Options flip inline after submit | Task 2, Steps 4+5+9 |
| Quality labels: Best/Good, but incomplete/Surface/Plausible but wrong | Task 2, Step 9 (OptionCard already supports this) |
| Luma coaching bubble below revealed options | Task 2, Step 9 |
| Submit replaced by Next button after reveal | Task 2, Steps 6+9 |
| Score hidden until final screen | Task 2 (score not rendered in question phase) |
| Next button labels: "Next question →" / "Next: [step] →" / "See Results →" | Task 2, Steps 6+9 |
| Final results: grade label prominent, horizontal step bars | Task 4 |
| Try Again → returns to intro | Task 2, Step 10 |
| Mock mode support | Task 1 |
| Delete StepReveal | Task 3 |

**Placeholder scan:** None found.

**Type consistency:** `stepComplete` boolean stored in state, used in `handleNext`. `revealed` boolean controls which button renders. `revealedOptions` flows from submit result → `StepQuestion` → `OptionCard` (existing path, just now triggered via inline reveal instead of phase switch).

**Note on "Best · 3 pts":** Step 4 of Task 5 verification notes that the spec says score stays hidden. The `OptionCard` currently shows `{tier.label}` where `TIER_STYLES` maps `3 → 'Outstanding'`, `2 → 'Strong'`, etc. — not point values. The option quality label (Best/Good, but incomplete/Surface/Plausible but wrong) needs to map correctly. Check `OptionCard.tsx` — it uses `revealData.points` to look up `TIER_STYLES`. The tier labels there are `Outstanding/Strong/Developing/Needs Work` — not the spec labels `Best/Good, but incomplete/Surface/Plausible but wrong`. Update `TIER_STYLES` in `OptionCard.tsx` as part of Task 2 Step 9, or as a separate micro-fix:

```typescript
// In OptionCard.tsx, update TIER_STYLES:
const TIER_STYLES: Record<number, { badge: string; label: string }> = {
  3: { badge: 'bg-primary text-on-primary', label: 'Best' },
  2: { badge: 'bg-tertiary-container text-on-surface', label: 'Good, but incomplete' },
  1: { badge: 'bg-secondary-container text-on-secondary-container', label: 'Surface' },
  0: { badge: 'bg-error/10 text-error', label: 'Plausible but wrong' },
}
```
Add this to Task 2 Step 9 before the render update.
