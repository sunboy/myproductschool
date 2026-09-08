# UI Density Pass 03: Onboarding as a full page (`/welcome`)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Requires plans 01 and 02. Read `2026-09-07-ui-density-pass-00-master.md` for conventions.

**Goal:** Replace the 12-screen onboarding modal with a five-step full-page split layout at `/welcome` (left gradient panel with Hatch and the question, right form), reusing every existing onboarding API, with shorter gut-call FLOW scenarios, refresh-safe resume, and a "Skip for now" path.

**Architecture:** New route group `src/app/(welcome)/welcome/page.tsx` (no app shell). A `WelcomeFlow` client component drives steps 1-5 and persists after each step to `PUT /api/onboarding/state` (same table the modal uses, `step: '/calibration'`, data shape `CalibrationStateData`). Scoring and completion call the existing `POST /api/onboarding/calibration/submit`, `/api/onboarding/profile`, `/api/onboarding/complete` and `/api/onboarding/quick-start` (skip). The legacy modal stays for Settings "Redo" until sign-off.

**Tech Stack:** Next.js App Router, React 19, existing onboarding APIs and `src/lib/calibration/questions.ts`.

---

## File structure

Create:
- `src/lib/calibration/gut-calls.ts` (+ `tests/lib/calibration/gut-calls.test.ts`) — short scenario headline and four short options per move, mapped to the existing option ids so scoring is unchanged
- `src/app/(welcome)/layout.tsx`, `src/app/(welcome)/welcome/page.tsx`
- `src/components/onboarding/welcome/WelcomeFlow.tsx`
- `src/components/onboarding/welcome/WelcomePanel.tsx`
- `src/components/onboarding/welcome/steps/RoleStep.tsx`, `GoalStep.tsx`, `ScenarioStep.tsx`, `ResultsStep.tsx`
- `src/components/onboarding/welcome/useWelcomeState.ts` (+ `tests/lib/onboarding/welcome-state.test.ts`)
- `e2e/density/onboarding.spec.ts`

Modify:
- `src/lib/routes/public.ts` (nothing; `/welcome` is authenticated) and `src/proxy.ts` (no change needed: authenticated routes pass)
- `src/app/(app)/dashboard/page.tsx` (redirect new users to `/welcome` when density is on and no onboarding state says "skipped"; see Task 5)
- `src/app/(app)/settings/page.tsx` (Redo calibration → `/welcome?redo=1` when density on)

---

### Task 1: Gut-call copy for the four scenarios

**Files:**
- Create: `src/lib/calibration/gut-calls.ts`
- Test: `tests/lib/calibration/gut-calls.test.ts`

The scoring API expects `answers: Record<move, optionId>` where option ids are the ones in `QUESTIONS[i].options[j].id` (`src/lib/calibration/questions.ts`). This module only re-phrases; it maps each short option to the existing option id by index.

- [ ] **Step 1: Failing test**

```ts
// tests/lib/calibration/gut-calls.test.ts
import { describe, it, expect } from 'vitest'
import { GUT_CALLS } from '@/lib/calibration/gut-calls'
import { QUESTIONS } from '@/lib/calibration/questions'

describe('gut-calls', () => {
  it('covers all four moves with four options each, mapped to real option ids', () => {
    expect(GUT_CALLS.map(g => g.move)).toEqual(QUESTIONS.map(q => q.move))
    GUT_CALLS.forEach((g, i) => {
      expect(g.options).toHaveLength(4)
      g.options.forEach(o => expect(QUESTIONS[i].options.map(x => x.id)).toContain(o.optionId))
      expect(g.headline.length).toBeLessThan(200)
      g.options.forEach(o => { expect(o.title.length).toBeLessThan(60); expect(o.reason.length).toBeLessThan(60) })
    })
  })
})
```

- [ ] **Step 2: Run** → FAIL. Then inspect `QUESTIONS` option ids: `grep -n "id:" src/lib/calibration/questions.ts | head -20` and use them below (the file uses `id: 'a' | 'b' | 'c' | 'd'` or similar; substitute the real values).

- [ ] **Step 3: Implement**

```ts
// src/lib/calibration/gut-calls.ts
import { QUESTIONS } from './questions'

export interface GutCall { move: string; headline: string; question: string; options: Array<{ optionId: string; icon: string; title: string; reason: string }> }

const idAt = (move: string, idx: number) => { const q = QUESTIONS.find(x => x.move === move)!; return q.options[idx].id }

export const GUT_CALLS: GutCall[] = [
  { move: 'frame', headline: 'A B2B SaaS product just lost 30% of weekly active users.', question: 'First move?', options: [
    { optionId: idAt('frame', 0), icon: 'search', title: 'Find who left and why before touching anything.', reason: 'Segment the drop, then decide.' },
    { optionId: idAt('frame', 1), icon: 'chat', title: 'Ask the loudest customers what broke.', reason: 'Fast signal, but biased.' },
    { optionId: idAt('frame', 2), icon: 'bolt', title: 'Ship a re-engagement campaign now.', reason: 'Move first, learn later.' },
    { optionId: idAt('frame', 3), icon: 'refresh', title: 'Roll back the last release.', reason: 'Assumes the release did it.' },
  ] },
  { move: 'list', headline: 'Logging a purchase in a finance app takes five taps.', question: 'What goes on the table?', options: [
    { optionId: idAt('list', 0), icon: 'layers', title: 'Three structurally different fixes, not three tweaks.', reason: 'Automation, defaults, and skipping the form.' },
    { optionId: idAt('list', 1), icon: 'sliders', title: 'Trim the form to three taps.', reason: 'One good option, not a set.' },
    { optionId: idAt('list', 2), icon: 'palette', title: 'Redesign the screen to feel lighter.', reason: 'Prettier, same taps.' },
    { optionId: idAt('list', 3), icon: 'x', title: 'Remove logging; import bank data instead.', reason: 'Big bet, skips the question.' },
  ] },
  { move: 'optimize', headline: 'Two checkout variants. A cuts abandonment 18% but adds 40 seconds. B is 25 seconds faster, no change in abandonment.', question: 'Which ships?', options: [
    { optionId: idAt('optimize', 0), icon: 'target', title: 'Whichever wins on revenue per visitor.', reason: 'Name the metric, then pick.' },
    { optionId: idAt('optimize', 1), icon: 'cart', title: 'A. Fewer abandoned carts is money.', reason: 'The 40 seconds only hits people who finish.' },
    { optionId: idAt('optimize', 2), icon: 'zap', title: 'B. Faster feels better.', reason: 'Speed is the experience.' },
    { optionId: idAt('optimize', 3), icon: 'flask', title: 'Neither. Build a C that does both.', reason: 'Test again before deciding.' },
  ] },
  { move: 'win', headline: 'You are deprecating a legacy export that 12% of users still touch.', question: 'How does the team land it?', options: [
    { optionId: idAt('win', 0), icon: 'flag', title: 'Name the metric and the date it must hold.', reason: 'A falsifiable call, owned.' },
    { optionId: idAt('win', 1), icon: 'users', title: 'Offer a migration path and a long sunset.', reason: 'Kind, but no success test.' },
    { optionId: idAt('win', 2), icon: 'megaphone', title: 'Announce it and absorb the complaints.', reason: 'Decisive, blind.' },
    { optionId: idAt('win', 3), icon: 'pause', title: 'Keep it until usage hits zero.', reason: 'Never ships.' },
  ] },
]
```

The `optimize` copy is the one approved on the final review page; keep it verbatim. The other three follow the same shape; they must keep the quality order of the original options (A best, B good but incomplete, C surface, D plausible-wrong; for `win`, C is plausible-wrong and D is surface per the code map, so swap the last two `optionId` indexes for `win` to `idAt('win', 3)` then `idAt('win', 2)` and keep the copy order shown above).

- [ ] **Step 4: Run test** → PASS. Commit:

```bash
git add src/lib/calibration/gut-calls.ts tests/lib/calibration/gut-calls.test.ts
git commit -m "feat(density): short gut-call copy for calibration scenarios"
```

---

### Task 2: Welcome state hook

**Files:**
- Create: `src/components/onboarding/welcome/useWelcomeState.ts`
- Test: `tests/lib/onboarding/welcome-state.test.ts`

- [ ] **Step 1: Failing test for the pure reducer**

```ts
// tests/lib/onboarding/welcome-state.test.ts
import { describe, it, expect } from 'vitest'
import { welcomeReducer, initialWelcomeState, stepIndexFor, STEP_ORDER } from '@/components/onboarding/welcome/useWelcomeState'

describe('welcome state', () => {
  it('walks the five steps in order', () => {
    expect(STEP_ORDER).toEqual(['role', 'goal', 'q0', 'q1', 'q2', 'q3', 'results'])
    let s = initialWelcomeState
    s = welcomeReducer(s, { type: 'setRole', role: 'swe' })
    s = welcomeReducer(s, { type: 'toggleAlsoRole', role: 'tech_lead' })
    s = welcomeReducer(s, { type: 'next' })
    expect(s.step).toBe('goal'); expect(s.alsoRoles).toEqual(['tech_lead'])
  })
  it('maps steps to dots 1..5', () => {
    expect(stepIndexFor('role')).toBe(1); expect(stepIndexFor('goal')).toBe(2); expect(stepIndexFor('q0')).toBe(3); expect(stepIndexFor('q3')).toBe(4); expect(stepIndexFor('results')).toBe(5)
  })
  it('blocks next until required answers exist', () => {
    const s = welcomeReducer({ ...initialWelcomeState, step: 'goal' }, { type: 'next' })
    expect(s.step).toBe('goal')
  })
})
```

- [ ] **Step 2: Implement**

```ts
// src/components/onboarding/welcome/useWelcomeState.ts
'use client'
import { useCallback, useEffect, useReducer, useRef } from 'react'
import { getOnboardingState, saveOnboardingState } from '@/lib/onboarding/state-client'

export type WelcomeStep = 'role' | 'goal' | 'q0' | 'q1' | 'q2' | 'q3' | 'results'
export const STEP_ORDER: WelcomeStep[] = ['role', 'goal', 'q0', 'q1', 'q2', 'q3', 'results']
export function stepIndexFor(step: WelcomeStep) { return step === 'role' ? 1 : step === 'goal' ? 2 : step === 'q0' || step === 'q1' ? 3 : step === 'q2' || step === 'q3' ? 4 : 5 }

export interface WelcomeState {
  step: WelcomeStep
  role: string | null
  alsoRoles: string[]
  goal: string | null
  timeline: string | null
  context: string | null
  targetCompany: string
  answers: Record<string, string>
}
export const initialWelcomeState: WelcomeState = { step: 'role', role: null, alsoRoles: [], goal: null, timeline: null, context: null, targetCompany: '', answers: {} }

export type WelcomeAction =
  | { type: 'hydrate'; state: Partial<WelcomeState> }
  | { type: 'setRole'; role: string } | { type: 'toggleAlsoRole'; role: string }
  | { type: 'setGoal'; goal: string } | { type: 'setTimeline'; timeline: string } | { type: 'setContext'; context: string } | { type: 'setCompany'; company: string }
  | { type: 'answer'; move: string; optionId: string }
  | { type: 'next' } | { type: 'back' } | { type: 'goto'; step: WelcomeStep }

function canAdvance(s: WelcomeState): boolean {
  switch (s.step) {
    case 'role': return !!s.role
    case 'goal': return !!s.goal && !!s.timeline && !!s.context
    case 'q0': return !!s.answers.frame
    case 'q1': return !!s.answers.list
    case 'q2': return !!s.answers.optimize
    case 'q3': return !!s.answers.win
    default: return false
  }
}

export function welcomeReducer(s: WelcomeState, a: WelcomeAction): WelcomeState {
  switch (a.type) {
    case 'hydrate': return { ...s, ...a.state }
    case 'setRole': return { ...s, role: a.role, alsoRoles: s.alsoRoles.filter(r => r !== a.role) }
    case 'toggleAlsoRole': return { ...s, alsoRoles: s.alsoRoles.includes(a.role) ? s.alsoRoles.filter(r => r !== a.role) : [...s.alsoRoles, a.role].slice(0, 2) }
    case 'setGoal': return { ...s, goal: a.goal }
    case 'setTimeline': return { ...s, timeline: a.timeline }
    case 'setContext': return { ...s, context: a.context }
    case 'setCompany': return { ...s, targetCompany: a.company }
    case 'answer': return { ...s, answers: { ...s.answers, [a.move]: a.optionId } }
    case 'next': { if (!canAdvance(s)) return s; const i = STEP_ORDER.indexOf(s.step); return { ...s, step: STEP_ORDER[Math.min(i + 1, STEP_ORDER.length - 1)] } }
    case 'back': { const i = STEP_ORDER.indexOf(s.step); return { ...s, step: STEP_ORDER[Math.max(i - 1, 0)] } }
    case 'goto': return { ...s, step: a.step }
  }
}

/** Persists to /api/onboarding/state under step '/calibration' using the modal's CalibrationStateData shape, so both surfaces can resume each other. */
export function useWelcomeState() {
  const [state, dispatch] = useReducer(welcomeReducer, initialWelcomeState)
  const loaded = useRef(false)
  useEffect(() => {
    getOnboardingState<Record<string, unknown>>().then(saved => {
      loaded.current = true
      const d = saved?.data ?? {}
      const answers = (d.answers as Record<string, string>) ?? {}
      const screen = String(d.screen ?? '')
      const step: WelcomeStep = screen.startsWith('q') && STEP_ORDER.includes(screen as WelcomeStep) ? (screen as WelcomeStep) : d.selectedRole ? (d.primaryGoal && d.prepTimeline && d.roleContext ? 'q0' : 'goal') : 'role'
      dispatch({ type: 'hydrate', state: { role: (d.selectedRole as string) ?? null, goal: (d.primaryGoal as string) ?? null, timeline: (d.prepTimeline as string) ?? null, context: (d.roleContext as string) ?? null, targetCompany: (d.targetCompany as string) ?? '', answers, alsoRoles: (d.alsoRoles as string[]) ?? [], step: Object.keys(answers).length === 4 ? 'q3' : step } })
    }).catch(() => { loaded.current = true })
  }, [])
  const persist = useCallback((s: WelcomeState) => {
    if (!loaded.current || s.step === 'results') return
    void saveOnboardingState('/calibration', { screen: s.step, selectedRole: s.role, roleContext: s.context, primaryGoal: s.goal, prepTimeline: s.timeline, targetCompany: s.targetCompany, answers: s.answers, alsoRoles: s.alsoRoles })
  }, [])
  return { state, dispatch, persist, canAdvance: canAdvance(state) }
}
```

Verify the `OnboardingStep` union in `src/lib/onboarding/state` includes `'/calibration'` (the modal uses it: `CalibrationFlow.tsx` L394 `state?.step !== '/calibration'`).

- [ ] **Step 3: Run test** → PASS. Commit:

```bash
git add src/components/onboarding/welcome/useWelcomeState.ts tests/lib/onboarding/welcome-state.test.ts
git commit -m "feat(density): welcome flow state with resumable persistence"
```

---

### Task 3: Panel, steps and flow

**Files:**
- Create: `WelcomePanel.tsx`, `steps/RoleStep.tsx`, `steps/GoalStep.tsx`, `steps/ScenarioStep.tsx`, `steps/ResultsStep.tsx`, `WelcomeFlow.tsx` under `src/components/onboarding/welcome/`

Reuse: `ROLES` (export from `src/components/onboarding/QuickRoleSelect.tsx` L13-24 by adding `export`), `CONTEXT_OPTIONS`, `GOAL_OPTIONS`, `TIMELINE_OPTIONS`, `FLOW_MOVES`, `SCREEN_PANEL_COPY` (export them from `CalibrationFlow.tsx` L73-100 and `OnboardingModal.tsx` L37; add `export` keywords), `HatchImage` poses (`wave`, `listening`, `thinking`, `writing`, `reviewing`, `celebrating` per `screenToPose`), `deriveArchetype` output via the submit route.

- [ ] **Step 1: `WelcomePanel`** (left 44%)

```tsx
// src/components/onboarding/welcome/WelcomePanel.tsx
import { HatchImage, type HatchImageState } from '@/components/redesign/HatchImage'
export function WelcomePanel({ pose, headline, accent, body }: { pose: HatchImageState; headline: string; accent: string; body: string }) {
  return (
    <aside data-testid="welcome-panel" className="relative flex flex-col overflow-hidden px-8 py-8 lg:px-14 lg:py-12" style={{ background: 'linear-gradient(160deg, var(--color-primary-fixed) 0%, var(--color-surface-container-low) 55%, var(--color-amber-soft) 100%)' }}>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <i className="absolute block rounded-[60px] bg-primary-fixed" style={{ right: -120, top: -120, width: 380, height: 380, transform: 'rotate(45deg)', opacity: .6 }} />
        <i className="absolute block rounded-full" style={{ left: -80, bottom: -140, width: 320, height: 320, border: '40px solid var(--color-amber-soft)', opacity: .6 }} />
        <i className="absolute block bg-forest-800" style={{ right: 60, bottom: 120, width: 120, height: 120, clipPath: 'polygon(50% 0,100% 100%,0 100%)', opacity: .08 }} />
      </div>
      <div className="relative font-headline text-[15px] font-bold tracking-[.04em] text-primary">HACKPRODUCT</div>
      <div className="relative flex flex-1 flex-col justify-center gap-4">
        <div className="flex items-center gap-3"><div className="grid size-14 place-items-center rounded-full bg-forest-800 shadow-lg"><HatchImage state={pose} size={40} /></div><div><div className="font-headline text-[18px] font-bold">Hatch <span className="ml-1 inline-block size-2 rounded-full bg-primary align-middle" /></div><div className="text-[12px] text-ink-secondary">Your HackProduct coach</div></div></div>
        <h1 className="max-w-[480px] font-headline text-[32px] font-medium leading-[1.08] lg:text-[40px]">{headline} <b className="font-bold">{accent}</b></h1>
        <p className="max-w-[440px] text-[15px] leading-[1.5] text-on-surface-variant">{body}</p>
      </div>
      <div className="relative text-[11px] text-ink-secondary">About 5 minutes. Reset anytime from Settings.</div>
    </aside>
  )
}
```

- [ ] **Step 2: `RoleStep`**

```tsx
// src/components/onboarding/welcome/steps/RoleStep.tsx
'use client'
import { ROLES } from '@/components/onboarding/QuickRoleSelect'
export function RoleStep({ role, alsoRoles, onRole, onToggleAlso }: { role: string | null; alsoRoles: string[]; onRole: (r: string) => void; onToggleAlso: (r: string) => void }) {
  const chip = (active: boolean) => `rounded-full border px-4 py-2.5 text-[14px] font-semibold ${active ? 'border-forest-800 bg-forest-800 text-white' : 'border-hairline bg-card-bright text-ink-strong hover:bg-surface-container'}`
  return (
    <div className="flex flex-col gap-6">
      <div><div className="mb-2.5 text-[13px] font-bold"><span className="text-error">*</span> Primary role</div>
        <div className="flex flex-wrap gap-2">{ROLES.map(r => <button key={r.id} type="button" data-testid={`role-${r.id}`} aria-pressed={role === r.id} onClick={() => onRole(r.id)} className={chip(role === r.id)}>{r.label}</button>)}</div></div>
      <div><div className="mb-2.5 text-[13px] font-bold">Also preparing for <span className="font-normal text-ink-secondary">(optional, up to two)</span></div>
        <div className="flex flex-wrap gap-2">{ROLES.filter(r => r.id !== role).map(r => <button key={r.id} type="button" data-testid={`also-${r.id}`} aria-pressed={alsoRoles.includes(r.id)} onClick={() => onToggleAlso(r.id)} className={chip(alsoRoles.includes(r.id))}>{r.label}{alsoRoles.includes(r.id) ? ' ✕' : ''}</button>)}</div></div>
    </div>
  )
}
```

- [ ] **Step 3: `GoalStep`**

```tsx
// src/components/onboarding/welcome/steps/GoalStep.tsx
'use client'
import { GOAL_OPTIONS, TIMELINE_OPTIONS, CONTEXT_OPTIONS } from '@/components/onboarding/CalibrationFlow'
export function GoalStep({ goal, timeline, context, company, onGoal, onTimeline, onContext, onCompany }: { goal: string | null; timeline: string | null; context: string | null; company: string; onGoal: (v: string) => void; onTimeline: (v: string) => void; onContext: (v: string) => void; onCompany: (v: string) => void }) {
  const chip = (active: boolean) => `rounded-full border px-4 py-2.5 text-[14px] font-semibold ${active ? 'border-forest-800 bg-forest-800 text-white' : 'border-hairline bg-card-bright hover:bg-surface-container'}`
  const reveal = TIMELINE_OPTIONS.find(t => t.id === timeline)?.revealCompany
  return (
    <div className="flex flex-col gap-6">
      <div><div className="mb-2.5 text-[13px] font-bold"><span className="text-error">*</span> What does winning look like in the next few months?</div>
        <div className="grid gap-2.5 sm:grid-cols-2">{GOAL_OPTIONS.map(g => <button key={g.id} type="button" data-testid={`goal-${g.id}`} aria-pressed={goal === g.id} onClick={() => onGoal(g.id)} className={`flex items-center gap-2.5 rounded-xl border px-4 py-3.5 text-left text-[14px] ${goal === g.id ? 'border-forest-800 bg-primary-fixed' : 'border-hairline bg-card-bright'}`}><i className={`block size-[18px] rounded-full border-2 ${goal === g.id ? 'border-forest-800 bg-forest-800' : 'border-outline-variant'}`} />{g.label}</button>)}</div></div>
      <div><div className="mb-2.5 text-[13px] font-bold"><span className="text-error">*</span> Timeline</div><div className="flex flex-wrap gap-2">{TIMELINE_OPTIONS.map(t => <button key={t.id} type="button" data-testid={`timeline-${t.id}`} aria-pressed={timeline === t.id} onClick={() => onTimeline(t.id)} className={chip(timeline === t.id)}>{t.label}</button>)}</div>
        {reveal && <input data-testid="target-company" value={company} onChange={e => onCompany(e.target.value)} placeholder="Target company (optional)" className="mt-2.5 w-full max-w-[360px] rounded-lg border border-hairline bg-card-bright px-3 py-2 text-[14px]" />}</div>
      <div><div className="mb-2.5 text-[13px] font-bold"><span className="text-error">*</span> Context</div><div className="flex flex-wrap gap-2">{CONTEXT_OPTIONS.map(c => <button key={c.id} type="button" data-testid={`context-${c.id}`} aria-pressed={context === c.id} onClick={() => onContext(c.id)} className={chip(context === c.id)}>{c.label}</button>)}</div></div>
    </div>
  )
}
```

- [ ] **Step 4: `ScenarioStep`**

```tsx
// src/components/onboarding/welcome/steps/ScenarioStep.tsx
'use client'
import { GUT_CALLS } from '@/lib/calibration/gut-calls'
import { Search, MessageSquare, Zap, RotateCcw, Layers, SlidersHorizontal, Palette, X, Target, ShoppingCart, FlaskConical, Flag, Users, Megaphone, Pause } from 'lucide-react'
const ICONS: Record<string, React.ComponentType<{ size?: number }>> = { search: Search, chat: MessageSquare, bolt: Zap, refresh: RotateCcw, layers: Layers, sliders: SlidersHorizontal, palette: Palette, x: X, target: Target, cart: ShoppingCart, zap: Zap, flask: FlaskConical, flag: Flag, users: Users, megaphone: Megaphone, pause: Pause }
const MOVES = ['frame', 'list', 'optimize', 'win']

export function ScenarioStep({ index, answers, onAnswer }: { index: number; answers: Record<string, string>; onAnswer: (move: string, optionId: string) => void }) {
  const g = GUT_CALLS[index]
  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1.5 text-[11px] font-bold">{MOVES.map((m, i) => <span key={m} className={`rounded-full border px-2.5 py-0.5 ${i < index ? 'border-forest-800 bg-forest-800 text-white' : i === index ? 'border-forest-800 text-forest-800' : 'border-hairline text-ink-muted'}`}>{m.charAt(0).toUpperCase() + m.slice(1)}{i < index ? ' ✓' : ''}</span>)}</div>
      <h2 className="font-headline text-[26px] font-bold leading-[1.15]">{g.headline} <em className="font-medium not-italic text-tertiary">{g.question}</em></h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {g.options.map(o => { const Icon = ICONS[o.icon] ?? Target; const on = answers[g.move] === o.optionId; return (
          <button key={o.optionId} type="button" data-testid={`option-${g.move}-${o.optionId}`} aria-pressed={on} onClick={() => onAnswer(g.move, o.optionId)} className={`flex items-center gap-3 rounded-xl border px-4 py-4 text-left ${on ? 'border-forest-800 bg-primary-fixed' : 'border-hairline bg-card-bright hover:bg-surface-container'}`}>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-container text-forest-800"><Icon size={18} /></span>
            <span><b className="block text-[15px] leading-tight">{o.title}</b><span className="text-[12px] text-ink-secondary">{o.reason}</span></span>
          </button>
        )})}
      </div>
      <p className="text-[12px] text-ink-secondary">Pick your gut call. Hatch reads the instinct, not the wording.</p>
    </div>
  )
}
```

- [ ] **Step 5: `ResultsStep`**

```tsx
// src/components/onboarding/welcome/steps/ResultsStep.tsx
'use client'
import Link from 'next/link'
import { FLOW_MOVES } from '@/components/onboarding/CalibrationFlow'
export interface CalibrationResults { archetype: string | null; hatch_observation: string | null; scores: Record<string, number>; starting_levels: Record<string, number>; personalised_plan_slug: string | null }
export function ResultsStep({ results, onStart, onPlan }: { results: CalibrationResults; onStart: () => void; onPlan: () => void }) {
  const tint: Record<string, string> = { frame: 'bg-primary-fixed text-forest-800', list: 'bg-[#e6eef8] text-[#2f5fa8]', optimize: 'bg-[#f7e6f0] text-[#9b2f6e]', win: 'bg-amber-soft text-tertiary' }
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5">{results.archetype && <span className="rounded-full bg-forest-800 px-3 py-1 text-[12px] font-bold text-white">{results.archetype}</span>}<span className="text-[12px] text-ink-secondary">Your starting profile</span></div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">{FLOW_MOVES.map(m => <div key={m.key} data-testid={`score-${m.key}`} className={`rounded-xl p-3.5 text-center ${tint[m.key]}`}><div className="text-[11px] font-bold text-ink-secondary">{m.label}</div><div className="font-headline text-[30px] font-bold">{results.scores[m.key] ?? 0}</div><span className="rounded-full border border-hairline bg-card-bright px-2 py-0.5 text-[10px] text-ink-strong">Lv {results.starting_levels[m.key] ?? 1}</span></div>)}</div>
      {results.hatch_observation && <div className="rounded-xl bg-surface-container px-4 py-3.5 text-[13px] leading-[1.5]"><b>Hatch:</b> {results.hatch_observation}</div>}
      <div className="grid gap-2.5 sm:grid-cols-2">
        <button type="button" data-testid="results-start" onClick={onStart} className="rounded-full bg-forest-800 px-4 py-3 text-[14px] font-bold text-white">Start my first challenge →</button>
        {results.personalised_plan_slug ? <button type="button" data-testid="results-plan" onClick={onPlan} className="rounded-full border border-hairline bg-card-bright px-4 py-3 text-[14px] font-bold">See my study plan</button> : <Link href="/explore/plans" className="rounded-full border border-hairline bg-card-bright px-4 py-3 text-center text-[14px] font-bold">Browse study plans</Link>}
      </div>
    </div>
  )
}
```

Check the exact keys of `FLOW_MOVES` items in `CalibrationFlow.tsx` L93-98 (`key`/`label` or `id`/`name`) and adjust.

- [ ] **Step 6: `WelcomeFlow`**

```tsx
// src/components/onboarding/welcome/WelcomeFlow.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { WelcomePanel } from './WelcomePanel'
import { RoleStep } from './steps/RoleStep'
import { GoalStep } from './steps/GoalStep'
import { ScenarioStep } from './steps/ScenarioStep'
import { ResultsStep, type CalibrationResults } from './steps/ResultsStep'
import { useWelcomeState, stepIndexFor, type WelcomeStep } from './useWelcomeState'
import { clearOnboardingState } from '@/lib/onboarding/state-client'
import { trackEvent, EVENT_ONBOARDING_STEP } from '@/lib/analytics/events'
import { FIRST_REP_FALLBACK_HREF } from '@/lib/onboarding/curated-first-rep'

const PANEL: Record<WelcomeStep, { pose: 'wave' | 'thinking' | 'writing' | 'reviewing' | 'celebrating'; headline: string; accent: string; body: string }> = {
  role: { pose: 'wave', headline: 'To get started,', accent: 'what do you do?', body: 'Role shapes which scenarios Hatch pulls. It reads your reasoning, not your title.' },
  goal: { pose: 'thinking', headline: 'What does', accent: 'winning look like?', body: 'Your goal sets which reps come first. Timeline sets the pace, not a deadline. Nothing here is locked in.' },
  q0: { pose: 'writing', headline: 'Now the', accent: 'fun part.', body: 'Four quick scenarios, one per FLOW move. Gut calls only. I am reading your instincts, not checking right answers.' },
  q1: { pose: 'writing', headline: 'Two down,', accent: 'two to go.', body: 'Same rule: pick what feels most like how you actually think.' },
  q2: { pose: 'writing', headline: 'Trade-offs', accent: 'next.', body: 'This one is about naming what you are optimizing for.' },
  q3: { pose: 'writing', headline: 'Last one:', accent: 'landing it.', body: 'How a decision gets made is half the decision.' },
  results: { pose: 'celebrating', headline: "Here's where", accent: "you're starting.", body: 'Your baseline is set. Every rep from here moves it.' },
}

export function WelcomeFlow({ redo = false }: { redo?: boolean }) {
  const router = useRouter()
  const { state, dispatch, persist, canAdvance } = useWelcomeState()
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<CalibrationResults | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { persist(state); trackEvent(EVENT_ONBOARDING_STEP, { step: `welcome:${state.step}`, step_index: stepIndexFor(state.step) }) }, [state.step]) // eslint-disable-line react-hooks/exhaustive-deps

  const submitProfile = () => fetch('/api/onboarding/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: state.role, role_context: state.context, primary_goal: state.goal, prep_timeline: state.timeline, target_company: state.targetCompany || null, interview_date: state.timeline === 'lt_1mo' ? new Date(Date.now() + 21 * 864e5).toISOString().slice(0, 10) : null }) }).catch(() => {})

  const next = async () => {
    if (!canAdvance) return
    if (state.step === 'goal') void submitProfile()
    if (state.step === 'q3') {
      setSubmitting(true); setError(null)
      try {
        const res = await fetch('/api/onboarding/calibration/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: state.answers, role: state.role, primary_goal: state.goal, prep_timeline: state.timeline, role_context: state.context, target_company: state.targetCompany || null }) })
        if (!res.ok) throw new Error(`submit ${res.status}`)
        setResults(await res.json())
        dispatch({ type: 'next' })
      } catch (e) { setError('Scoring took too long. Try again.'); console.error(e) } finally { setSubmitting(false) }
      return
    }
    dispatch({ type: 'next' })
  }

  const complete = async (path: 'challenge' | 'plan') => {
    await fetch('/api/onboarding/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role_context: state.context ?? undefined }) })
    await clearOnboardingState()
    window.dispatchEvent(new CustomEvent('profile-stats-updated', { detail: { source: 'welcome' } }))
    router.push(path === 'plan' && results?.personalised_plan_slug ? `/explore/plans/${results.personalised_plan_slug}` : '/challenges')
  }

  const skip = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/onboarding/quick-start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: state.role ?? 'swe' }) })
      const body = res.ok ? await res.json() : {}
      window.dispatchEvent(new CustomEvent('profile-stats-updated', { detail: { source: 'welcome-skip' } }))
      router.push(body.challenge_href ?? FIRST_REP_FALLBACK_HREF)
    } finally { setSubmitting(false) }
  }

  const p = PANEL[state.step]
  const dots = [1, 2, 3, 4, 5]; const cur = stepIndexFor(state.step)
  return (
    <div data-testid="welcome" className="grid min-h-screen bg-background lg:grid-cols-[44%_56%]">
      <WelcomePanel pose={p.pose} headline={p.headline} accent={p.accent} body={p.body} />
      <section className="flex flex-col px-6 py-6 lg:px-[72px] lg:py-10">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5" aria-label={`Step ${cur} of 5`}>{dots.map(d => <i key={d} className="block h-2 rounded-full" style={{ width: d === cur ? 22 : 8, background: d <= cur ? 'var(--color-forest-800)' : 'var(--color-surface-container-highest)' }} />)}</div>
          {state.step !== 'results' && <button type="button" data-testid="welcome-skip" onClick={skip} disabled={submitting} className="rounded-full border border-hairline bg-card-bright px-3 py-1 text-[12px] font-semibold">Skip for now</button>}
        </div>
        <div className="flex max-w-[640px] flex-1 flex-col justify-center py-6">
          {state.step === 'role' && <RoleStep role={state.role} alsoRoles={state.alsoRoles} onRole={r => dispatch({ type: 'setRole', role: r })} onToggleAlso={r => dispatch({ type: 'toggleAlsoRole', role: r })} />}
          {state.step === 'goal' && <GoalStep goal={state.goal} timeline={state.timeline} context={state.context} company={state.targetCompany} onGoal={v => dispatch({ type: 'setGoal', goal: v })} onTimeline={v => dispatch({ type: 'setTimeline', timeline: v })} onContext={v => dispatch({ type: 'setContext', context: v })} onCompany={v => dispatch({ type: 'setCompany', company: v })} />}
          {['q0','q1','q2','q3'].includes(state.step) && <ScenarioStep index={Number(state.step.slice(1))} answers={state.answers} onAnswer={(m, o) => dispatch({ type: 'answer', move: m, optionId: o })} />}
          {state.step === 'results' && results && <ResultsStep results={results} onStart={() => complete('challenge')} onPlan={() => complete('plan')} />}
          {error && <p role="alert" className="mt-3 text-[13px] text-error">{error}</p>}
        </div>
        {state.step !== 'results' && (
          <div className="flex items-center justify-between">
            <button type="button" data-testid="welcome-back" onClick={() => dispatch({ type: 'back' })} disabled={state.step === 'role'} className="rounded-full border border-hairline bg-card-bright px-3 py-1 text-[12px] font-semibold disabled:opacity-40">← Back</button>
            <button type="button" data-testid="welcome-next" onClick={next} disabled={!canAdvance || submitting} className="rounded-full bg-forest-800 px-7 py-3 text-[15px] font-bold text-white disabled:opacity-50">{submitting ? 'Scoring…' : 'Next →'}</button>
          </div>
        )}
        {redo && <Link href="/settings" className="mt-3 text-[12px] text-ink-secondary">Cancel and go back to Settings</Link>}
      </section>
    </div>
  )
}
```

`POST /api/onboarding/profile` validates `role`, `role_context`, `primary_goal`, `prep_timeline` as enums (`VALID_ROLES` etc. in that route) and `target_company`/`interview_date` as optional strings; send only ids from the option lists and omit nulls (`JSON.stringify` drops `undefined`, so use `?? undefined`). Confirm `trackEvent`/`EVENT_ONBOARDING_STEP` import path from `CalibrationFlow.tsx` L440-442 and mirror it.

- [ ] **Step 7: Typecheck, commit**

```bash
git add src/components/onboarding/welcome src/components/onboarding/QuickRoleSelect.tsx src/components/onboarding/CalibrationFlow.tsx src/components/onboarding/OnboardingModal.tsx
git commit -m "feat(density): WelcomeFlow split-screen onboarding"
```

**Wiring table:** role/goal/scenario chips → reducer + `PUT /api/onboarding/state`; Next on goal → `POST /api/onboarding/profile`; Next on q3 → `POST /api/onboarding/calibration/submit`; Start my first challenge / See my study plan → `POST /api/onboarding/complete` then navigate; Skip for now → `POST /api/onboarding/quick-start` then navigate to `challenge_href`; Back → reducer.

---

### Task 4: Route and layout

**Files:**
- Create: `src/app/(welcome)/layout.tsx`, `src/app/(welcome)/welcome/page.tsx`

- [ ] **Step 1: Layout and page**

```tsx
// src/app/(welcome)/layout.tsx
import type { ReactNode } from 'react'
export default function WelcomeLayout({ children }: { children: ReactNode }) { return <div className="min-h-screen bg-background font-body">{children}</div> }
```

```tsx
// src/app/(welcome)/welcome/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAppFlag } from '@/lib/config/app-flags'
import { WelcomeFlow } from '@/components/onboarding/welcome/WelcomeFlow'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Welcome to HackProduct' }

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ redo?: string }> }) {
  const { redo } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?returnTo=/welcome')
  const density = await getAppFlag('ui_density_v1', false)
  if (!density) redirect('/dashboard')
  const { data: profile } = await supabase.from('profiles').select('onboarding_completed_at').eq('id', user.id).maybeSingle()
  if (profile?.onboarding_completed_at && redo !== '1') redirect('/dashboard')
  return <WelcomeFlow redo={redo === '1'} />
}
```

- [ ] **Step 2: Verify**: signed in as the new test user with the flag on, `/welcome` renders step 1; signed in as the Pro user, `/welcome` redirects to `/dashboard` and `/welcome?redo=1` renders. Commit:

```bash
git add src/app/(welcome)
git commit -m "feat(density): /welcome route"
```

---

### Task 5: Entry points: dashboard redirect, Settings redo, calibration card

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx` (density branch from plan 02)
- Modify: `src/app/(app)/settings/page.tsx:130-138`

- [ ] **Step 1: Dashboard**: in the density branch, before computing `isNewUser`: if `!profile.onboarding_completed_at && !hasAnyAttempts && !cookies().get('hp-welcome-seen')` then `redirect('/welcome')`. Set the cookie in `WelcomeFlow` on mount via `document.cookie = 'hp-welcome-seen=1; path=/; max-age=2592000'` so a user who leaves `/welcome` is not bounced back forever; the calibration card on the dashboard remains the way back in. (Import `cookies` from `next/headers`.)

- [ ] **Step 2: Settings**: in `handleRedoCalibration` (L130-138), when `useUiShell().density` is true, replace `openModal('settings')` with `await clearOnboardingState(); router.push('/welcome?redo=1')`. Keep the modal path when the flag is off.

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/dashboard/page.tsx src/app/(app)/settings/page.tsx
git commit -m "feat(density): route new users and calibration redo to /welcome"
```

---

### Task 6: Onboarding E2E

**Files:**
- Create: `e2e/density/onboarding.spec.ts`

- [ ] **Step 1: Spec** (uses `createTestUser` from `e2e/helpers.ts` but with `onboarding_completed_at: null`; add an option `{ onboarded?: boolean }` to `createTestUser` that skips setting `onboarding_completed_at` when `false`).

```ts
import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestUser } from '../helpers'
import { VIEWPORTS, loginViaApi, expectNoConsoleErrors } from './helpers'

test.describe('/welcome', () => {
  let user: Awaited<ReturnType<typeof createTestUser>>
  test.beforeAll(async () => { user = await createTestUser({ onboarded: false }) })
  test.afterAll(async () => { await cleanupTestUser(user.id) })

  test('five steps, resume after refresh, results and completion', async ({ page }) => {
    await loginViaApi(page, user); await page.setViewportSize(VIEWPORTS.desktop)
    await expectNoConsoleErrors(page, async () => {
      await page.goto('/dashboard'); await expect(page).toHaveURL(/\/welcome/)
      await page.getByTestId('role-swe').click(); await page.getByTestId('also-tech_lead').click(); await page.getByTestId('welcome-next').click()
      await page.getByTestId('goal-level_up_current').click(); await page.getByTestId('timeline-1_3mo').click(); await page.getByTestId('target-company').fill('Stripe'); await page.getByTestId('context-both').click()
      await page.reload(); await expect(page.getByTestId('goal-level_up_current')).toHaveAttribute('aria-pressed', 'true') // resumed
      await page.getByTestId('welcome-next').click()
      for (const [move, idx] of [['frame', 0], ['list', 0], ['optimize', 0], ['win', 0]] as const) {
        const opt = page.locator(`[data-testid^="option-${move}-"]`).nth(idx); await opt.click(); await page.getByTestId('welcome-next').click()
      }
      await expect(page.getByTestId('score-frame')).toBeVisible({ timeout: 20_000 })
      await page.getByTestId('results-start').click(); await expect(page).toHaveURL(/\/challenges/)
    })
    const prof = await page.request.get('/api/profile').then(r => r.json()); expect(prof.onboarding_completed_at).toBeTruthy()
  })

  test('skip for now completes with role only', async ({ page }) => {
    const u = await createTestUser({ onboarded: false })
    await loginViaApi(page, u); await page.goto('/welcome'); await page.getByTestId('role-pm').click(); await page.getByTestId('welcome-skip').click()
    await expect(page).toHaveURL(/\/(workspace|challenges)/)
    const prof = await page.request.get('/api/profile').then(r => r.json()); expect(prof.onboarding_completed_at).toBeTruthy()
    await cleanupTestUser(u.id)
  })

  test('mobile stacks the panel above the form', async ({ page }) => {
    const u = await createTestUser({ onboarded: false }); await loginViaApi(page, u); await page.setViewportSize(VIEWPORTS.mobile); await page.goto('/welcome')
    const panel = await page.getByTestId('welcome-panel').boundingBox(); const next = await page.getByTestId('welcome-next').boundingBox()
    expect(panel!.width).toBeGreaterThan(300); expect(next!.y).toBeGreaterThan(panel!.y + panel!.height)
    await cleanupTestUser(u.id)
  })
})
```

- [ ] **Step 2: Run** `npx playwright test e2e/density/onboarding.spec.ts` → 3 passed. Commit:

```bash
git add e2e/density/onboarding.spec.ts e2e/helpers.ts
git commit -m "test(density): /welcome E2E"
```

## Self-review

- Spec §4.3: split layout (Task 3), five steps (Task 2/3), shorter scenarios (Task 1), resume (Task 2), skip (Task 3), page not modal (Task 4), entry points (Task 5). Left-panel copy changes per step (PANEL map). Orphans: every button in the wiring table has an API call or navigation.
