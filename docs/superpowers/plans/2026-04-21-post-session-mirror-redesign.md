# PostSessionMirror Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current per-step expand/collapse card in PostSessionMirror with compact summary cards + a paginated step-detail modal, eliminating raw DB option IDs and fixing multi-question overflow.

**Architecture:** Add a `questions` field to `MirrorStepResult` in `PostSessionMirror.tsx` (carrying per-question reveal data from FlowWorkspace), extract a `StepDetailModal` presentational component, and rewrite `StepCard` to render choice chips + truncated Hatch text that opens the modal on click.

**Tech Stack:** React 19, TypeScript, Next.js App Router, Tailwind CSS v4, GSAP (existing), CSS transitions for modal question pagination.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/components/v2/PostSessionMirror.tsx` | Modify | Add `questions` field to `StepResult`, rewrite `StepCard` to show chips + truncated text, wire modal open state |
| `src/components/v2/StepDetailModal.tsx` | Create | Presentational modal: paginated questions, sorted options, pick highlight, explanation, framework hint |
| `src/components/v2/FlowWorkspace.tsx` | Modify | Carry `questionRevealHistory` into `mirrorStepResults` when accumulating each step result |

---

### Task 1: Extend `StepResult` type and update FlowWorkspace to carry question data

**Files:**
- Modify: `src/components/v2/PostSessionMirror.tsx` (lines 9–23 — the `StepResult` interface)
- Modify: `src/components/v2/FlowWorkspace.tsx` (lines 586–599 — where `mirrorResult` is built)

This task adds a `questions` field to `StepResult` so the modal has data to render. `QuestionRevealRecord` is already exported from `FlowWorkspace.tsx` (line 29) — we reuse it directly.

- [ ] **Step 1: Add `questions` field to `StepResult` in PostSessionMirror.tsx**

Open `src/components/v2/PostSessionMirror.tsx`. Change the `StepResult` interface (lines 9–23) from:

```typescript
export interface StepResult {
  step: 'frame' | 'list' | 'optimize' | 'win'
  score: number
  quality_label: string
  confidence: number | null
  reasoning: string
  competency_signal?: {
    primary: string
    signal: string
    framework_hint: string
  }
  lumaSignal?: string | null
  frameworkHint?: string | null
  selectedOptionId?: string | null
}
```

to:

```typescript
export interface StepResultQuestion {
  questionText: string
  selectedOptionId: string | null
  options: Array<{
    id: string
    option_label: string
    option_text: string
    quality: string
    explanation: string
    framework_hint?: string
  }>
}

export interface StepResult {
  step: 'frame' | 'list' | 'optimize' | 'win'
  score: number
  quality_label: string
  confidence: number | null
  reasoning: string
  competency_signal?: {
    primary: string
    signal: string
    framework_hint: string
  }
  lumaSignal?: string | null
  frameworkHint?: string | null
  selectedOptionId?: string | null
  questions?: StepResultQuestion[]
}
```

- [ ] **Step 2: Update FlowWorkspace to populate `questions` when building mirrorResult**

Open `src/components/v2/FlowWorkspace.tsx`. Find the block at line ~586 where `mirrorResult` is built. Change it from:

```typescript
const mirrorResult: MirrorStepResult | null = stepRevealRecord ? {
  step: currentStep as 'frame' | 'list' | 'optimize' | 'win',
  score: stepRevealRecord.score ?? 0,
  quality_label: stepRevealRecord.gradeLabel ?? 'plausible_wrong',
  confidence: confidence,
  reasoning: reasoning,
  competency_signal: stepRevealRecord.competencySignal ?? undefined,
  lumaSignal: stepRevealRecord.competencySignal?.signal ?? null,
  frameworkHint: stepRevealRecord.competencySignal?.framework_hint ?? null,
  selectedOptionId: stepRevealRecord.selectedOptionId ?? null,
} : null
```

to:

```typescript
const mirrorResult: MirrorStepResult | null = stepRevealRecord ? {
  step: currentStep as 'frame' | 'list' | 'optimize' | 'win',
  score: stepRevealRecord.score ?? 0,
  quality_label: stepRevealRecord.gradeLabel ?? 'plausible_wrong',
  confidence: confidence,
  reasoning: reasoning,
  competency_signal: stepRevealRecord.competencySignal ?? undefined,
  lumaSignal: stepRevealRecord.competencySignal?.signal ?? null,
  frameworkHint: stepRevealRecord.competencySignal?.framework_hint ?? null,
  selectedOptionId: stepRevealRecord.selectedOptionId ?? null,
  questions: questionRevealHistory.map(q => ({
    questionText: q.questionText,
    selectedOptionId: q.selectedOptionId,
    options: q.revealedOptions.map(o => ({
      id: o.id,
      option_label: o.option_label ?? '',
      option_text: o.option_text ?? '',
      quality: o.quality ?? 'plausible_wrong',
      explanation: o.explanation,
      framework_hint: o.framework_hint,
    })),
  })),
} : null
```

Note: `questionRevealHistory` is already in scope at this point in `FlowWorkspace`. The last item in `questionRevealHistory` is the current question that just completed, so the full history by this point contains all questions for the step.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/sandeep/Projects/myproductschool/.worktrees/redesign && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors (pre-existing Deno/supabase errors in `supabase/functions/` are acceptable).

- [ ] **Step 4: Commit**

```bash
git add src/components/v2/PostSessionMirror.tsx src/components/v2/FlowWorkspace.tsx
git commit -m "feat(mirror): extend StepResult with per-question data for modal"
```

---

### Task 2: Create StepDetailModal component

**Files:**
- Create: `src/components/v2/StepDetailModal.tsx`

Pure presentational component. No data fetching, no side effects. Manages its own `currentQ` state for pagination.

- [ ] **Step 1: Create `src/components/v2/StepDetailModal.tsx`**

```typescript
'use client'

import { useState } from 'react'
import type { StepResult, StepResultQuestion } from './PostSessionMirror'

const STEP_LABELS: Record<string, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

const STEP_TITLES: Record<string, string> = {
  frame: 'Identify the real problem',
  list: 'Map the solution space',
  optimize: 'Choose what to optimize for',
  win: 'Define what winning looks like',
}

type Verdict = 'pass' | 'partial' | 'miss'

function qualityToVerdict(quality: string): Verdict {
  if (quality === 'best') return 'pass'
  if (quality === 'good_but_incomplete' || quality === 'surface') return 'partial'
  return 'miss'
}

const VERDICT_LABEL: Record<Verdict, string> = {
  pass: 'CLEAN',
  partial: 'PARTIAL',
  miss: 'MISSED',
}

const VERDICT_COLORS: Record<Verdict, { text: string; bg: string }> = {
  pass: { text: '#2f7a4a', bg: 'rgba(47,122,74,0.10)' },
  partial: { text: '#c9933a', bg: 'rgba(201,147,58,0.10)' },
  miss: { text: '#b23a2a', bg: 'rgba(178,58,42,0.08)' },
}

const QUALITY_ORDER = ['best', 'good_but_incomplete', 'surface', 'plausible_wrong']

const QUALITY_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  best: { label: 'Best', color: '#2f7a4a', bg: '#c8e8d0' },
  good_but_incomplete: { label: 'Good', color: '#1e40af', bg: '#dbeafe' },
  surface: { label: 'Surface', color: '#92400e', bg: '#fef3c7' },
  plausible_wrong: { label: 'Misleading', color: '#991b1b', bg: '#fee2e2' },
}

interface QuestionPageProps {
  question: StepResultQuestion
  stepResult: StepResult
  isOnly: boolean
}

function QuestionPage({ question, stepResult }: QuestionPageProps) {
  const sorted = [...question.options].sort(
    (a, b) => QUALITY_ORDER.indexOf(a.quality) - QUALITY_ORDER.indexOf(b.quality)
  )

  const selectedOpt = question.options.find(
    o => o.id === question.selectedOptionId || o.option_label === question.selectedOptionId
  )
  const badge = QUALITY_BADGE[selectedOpt?.quality ?? 'plausible_wrong']

  // Framework hint: selected option's hint first, fall back to step signal
  const frameworkHint =
    selectedOpt?.framework_hint ??
    stepResult.competency_signal?.framework_hint ??
    stepResult.frameworkHint ??
    null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-on-surface)', margin: 0, lineHeight: 1.5 }}>
        {question.questionText}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map(opt => {
          const isPick = opt.id === question.selectedOptionId || opt.option_label === question.selectedOptionId
          const b = QUALITY_BADGE[opt.quality] ?? QUALITY_BADGE.plausible_wrong
          return (
            <div
              key={opt.id}
              style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '10px 12px',
                borderRadius: 10,
                border: `1.5px solid ${isPick ? 'var(--color-primary)' : 'var(--color-outline-faint)'}`,
                background: isPick ? 'rgba(74,124,89,0.06)' : 'var(--color-surface)',
                fontSize: 13, lineHeight: 1.4,
              }}
            >
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: 'var(--color-on-surface-variant)',
                minWidth: 18, flexShrink: 0, paddingTop: 1,
              }}>
                {opt.option_label}
              </span>
              <span style={{ flex: 1, color: 'var(--color-on-surface)' }}>
                {opt.option_text}
                {isPick && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', marginLeft: 6 }}>
                    ← your pick
                  </span>
                )}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700,
                padding: '2px 7px', borderRadius: 99,
                background: b.bg, color: b.color,
                flexShrink: 0, alignSelf: 'flex-start', marginTop: 1,
              }}>
                {b.label}
              </span>
            </div>
          )
        })}
      </div>

      {selectedOpt?.explanation && (
        <div style={{
          background: 'var(--color-surface-container-low)',
          borderRadius: 10, padding: '12px 14px',
          fontSize: 12, color: 'var(--color-on-surface-variant)', lineHeight: 1.6,
        }}>
          {selectedOpt.explanation}
        </div>
      )}

      {frameworkHint && (
        <div style={{
          background: 'rgba(112,92,48,0.07)',
          border: '1px dashed rgba(112,92,48,0.3)',
          borderRadius: 10, padding: '10px 14px',
          fontSize: 12, color: '#705c30', lineHeight: 1.5,
          display: 'flex', gap: 8,
        }}>
          <span style={{ flexShrink: 0 }}>🧠</span>
          <span>{frameworkHint}</span>
        </div>
      )}
    </div>
  )
}

export interface StepDetailModalProps {
  stepResult: StepResult
  onClose: () => void
}

export function StepDetailModal({ stepResult, onClose }: StepDetailModalProps) {
  const [currentQ, setCurrentQ] = useState(0)
  const questions = stepResult.questions ?? []
  const verdict = qualityToVerdict(stepResult.quality_label)
  const verdictStyle = VERDICT_COLORS[verdict]
  const isOnly = questions.length <= 1
  const isLast = currentQ === questions.length - 1

  if (questions.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 20,
        width: '100%', maxWidth: 600,
        maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px 14px',
          borderBottom: '1px solid var(--color-outline-faint)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'var(--color-primary)', background: 'var(--color-primary-fixed)',
            padding: '3px 10px', borderRadius: 99,
          }}>
            {STEP_LABELS[stepResult.step]}
          </span>
          <span style={{ flex: 1, fontFamily: 'var(--font-headline)', fontSize: 15, color: 'var(--color-on-surface)' }}>
            {STEP_TITLES[stepResult.step]}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.05em',
            padding: '3px 9px', borderRadius: 99,
            color: verdictStyle.text, background: verdictStyle.bg,
          }}>
            {VERDICT_LABEL[verdict]}
          </span>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--color-surface-container-high)',
              border: 'none', cursor: 'pointer',
              fontSize: 14, color: 'var(--color-on-surface-variant)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Question tab bar — hidden for single-question steps */}
        {!isOnly && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 24px',
            borderBottom: '1px solid var(--color-outline-faint)',
            background: 'var(--color-surface-container)',
          }}>
            <span style={{
              fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: 'var(--color-on-surface-variant)', marginRight: 4, fontWeight: 700,
            }}>
              Question:
            </span>
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                style={{
                  fontSize: 12, fontWeight: 600,
                  padding: '4px 12px', borderRadius: 99,
                  cursor: 'pointer',
                  color: currentQ === i ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
                  background: currentQ === i ? 'var(--color-surface)' : 'none',
                  border: currentQ === i ? '1px solid var(--color-outline-faint)' : '1px solid transparent',
                  boxShadow: currentQ === i ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.12s',
                }}
              >
                Q{i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <QuestionPage
            key={currentQ}
            question={questions[currentQ]}
            stepResult={stepResult}
            isOnly={isOnly}
          />
        </div>

        {/* Nav footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 24px 16px',
          borderTop: '1px solid var(--color-outline-faint)',
        }}>
          <button
            onClick={() => setCurrentQ(q => q - 1)}
            disabled={currentQ === 0}
            style={{
              fontSize: 13, fontWeight: 600,
              padding: '8px 18px', borderRadius: 99,
              border: '1.5px solid var(--color-outline-faint)',
              background: 'var(--color-surface)',
              color: 'var(--color-on-surface)',
              cursor: currentQ === 0 ? 'not-allowed' : 'pointer',
              opacity: currentQ === 0 ? 0.4 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            ← Previous
          </button>
          <button
            onClick={isLast ? onClose : () => setCurrentQ(q => q + 1)}
            style={{
              fontSize: 13, fontWeight: 600,
              padding: '8px 18px', borderRadius: 99,
              background: 'var(--color-primary)', color: '#fff',
              border: '1.5px solid var(--color-primary)',
              cursor: 'pointer',
            }}
          >
            {isLast ? 'Close' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/sandeep/Projects/myproductschool/.worktrees/redesign && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/v2/StepDetailModal.tsx
git commit -m "feat(mirror): add StepDetailModal — paginated question view with sorted options"
```

---

### Task 3: Rewrite StepCard in PostSessionMirror

**Files:**
- Modify: `src/components/v2/PostSessionMirror.tsx` (lines 135–279 — the `StepCard` component and its props)

Replace the expand/collapse StepCard with a compact summary card: choice chips, 2-line Hatch excerpt, competency tag, "Full detail" link. Clicking opens `StepDetailModal`.

- [ ] **Step 1: Add modal state and import to PostSessionMirror**

At the top of `src/components/v2/PostSessionMirror.tsx`, add the import:

```typescript
import { StepDetailModal } from './StepDetailModal'
```

In the `PostSessionMirror` main component (around line 337), add state for which step's modal is open:

```typescript
const [modalStep, setModalStep] = useState<StepResult | null>(null)
```

Add this import to the existing `import { useRef, useEffect, useState } from 'react'` line (it's already there).

- [ ] **Step 2: Add choice chip helper function**

Add this helper function above the `StepCard` component definition (before line 135):

```typescript
function buildChoiceChips(result: StepResult): string[] {
  const questions = result.questions ?? []
  const multi = questions.length > 1
  return questions.map((q, i) => {
    const selectedOpt = q.options.find(
      o => o.id === q.selectedOptionId || o.option_label === q.selectedOptionId
    )
    const letter = selectedOpt?.option_label ?? (q.selectedOptionId ?? '?')
    return multi ? `Q${i + 1} · Option ${letter}` : `Option ${letter}`
  })
}
```

- [ ] **Step 3: Rewrite StepCard component**

Replace the entire `StepCard` component (lines 135–279) with:

```typescript
interface StepCardProps {
  result: StepResult
  index: number
  cardRef: (el: HTMLDivElement | null) => void
  badgeRef: (el: HTMLDivElement | null) => void
  onOpenModal: (result: StepResult) => void
}

function StepCard({ result, index, cardRef, badgeRef, onOpenModal }: StepCardProps) {
  const verdict = qualityToVerdict(result.quality_label)
  const verdictColor = VERDICT_COLOR[verdict]
  const coaching = result.lumaSignal ?? result.competency_signal?.signal ?? result.reasoning
    ?? (verdict === 'pass' ? 'Strong reasoning on this move.' : verdict === 'partial' ? 'Partially on track — room to sharpen.' : 'The key move was missed here.')
  const competency = result.competency_signal?.primary
    ? formatCompetencyName(result.competency_signal.primary)
    : (STEP_COMPETENCY_KEYS[result.step]?.[0] ?? null)
  const chips = buildChoiceChips(result)

  return (
    <div
      ref={cardRef}
      onClick={() => onOpenModal(result)}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-outline-faint)',
        borderLeft: `3px solid ${verdictColor}`,
        borderRadius: 14,
        padding: '12px 12px 10px',
        display: 'flex', flexDirection: 'column', gap: 8,
        position: 'relative',
        boxShadow: '0 1px 2px rgba(30,27,20,0.04)',
        minWidth: 0,
        cursor: 'pointer',
        transition: 'box-shadow 200ms, border-color 200ms',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = `0 4px 16px -6px ${verdictColor}44`
        el.style.borderColor = verdictColor
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = '0 1px 2px rgba(30,27,20,0.04)'
        el.style.borderColor = 'var(--color-outline-faint)'
        el.style.borderLeftColor = verdictColor
      }}
    >
      {/* Diamond badge */}
      <div
        ref={badgeRef}
        style={{
          position: 'absolute', top: -14, left: 12,
          width: 30, height: 30,
          background: verdictColor,
          color: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: 12,
          transform: 'rotate(45deg)',
          borderRadius: 4,
          boxShadow: `0 6px 14px -4px ${verdictColor}`,
          zIndex: 3,
        }}
      >
        <span style={{ transform: 'rotate(-45deg)', display: 'inline-block' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Header: step pill + verdict */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginLeft: 32 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 10px', borderRadius: 999,
          background: VERDICT_BG[verdict],
          color: verdictColor,
          fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
            {STEP_ICONS[result.step]}
          </span>
          {STEP_LABELS[result.step]}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', color: verdictColor }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
            {VERDICT_ICON[verdict]}
          </span>
          {VERDICT_LABEL[verdict]}
        </div>
      </div>

      {/* Choice chips */}
      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {chips.map((chip, i) => (
            <span
              key={i}
              style={{
                fontSize: 10, fontWeight: 700,
                padding: '2px 8px', borderRadius: 99,
                background: 'var(--color-surface-container-high)',
                color: 'var(--color-on-surface-variant)',
                border: '1px solid var(--color-outline-faint)',
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {/* Hatch coaching — 2-line clamp */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0, marginTop: -2 }}>
          <HatchGlyph size={20} state={verdict === 'pass' ? 'celebrating' : verdict === 'partial' ? 'listening' : 'idle'} className="text-primary" />
        </div>
        <p style={{
          fontSize: 12, lineHeight: 1.5, color: 'var(--color-on-surface)', margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        } as React.CSSProperties}>
          {coaching}
        </p>
      </div>

      {/* Footer: competency tag + detail link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        {competency && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
            background: 'var(--color-primary-fixed)',
            color: 'var(--color-primary)',
          }}>
            {competency}
          </span>
        )}
        <span style={{
          fontSize: 11, fontWeight: 600, color: 'var(--color-primary)',
          display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: 'auto',
        }}>
          Full detail ›
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Wire onOpenModal and modal render in PostSessionMirror main component**

In the JSX of `PostSessionMirror`, change the `StepCard` usage from:

```tsx
<StepCard
  key={result.step}
  result={result}
  index={i}
  cardRef={el => { cardRefs.current[i] = el }}
  badgeRef={el => { badgeRefs.current[i] = el }}
/>
```

to:

```tsx
<StepCard
  key={result.step}
  result={result}
  index={i}
  cardRef={el => { cardRefs.current[i] = el }}
  badgeRef={el => { badgeRefs.current[i] = el }}
  onOpenModal={setModalStep}
/>
```

Then, just before the closing `</section>` tag at the bottom of `PostSessionMirror`, add:

```tsx
{modalStep && (
  <StepDetailModal
    stepResult={modalStep}
    onClose={() => setModalStep(null)}
  />
)}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/sandeep/Projects/myproductschool/.worktrees/redesign && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/v2/PostSessionMirror.tsx
git commit -m "feat(mirror): rewrite StepCard with choice chips, 2-line Hatch clamp, modal trigger"
```

---

### Task 4: Export StepDetailModal and update index

**Files:**
- Modify: `src/components/v2/index.ts`

- [ ] **Step 1: Add StepDetailModal export**

Open `src/components/v2/index.ts`. After the existing PostSessionMirror export lines, add:

```typescript
export { StepDetailModal } from './StepDetailModal'
export type { StepDetailModalProps } from './StepDetailModal'
```

Also add the new type export from PostSessionMirror. Find the line:
```typescript
export type { StepResult, CompetencyDelta as CompetencyDeltaType } from './PostSessionMirror'
```
Change it to:
```typescript
export type { StepResult, StepResultQuestion, CompetencyDelta as CompetencyDeltaType } from './PostSessionMirror'
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/sandeep/Projects/myproductschool/.worktrees/redesign && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/v2/index.ts
git commit -m "chore(mirror): export StepDetailModal and StepResultQuestion from v2 index"
```

---

### Task 5: Playwright verification

**Files:** No code changes — verification only.

- [ ] **Step 1: Start dev server**

```bash
cd /Users/sandeep/Projects/myproductschool/.worktrees/redesign && npm run dev &
sleep 5
```

- [ ] **Step 2: Navigate to a completed FLOW challenge and take a screenshot**

Use the Playwright MCP browser tools to:
1. Navigate to `http://localhost:3000`
2. Sign in if needed (credentials: `sandeeptnvs@gmail.com`)
3. Navigate to a FLOW challenge (any challenge in `/challenges/`)
4. Complete all 4 steps (or navigate directly to a past attempt if available)
5. Take a screenshot of the PostSessionMirror screen

Verify visually:
- No raw DB IDs visible anywhere on cards
- Choice chips show `Option B` or `Q1 · Option B` format
- Hatch coaching text is clamped to 2 lines
- Each card has a competency tag and "Full detail ›" link

- [ ] **Step 3: Open a step card modal and screenshot**

Click on one of the step cards. Verify:
- Modal opens with header (step badge, title, verdict, close button)
- If step has >1 question: tab bar shows Q1, Q2, etc.
- Options sorted Best → Good → Surface → Misleading
- User's pick highlighted with `← your pick` label
- Explanation box below options
- Framework hint box (if available)
- Prev disabled on Q1, Next becomes "Close" on last question

Take a screenshot.

- [ ] **Step 4: Final TypeScript check**

```bash
cd /Users/sandeep/Projects/myproductschool/.worktrees/redesign && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

---

## Self-Review

**Spec coverage:**
- ✅ Raw ID removal → Task 1 (selectedOptionId → option letter via option_label) + Task 3 (chips from buildChoiceChips)
- ✅ Multi-question disambiguation → buildChoiceChips uses `Q{n} · Option {letter}` when >1 question
- ✅ Hatch 2-line clamp → Task 3 StepCard sets `-webkit-line-clamp: 2`
- ✅ Score strip → already exists in PostSessionMirror, not regressed
- ✅ Modal: header, tab bar, paginated questions, sorted options, pick highlight, explanation, framework hint → Task 2
- ✅ Prev/Next nav, Close on last → Task 2
- ✅ Modal hidden for single-question steps' tab bar → `!isOnly` in StepDetailModal
- ✅ Data flow: questions carried into StepResult via FlowWorkspace → Task 1

**Placeholder scan:** No TBDs or vague steps. All code is complete.

**Type consistency:**
- `StepResultQuestion` defined in Task 1, used in Task 2 (`StepDetailModal`) and Task 3 (`buildChoiceChips`)
- `StepDetailModalProps` uses `StepResult` from PostSessionMirror — same file, consistent
- `onOpenModal: (result: StepResult) => void` in Task 3 → wired to `setModalStep` which is `Dispatch<SetStateAction<StepResult | null>>` — compatible
- `buildChoiceChips` reads `result.questions` (optional, added in Task 1) — safe with `?? []`
