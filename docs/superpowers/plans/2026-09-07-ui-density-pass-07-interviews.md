# UI Density Pass 07: Interview setup and live interview room

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Requires plan 01. Read `2026-09-07-ui-density-pass-00-master.md` for conventions.

**Goal:** Setup: 88px band ("Interviews", Single / Multi-round chips, Hatch card with the last session score → debrief), one bordered setup panel starting at y≈150 with "Start interview →" inside, recent sessions as a right column. Room: keep the dark shell; one 44px bar (back, company · role · discipline, LIVE, timer with cap, FLOW phase segments, End); three columns at ≥1280 (Hatch presence + prompt + "Hatch is scoring" checklist + quick replies | notes/canvas/editor with the dock | transcript always open); mobile stacked.

**Architecture:** Setup: `src/app/(app)/live-interviews/page.tsx` (server) computes the band data it already has (`getLastSessionBrief`) and renders `InterviewSetupV2` around the existing `SingleRoundPicker` / `FullLoopPanel` (mode from `?mode=`), with `PastSessionsTable` moved into a right column. Room: `src/app/(app)/live-interviews/[id]/page.tsx` is a 3,031-line client page; the density branch replaces only the `phase === 'active'` render (L2054+) with `RoomLayoutV2` composed from the existing panels (`TranscriptPanel`, `FlowCoveragePanel`, canvas/editor surfaces, `CtrlBtn`, handlers), so state, SSE, voice and grading code are untouched.

---

## File structure

Create:
- `src/components/density/interviews/InterviewBand.tsx`
- `src/components/density/interviews/InterviewSetupV2.tsx`
- `src/components/density/interviews/RecentSessionsColumn.tsx`
- `src/components/density/interviews/room/RoomBar.tsx`
- `src/components/density/interviews/room/HatchColumn.tsx`
- `src/components/density/interviews/room/RoomLayoutV2.tsx`
- `src/lib/live-interview/flow-phase.ts` (+ `tests/lib/live-interview/flow-phase.test.ts`)
- `e2e/density/interviews.spec.ts`

Modify:
- `src/app/(app)/live-interviews/page.tsx:157-184`
- `src/app/(app)/live-interviews/LiveInterviewsShell.tsx:1134-1223` (mode from URL, `PastSessionsTable` export)
- `src/app/(app)/live-interviews/[id]/page.tsx:2054-2758` (active branch)
- `src/lib/tours/interviewTour.ts` (anchors)

---

### Task 1: FLOW phase derivation

**Files:**
- Create: `src/lib/live-interview/flow-phase.ts`
- Test: `tests/lib/live-interview/flow-phase.test.ts`

The room already receives `CoachingSignal`s `{flowMove, competency, signal}` on the SSE `status` stream (code map §3). Phase = the highest FLOW move seen so far; the checklist = which moves have a signal.

- [ ] **Step 1: Failing test**

```ts
// tests/lib/live-interview/flow-phase.test.ts
import { describe, it, expect } from 'vitest'
import { derivePhase, FLOW_ORDER } from '@/lib/live-interview/flow-phase'
describe('flow-phase', () => {
  it('starts at warm-up with nothing covered', () => { expect(derivePhase([])).toEqual({ index: 0, label: 'Warm-up', covered: { frame: false, list: false, optimize: false, win: false } }) })
  it('advances to the furthest move with a signal', () => {
    expect(derivePhase([{ flowMove: 'frame' }, { flowMove: 'optimize' }])).toEqual({ index: 3, label: 'Optimize', covered: { frame: true, list: false, optimize: true, win: false } })
  })
  it('ignores unknown moves', () => { expect(derivePhase([{ flowMove: 'x' }]).index).toBe(0) })
  it('orders moves', () => { expect(FLOW_ORDER).toEqual(['frame', 'list', 'optimize', 'win']) })
})
```

- [ ] **Step 2: Implement**

```ts
// src/lib/live-interview/flow-phase.ts
export const FLOW_ORDER = ['frame', 'list', 'optimize', 'win'] as const
export type FlowMove = typeof FLOW_ORDER[number]
export function derivePhase(signals: Array<{ flowMove?: string | null }>) {
  const covered: Record<FlowMove, boolean> = { frame: false, list: false, optimize: false, win: false }
  let max = -1
  for (const s of signals) { const i = FLOW_ORDER.indexOf((s.flowMove ?? '') as FlowMove); if (i >= 0) { covered[FLOW_ORDER[i]] = true; if (i > max) max = i } }
  const label = max < 0 ? 'Warm-up' : FLOW_ORDER[max].charAt(0).toUpperCase() + FLOW_ORDER[max].slice(1)
  return { index: max + 1, label, covered }
}
```

- [ ] **Step 3: Run → PASS; commit** `git add src/lib/live-interview/flow-phase.ts tests/lib/live-interview/flow-phase.test.ts && git commit -m "feat(density): FLOW phase derivation from coaching signals"`.

---

### Task 2: Setup band, sessions column, page assembly

**Files:**
- Create: `InterviewBand.tsx`, `RecentSessionsColumn.tsx`, `InterviewSetupV2.tsx` under `src/components/density/interviews/`
- Modify: `src/app/(app)/live-interviews/page.tsx:157-184`, `LiveInterviewsShell.tsx`

- [ ] **Step 1: `InterviewBand`** (server-safe; receives `lastSession` from `getLastSessionBrief`, and `loopActive` count)

```tsx
// src/components/density/interviews/InterviewBand.tsx
import { HeaderBand } from '@/components/density/HeaderBand'
import { HatchPickCard } from '@/components/density/HatchPickCard'
export function InterviewBand({ mode, loopActive, last }: { mode: 'single' | 'loop'; loopActive: number; last: { sessionId: string; score10: string; discipline: string } | null }) {
  return (
    <HeaderBand
      title="Interviews"
      chips={[{ label: 'Single interview', href: '/live-interviews', active: mode === 'single', testId: 'chip-single' }, { label: `Multi-round${loopActive ? ` · ${loopActive} active` : ''}`, href: '/live-interviews?mode=loop', active: mode === 'loop', testId: 'chip-loop' }]}
      right={last
        ? <HatchPickCard eyebrow="Hatch says" title={`Last session: ${last.score10}/10 in ${last.discipline}`} reason="Open the debrief, then run the same prompt again with a tighter frame." href={`/live-interviews/${last.sessionId}/debrief`} ctaLabel="Debrief" ctaVariant="outline" testId="interview-last" />
        : <HatchPickCard eyebrow="Hatch says" title="Pick a company and discipline below." reason="Voice or chat, your pick. The mic is optional." href="#interview-setup" ctaLabel="Set up" ctaVariant="outline" testId="interview-last" />}
    />
  )
}
```

- [ ] **Step 2: `RecentSessionsColumn`** (client; same fetch as `PastSessionsTable`, `GET /api/live-interview/history`)

```tsx
// src/components/density/interviews/RecentSessionsColumn.tsx
'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
interface Row { id: string; companyName: string | null; roleId: string | null; overallScore: number | null; grade: string | null; durationSeconds: number | null; endedAt: string | null; status: string; scenarioTitle: string | null; disciplineLabel: string | null }
const tag = (s: number | null) => s === null ? null : s >= 7 ? 'bg-primary-fixed text-forest-800' : s >= 5 ? 'bg-primary-fixed text-forest-800' : 'bg-amber-soft text-tertiary'
const label = (s: number | null) => s === null ? '' : s >= 7 ? 'Strong' : s >= 5 ? 'Developing' : 'Needs practice'
export function RecentSessionsColumn() {
  const [rows, setRows] = useState<Row[] | null>(null); const [err, setErr] = useState(false)
  useEffect(() => { fetch('/api/live-interview/history', { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject()).then(b => setRows((b.sessions ?? b) as Row[])).catch(() => setErr(true)) }, [])
  return (
    <aside data-testid="recent-sessions" className="flex h-full max-h-[520px] flex-col overflow-hidden rounded-2xl border border-hairline bg-card-bright">
      <div className="flex items-baseline justify-between border-b border-hairline px-3.5 py-3"><h2 className="font-headline text-[16px] font-bold">Recent sessions</h2><Link href="/history" className="text-[12px] font-bold text-primary">All →</Link></div>
      <div className="overflow-y-auto text-[12px]">
        {err && <p className="px-3.5 py-3 text-ink-secondary">Could not load past sessions.</p>}
        {rows === null && !err && [0,1,2].map(i => <div key={i} className="mx-3.5 my-2 h-10 animate-pulse rounded bg-surface-container-high" />)}
        {rows?.map(r => { const s = r.overallScore === null ? null : Number((r.overallScore > 10 ? r.overallScore / 10 : r.overallScore).toFixed(1)); const done = r.status === 'completed'; const href = done ? `/live-interviews/${r.id}/debrief` : `/live-interviews/${r.id}`; return (
          <Link key={r.id} href={href} data-testid="session-row" className="block border-b border-hairline px-3.5 py-2.5 hover:bg-surface-container-low">
            <div className="flex items-center justify-between gap-2"><b className="truncate">{r.companyName ?? 'General'} · {r.roleId ?? ''}</b>{done && s !== null ? <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${tag(s)}`}>{s} · {label(s)}</span> : <span className="shrink-0 text-[10px] text-ink-secondary">{done ? 'Debrief' : 'Incomplete'}</span>}</div>
            <div className="truncate text-[11px] text-ink-secondary">{r.disciplineLabel ?? r.scenarioTitle ?? ''}{r.durationSeconds ? ` · ${Math.floor(r.durationSeconds / 60)}m` : ''}{r.endedAt ? ` · ${new Date(r.endedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</div>
          </Link>) })}
        {rows?.length === 0 && <p className="px-3.5 py-3 text-ink-secondary">No sessions yet. Your first debrief lands here.</p>}
      </div>
    </aside>
  )
}
```

Confirm the history response shape (code map §2: fields `id, companyName, roleId, overallScore, grade, durationSeconds, endedAt, status, scenarioTitle, disciplineLabel`; top-level key: check `history/route.ts` L115-120 whether it returns `{ sessions: [...] }` or an array) and the score scale (`normalizeToTen(score, 5)` is used on the page; reuse that helper from the same import as `page.tsx` L152 instead of the inline `> 10` guess).

- [ ] **Step 3: `InterviewSetupV2`**

```tsx
// src/components/density/interviews/InterviewSetupV2.tsx
import type { ReactNode } from 'react'
import { InterviewBand } from './InterviewBand'
import { RecentSessionsColumn } from './RecentSessionsColumn'
export function InterviewSetupV2({ mode, loopActive, last, children }: { mode: 'single' | 'loop'; loopActive: number; last: Parameters<typeof InterviewBand>[0]['last']; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-4 sm:px-6">
      <InterviewBand mode={mode} loopActive={loopActive} last={last} />
      <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div id="interview-setup" data-testid="setup-panel" className="scroll-mt-16 overflow-hidden rounded-2xl border border-hairline bg-card-bright">{children}</div>
        <RecentSessionsColumn />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Page and shell changes**

`src/app/(app)/live-interviews/page.tsx` L157-184: when the flag is on, read `searchParams.mode` (`'loop' | undefined`), compute `last` from `getLastSessionBrief()` (`{ sessionId, score10: normalizeToTen(score, 5).toFixed(1), discipline }`; return null when score is null), fetch `loopActive` server-side (`GET` logic of `/api/interview-loops` is in `src/app/api/interview-loops/route.ts`; call its data function or query `interview_loops` where `user_id` and `status='in_progress'` with the admin client, `count: 'exact', head: true`), and render `<InterviewSetupV2 mode={mode} loopActive={loopActive} last={last}><LiveInterviewsShellClient personas scenarios initialMode={mode} hideHeader /></InterviewSetupV2>` plus `<BillingUsageFromProfile />` above it. In `LiveInterviewsShell.tsx`: accept `initialMode` (default `'single'`) for `useState` at L1134 and `hideHeader` to skip its own tablist (L1186-1211) and `PastSessionsTable` (L968+) when true; the `SingleRoundPicker`'s existing `StartInterviewButton` remains the start action (its ready modal and `POST /api/live-interview/start` are unchanged).

- [ ] **Step 5: Verify**: `/live-interviews` flag on: band ≤ 96px; `[data-testid=setup-panel]` top ≤ 160; `[data-testid=recent-sessions]` visible at 1440 and below the panel at 1280; `?mode=loop` shows the loop builder; the band's Debrief link resolves to `/live-interviews/<id>/debrief`. Commit:

```bash
git add src/components/density/interviews src/app/(app)/live-interviews/page.tsx src/app/(app)/live-interviews/LiveInterviewsShell.tsx src/app/(app)/live-interviews/LiveInterviewsShellClient.tsx
git commit -m "feat(density): interview setup band, panel and sessions column"
```

**Wiring table:** Single/Multi-round → `/live-interviews` / `?mode=loop`; Hatch card → debrief route or `#interview-setup`; session rows → debrief (completed) or resume the room (incomplete); Start interview → existing `StartInterviewButton` (`POST /api/live-interview/start`).

---

### Task 3: Room bar, Hatch column, layout

**Files:**
- Create: `room/RoomBar.tsx`, `room/HatchColumn.tsx`, `room/RoomLayoutV2.tsx` under `src/components/density/interviews/`
- Modify: `src/app/(app)/live-interviews/[id]/page.tsx:2054-2758`, `src/lib/tours/interviewTour.ts`

- [ ] **Step 1: `RoomBar`**

```tsx
// src/components/density/interviews/room/RoomBar.tsx
'use client'
import { FLOW_ORDER } from '@/lib/live-interview/flow-phase'
export function RoomBar({ company, role, discipline, live, timer, capLabel, phaseIndex, phaseLabel, onBack, onEnd, onTour, ending }: { company: string; role: string; discipline: string; live: boolean; timer: string; capLabel: string; phaseIndex: number; phaseLabel: string; onBack: () => void; onEnd: () => void; onTour: () => void; ending?: boolean }) {
  return (
    <div data-testid="room-bar" className="flex h-11 shrink-0 items-center gap-3 border-b px-4 text-[12px]" style={{ borderColor: '#223328', background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(8px)' }}>
      <button type="button" aria-label="Back to interviews" onClick={onBack} className="grid size-8 place-items-center rounded-full" style={{ background: 'rgba(255,255,255,.08)' }}><span className="material-symbols-outlined text-[18px]">arrow_back</span></button>
      <b className="truncate">{company} · {role} · {discipline}</b>
      {live && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: '#1f3d2b', color: '#8ecf9e' }}>● LIVE</span>}
      <span data-testid="room-timer" className="rounded-lg px-2.5 py-1 font-mono text-[13px]" style={{ background: '#1a2a20' }}>{timer} / {capLabel}</span>
      <div className="hidden items-center gap-1.5 text-[10px] lg:flex" style={{ color: '#9fb3a6' }} data-testid="room-phase" aria-label={`Phase: ${phaseLabel}`}>
        <span>{phaseLabel}</span>{FLOW_ORDER.map((m, i) => <i key={m} className="block h-1 w-[26px] rounded" style={{ background: i < phaseIndex ? '#8ecf9e' : '#2b4034' }} />)}<span>Frame · List · Optimize · Win</span>
      </div>
      <div className="flex-1" />
      <button type="button" aria-label="Tour this screen" onClick={onTour} className="hidden size-8 place-items-center rounded-full lg:grid" style={{ background: 'rgba(255,255,255,.08)' }}><span className="material-symbols-outlined text-[18px]">help</span></button>
      <button type="button" data-testid="live-interview-end" onClick={onEnd} disabled={ending} className="rounded-full px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60" style={{ background: '#7a2a26' }}>End interview</button>
    </div>
  )
}
```

- [ ] **Step 2: `HatchColumn`**

```tsx
// src/components/density/interviews/room/HatchColumn.tsx
'use client'
import { HatchImage } from '@/components/redesign/HatchImage'
import { FLOW_ORDER, type FlowMove } from '@/lib/live-interview/flow-phase'
const CHECKS: Record<FlowMove, string> = { frame: 'Framed the real problem', list: 'Named the options', optimize: 'Picked a criterion', win: 'Named the metric' }
export function HatchColumn({ state, prompt, covered, quickReplies, onQuick, disabled }: { state: 'listening' | 'thinking' | 'speaking' | 'idle'; prompt: string | null; covered: Record<FlowMove, boolean>; quickReplies: string[]; onQuick: (t: string) => void; disabled: boolean }) {
  const st = state === 'thinking' ? 'Hatch is thinking' : state === 'speaking' ? 'Hatch is speaking' : 'Hatch is listening'
  return (
    <div data-testid="room-hatch" data-tour-target="interview-stage" className="flex h-full flex-col gap-3 overflow-y-auto p-3.5" style={{ borderRight: '1px solid #223328' }}>
      <div className="flex flex-col items-center gap-1.5 border-b pb-3" style={{ borderColor: '#223328' }}>
        <div className="grid size-[88px] place-items-center rounded-full" style={{ background: 'radial-gradient(circle at 50% 40%,#2c4a38,#16261d)', boxShadow: '0 0 0 6px #17281e, 0 0 30px #2f7d5c66' }}><HatchImage state={state === 'thinking' ? 'reviewing' : state === 'speaking' ? 'speaking' : 'listening'} size={64} /></div>
        <div className="text-[10px] font-bold uppercase tracking-[.08em]" style={{ color: '#8ecf9e' }}>{st}</div>
      </div>
      {prompt && <div className="rounded-xl px-3 py-2.5 text-[12px] leading-[1.45]" style={{ background: '#16261d', border: '1px solid #2b4034' }}><div className="mb-1 text-[9px] font-bold uppercase tracking-[.08em]" style={{ color: '#9fb3a6' }}>The prompt</div>{prompt}</div>}
      <div className="rounded-xl px-3 py-2.5 text-[11px]" style={{ background: '#16261d', border: '1px solid #2b4034' }} data-testid="room-scoring">
        <div className="mb-1 text-[9px] font-bold uppercase tracking-[.08em]" style={{ color: '#9fb3a6' }}>Hatch is scoring</div>
        {FLOW_ORDER.map(m => <div key={m} className="flex justify-between py-0.5"><span>{CHECKS[m]}</span><span style={{ color: covered[m] ? '#8ecf9e' : '#54685c' }}>{covered[m] ? '●' : '○'}</span></div>)}
      </div>
      <div className="flex flex-wrap gap-1.5">{quickReplies.map(q => <button key={q} type="button" disabled={disabled} onClick={() => onQuick(q)} className="rounded-full border px-2 py-0.5 text-[10px] disabled:opacity-50" style={{ borderColor: '#2b4034', color: '#c9d6cc' }}>{q}</button>)}</div>
    </div>
  )
}
```

- [ ] **Step 3: `RoomLayoutV2`**

```tsx
// src/components/density/interviews/room/RoomLayoutV2.tsx
'use client'
import type { ReactNode } from 'react'
export function RoomLayoutV2({ bar, left, center, dock, right }: { bar: ReactNode; left: ReactNode; center: ReactNode; dock: ReactNode; right: ReactNode }) {
  return (
    <div data-testid="live-interview-workspace" className="flex h-screen flex-col text-[#e8efe9]" style={{ background: '#0f1a14' }}>
      {bar}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_340px]">
        <div className="hidden min-h-0 lg:block">{left}</div>
        <div className="relative min-h-0 overflow-hidden p-3.5 pb-16">{center}<div className="absolute inset-x-0 bottom-3 flex justify-center gap-3">{dock}</div></div>
        <div className="min-h-0 overflow-hidden" style={{ borderLeft: '1px solid #223328' }}>{right}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Wire the active branch in `[id]/page.tsx`**

At the start of the `phase === 'active'` render (L2054), when `useUiShell().density` is true, return:

```tsx
<>
  <InterviewTourMount active={interviewPhase === 'active'} ready={turns.length > 0} />
  <RoomLayoutV2
    bar={<RoomBar company={companyName} role={roleName} discipline={DISCIPLINE_META[discipline]?.label ?? discipline} live={phase === 'active'} timer={formatted} capLabel="25:00" phaseIndex={flowPhase.index} phaseLabel={flowPhase.label} onBack={() => router.push('/live-interviews')} onEnd={handleEndInterview} onTour={() => window.dispatchEvent(new Event('start-interview-tour'))} ending={isEnding} />}
    left={<HatchColumn state={isThinking ? 'thinking' : avatarState === 'speaking' ? 'speaking' : 'listening'} prompt={scenarioPrompt} covered={flowPhase.covered} quickReplies={["I'm here", 'Give me a hint', 'I need a minute', 'Can we take a quick break?']} onQuick={handleQuickChatMessage} disabled={phase !== 'active' || isThinking || isChatSending || isEnding} />}
    center={centerMode === 'canvas' ? /* existing canvas JSX L2431 */ : centerMode === 'editor' ? /* existing editor JSX L2441 */ : <NotesPad value={notes} onChange={setNotes} />}
    dock={<>{/* existing CtrlBtn list L2647-2758 minus Transcript and Chat toggles, keep Mute, Break, Captions, FLOW, Focus, Canvas/Editor, and no End (End lives in the bar) */}</>}
    right={<TranscriptPanel /* existing props, forced open; include the chat input + send from the drawer (L2912/L2927) at the bottom */ />}
  />
  {/* keep modals: limit modal, focus mode overlay, FlowCoveragePanel drawer */}
</>
```

Supporting edits in the page:
- `const flowPhase = useMemo(() => derivePhase(recentSignals), [recentSignals])`.
- `scenarioPrompt`: the first Hatch turn's text with grading blocks stripped (`turns.find(t => t.role === 'hatch')?.text`), or `scenarioTitle`.
- `NotesPad`: a controlled `<textarea data-testid="room-notes">` on a cream pad (`bg-surface-container-low text-ink-strong rounded-xl p-4 h-full`) with header "Your notes · Hatch can see this"; on change, debounce 1500ms and call the existing snapshot path (`buildCurrentArtifactSnapshot` + `POST /api/live-interview/{id}/snapshot`) with `{ kind: 'notes', text }` so Hatch's context includes it (the snapshot route already accepts artifact payloads; add a `notes` field to `LiveInterviewArtifactSnapshot` in `src/lib/live-interview/artifact-context.ts` and include it in the prompt builder where `canvas`/`editor` artifacts are described).
- Transcript panel: pass `isOpen` true and render the chat input under it (move the input/send JSX from the drawer into a `TranscriptComposer` component used by both branches).
- Keep `data-testid`s used by tests: `live-interview-end` (now on the bar), `live-interview-mode-canvas`, `live-interview-mode-editor`, `live-interview-mode-flow`, `live-interview-mode-focus`, `live-interview-chat-input`, `live-interview-chat-send`.
- Below `lg`: `RoomLayoutV2` collapses to one column; render `HatchColumn`'s prompt card above the transcript and a "Notes ▸" chip that opens `NotesPad` in a bottom sheet (`position: fixed; bottom: 0; height: 60vh`).

- [ ] **Step 5: Tour anchors**: in `src/lib/tours/interviewTour.ts` the `stage` step anchors `[data-tour-target="interview-stage"]` (now the Hatch column), `transcript` anchors `[data-tour-target="interview-transcript"]` (keep on the transcript panel root), `flow` anchors `[data-tour-target="interview-flow"]` (put on `[data-testid=room-phase]` in the bar), `chat` anchors `[data-testid="live-interview-mode-chat"]` (that button is gone in density: point the step at `[data-testid="live-interview-chat-input"]` instead), `end` stays.

- [ ] **Step 6: Verify manually** with an active session (`/live-interviews/3a876a2e-8d3b-4dd7-b7f8-18e082c1cec0`, "Continue in chat, no mic"): bar 44px, three columns, transcript open, typing a message sends `POST /api/live-interview/<id>/chat`, quick reply sends, notes textarea triggers a snapshot POST, phase segments fill as signals arrive, End posts `/end` and routes to the debrief. Commit:

```bash
git add src/components/density/interviews/room src/app/(app)/live-interviews/[id]/page.tsx src/lib/tours/interviewTour.ts src/lib/live-interview/artifact-context.ts
git commit -m "feat(density): interview room three-column layout"
```

**Wiring table:** back → `/live-interviews`; End → `handleEndInterview` (`POST /end`); tour → `start-interview-tour`; quick replies → `handleQuickChatMessage` (`POST /chat`); transcript composer → `handleSendChatMessage`; notes → snapshot POST; dock buttons → existing handlers; canvas/editor → existing `setCenterMode`.

---

### Task 4: E2E

**Files:**
- Create: `e2e/density/interviews.spec.ts`

- [ ] **Step 1: Spec**

```ts
import { test, expect } from '@playwright/test'
import { VIEWPORTS, loginViaApi, gotoReady, topOf } from './helpers'

test.describe('interviews', () => {
  test.beforeEach(async ({ page }) => { await loginViaApi(page) })

  test('setup: band, panel, sessions column, mode chips', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop); await gotoReady(page, '/live-interviews')
    expect((await page.getByTestId('header-band').boundingBox())!.height).toBeLessThanOrEqual(100)
    expect(await topOf(page, '[data-testid=setup-panel]')).toBeLessThanOrEqual(170)
    await expect(page.getByTestId('recent-sessions')).toBeVisible()
    const row = page.getByTestId('session-row').first(); if (await row.count()) expect(await row.getAttribute('href')).toMatch(/\/live-interviews\/[0-9a-f-]+(\/debrief)?$/)
    await page.getByTestId('chip-loop').click(); await expect(page).toHaveURL(/mode=loop/)
    await page.setViewportSize(VIEWPORTS.laptop); await gotoReady(page, '/live-interviews'); const panel = await page.getByTestId('setup-panel').boundingBox(); const col = await page.getByTestId('recent-sessions').boundingBox(); expect(col!.y).toBeGreaterThan(panel!.y + panel!.height - 5)
  })

  test('room: three columns, chat send, end', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    // create a fresh session via the API the setup page uses
    const start = await page.request.post('/api/live-interview/start', { data: { companyId: 'google', roleId: 'pm', challengeId: null, discipline: 'product_sense' } })
    expect(start.status()).toBe(200); const { sessionId } = await start.json()
    await page.goto(`/live-interviews/${sessionId}?autostart=1&company=Google&role=PM&discipline=product_sense`)
    await page.getByRole('button', { name: /continue in chat/i }).click()
    await expect(page.getByTestId('room-bar')).toBeVisible({ timeout: 30_000 })
    expect((await page.getByTestId('room-bar').boundingBox())!.height).toBeLessThanOrEqual(48)
    await expect(page.getByTestId('room-hatch')).toBeVisible(); await expect(page.getByTestId('room-notes')).toBeVisible(); await expect(page.getByTestId('live-interview-chat-input')).toBeVisible()
    const chat = page.waitForResponse(r => r.url().includes(`/api/live-interview/${sessionId}/chat`) && r.request().method() === 'POST')
    await page.getByTestId('live-interview-chat-input').fill('Before solutions I want to know who the new actives are.'); await page.getByTestId('live-interview-chat-send').click(); expect((await chat).ok()).toBe(true)
    const end = page.waitForResponse(r => r.url().includes(`/api/live-interview/${sessionId}/end`))
    await page.getByTestId('live-interview-end').click(); expect((await end).ok()).toBe(true); await expect(page).toHaveURL(new RegExp(`/live-interviews/${sessionId}/debrief`), { timeout: 30_000 })
  })
})
```

Check the `companyId`/`roleId` values against `company_profiles` (`select slug, roles from company_profiles limit 5`) and the `start` route's response key for the id (`sessionId` vs `id`).

- [ ] **Step 2: Run** → 2 passed. Commit: `git add e2e/density/interviews.spec.ts && git commit -m "test(density): interview setup and room E2E"`.

## Self-review
- Spec §4.11 and §4.12 covered; the room keeps every existing handler and adds notes as Hatch-visible context (Hatch-awareness rule in CLAUDE.md: new state must reach the model, hence the snapshot `notes` field).
