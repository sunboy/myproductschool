# Ask Hatch Dock / Undock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dock/undock to the Ask Hatch floating panel in both canvas challenges (`CanvasChatPanel`) and the FLOW challenge workspace (`ChallengeWorkspace`), with localStorage persistence.

**Architecture:** A shared hook `useHatchDockState` stores mode (`closed | floating | docked`) and panel width in localStorage, keyed by surface. `CanvasChatPanel` gains a dock icon in its floating header and a docked layout sibling to the canvas. `ChallengeWorkspace` gains a full Hatch chat (FAB + floating + docked) wired to `/api/hatch/chat`, using the same hook.

**Tech Stack:** React hooks, localStorage, Tailwind CSS, Material Symbols Outlined, existing drag-resize pattern from `ChallengeWorkspace.tsx`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `src/hooks/useHatchDockState.ts` | localStorage-backed mode + width for one surface |
| Modify | `src/components/challenge/CanvasChatPanel.tsx` | Dock icon in header; docked panel layout; use hook |
| Modify | `src/components/challenge/ChallengeWorkspace.tsx` | Add Hatch chat; 3-pane layout when docked; use hook |

---

## Task 1: Create `useHatchDockState` hook

**Files:**
- Create: `src/hooks/useHatchDockState.ts`

- [ ] **Step 1: Write the hook**

```ts
// src/hooks/useHatchDockState.ts
'use client'

import { useState, useCallback, useEffect } from 'react'

export type HatchDockMode = 'closed' | 'floating' | 'docked'

const DEFAULT_WIDTH = 320
const MIN_WIDTH = 240
const MAX_WIDTH = 480

export function useHatchDockState(surface: 'canvas' | 'flow') {
  const modeKey = `hatch-mode:${surface}`
  const widthKey = `hatch-width:${surface}`

  const [mode, setModeState] = useState<HatchDockMode>(() => {
    if (typeof window === 'undefined') return 'closed'
    return (localStorage.getItem(modeKey) as HatchDockMode) ?? 'closed'
  })

  const [panelWidth, setPanelWidthState] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDTH
    const stored = parseInt(localStorage.getItem(widthKey) ?? '', 10)
    return isNaN(stored) ? DEFAULT_WIDTH : Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, stored))
  })

  const setMode = useCallback((m: HatchDockMode) => {
    setModeState(m)
    localStorage.setItem(modeKey, m)
  }, [modeKey])

  const setPanelWidth = useCallback((w: number) => {
    const clamped = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, w))
    setPanelWidthState(clamped)
    localStorage.setItem(widthKey, String(clamped))
  }, [widthKey])

  // Sync on mount in case another tab changed localStorage
  useEffect(() => {
    const stored = localStorage.getItem(modeKey) as HatchDockMode | null
    if (stored) setModeState(stored)
    const storedW = parseInt(localStorage.getItem(widthKey) ?? '', 10)
    if (!isNaN(storedW)) setPanelWidthState(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, storedW)))
  }, [modeKey, widthKey])

  return { mode, panelWidth, setMode, setPanelWidth, MIN_WIDTH, MAX_WIDTH }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors referencing `useHatchDockState.ts`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useHatchDockState.ts
git commit -m "feat(hatch): add useHatchDockState hook for dock/undock persistence"
```

---

## Task 2: Update `CanvasChatPanel` — floating mode dock icon

**Files:**
- Modify: `src/components/challenge/CanvasChatPanel.tsx`

The floating window header currently has only a close button (`chevron_right`). Add a dock icon left of it.

- [ ] **Step 1: Add `useHatchDockState` import and wire it**

At the top of `CanvasChatPanel.tsx`, add the import:

```ts
import { useHatchDockState } from '@/hooks/useHatchDockState'
```

Inside the `CanvasChatPanel` component body, after the existing `useState` declarations (around line 108), add:

```ts
const { mode, panelWidth, setMode, setPanelWidth, MIN_WIDTH, MAX_WIDTH } = useHatchDockState('canvas')
```

Replace the existing `isOpen` / `onToggle` prop usage for open/closed with the hook's `mode`:
- `!isOpen` → `mode === 'closed'`
- `isOpen` → `mode !== 'closed'`
- `onToggle` in the FAB → `() => setMode('floating')`
- The existing close button (`chevron_right`) → `() => setMode('closed')`

> **Note:** Keep `isOpen` and `onToggle` props in the interface for backward compat — they're used by callers. But inside the component, drive open/close from the hook so docked state persists. The `onToggle` prop can be kept as an optional external override; internally we use `setMode`.

- [ ] **Step 2: Add dock icon to floating panel header**

Find the header block (lines ~224–233 in the current file):

```tsx
<div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant bg-surface-container-high">
  <div className="flex items-center gap-2">
    <HatchGlyph size={20} state={isLoading ? 'reviewing' : 'idle'} className="text-primary" />
    <span className="font-label font-semibold text-sm text-on-surface">Hatch</span>
  </div>
  <button onClick={onToggle} className="text-on-surface-variant hover:text-on-surface transition-colors">
    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
  </button>
</div>
```

Replace with:

```tsx
<div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant bg-surface-container-high">
  <div className="flex items-center gap-2">
    <HatchGlyph size={20} state={isLoading ? 'reviewing' : 'idle'} className="text-primary" />
    <span className="font-label font-semibold text-sm text-on-surface">Hatch</span>
  </div>
  <div className="flex items-center gap-1">
    <button
      onClick={() => setMode('docked')}
      className="text-on-surface-variant hover:text-on-surface transition-colors"
      title="Dock to side"
    >
      <span className="material-symbols-outlined text-[18px]">dock_to_bottom</span>
    </button>
    <button
      onClick={() => setMode('closed')}
      className="text-on-surface-variant hover:text-on-surface transition-colors"
      title="Close"
    >
      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
    </button>
  </div>
</div>
```

- [ ] **Step 3: Verify TypeScript compiles clean**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/challenge/CanvasChatPanel.tsx
git commit -m "feat(hatch): add dock icon to CanvasChatPanel floating header"
```

---

## Task 3: Update `CanvasChatPanel` — docked panel layout + resize

**Files:**
- Modify: `src/components/challenge/CanvasChatPanel.tsx`

The docked panel replaces the `absolute` floating window with a `flex` sibling. The parent canvas container must switch from `position: relative` to `flex-row` when docked. This task adds the docked render path inside `CanvasChatPanel` — the parent wiring is handled by the canvas challenge pages (outside this plan's scope; `CanvasChatPanel` exposes a `isDocked` boolean and `dockedWidth` number as readable state via a ref or by changing `isOpen` prop meaning).

> **Simpler approach:** Export a `usedocked` state and let the parent observe it — but that couples parent to hook. Instead, render the docked panel **inside** `CanvasChatPanel` itself by wrapping its output: when docked, return a fixed-position right panel anchored inside `document.body` using a portal-like approach. This avoids restructuring parent layouts.

Actually, for `CanvasChatPanel` the canvas area uses `absolute` children — a docked panel at the canvas level needs the parent to become a flex row. This plan takes the cleaner path: **when docked, render a fixed right panel** (like the floating window but wider, full-height, attached to the right of the viewport). This matches the spec's intent (workspace panes shrink) by using `padding-right` on the parent, driven by a CSS variable or a prop.

**Implementation:** The docked panel renders as `fixed right-0 top-0 bottom-0` with the panel width. To push the workspace left, `CanvasChatPanel` also renders a spacer `div` with `width: panelWidth` as a flex sibling (consumers must render `CanvasChatPanel` inside a flex container, which all canvas challenge wrappers already do).

- [ ] **Step 1: Add docked render path**

After the `if (mode === 'closed')` block (currently `if (!isOpen)`), and before the floating panel `return`, add:

```tsx
// Docked mode — full-height panel fixed to right edge
const hatchDividerRef = useRef<HTMLDivElement>(null)
const hatchDragging = useRef(false)

function onHatchDividerMouseDown() {
  hatchDragging.current = true
  document.body.style.cursor = 'col-resize'
}
```

Add the mouse event handlers inside a `useEffect`:

```tsx
useEffect(() => {
  function onMove(e: MouseEvent) {
    if (!hatchDragging.current) return
    const newWidth = window.innerWidth - e.clientX
    setPanelWidth(newWidth)
  }
  function onUp() {
    hatchDragging.current = false
    document.body.style.cursor = ''
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
  return () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
}, [setPanelWidth])
```

Add the docked render block. Insert this before the `return (` for the floating panel:

```tsx
if (mode === 'docked') {
  return (
    <>
      {/* Spacer pushes canvas content left */}
      <div style={{ width: panelWidth, flexShrink: 0 }} />
      {/* Docked panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-30 flex flex-col bg-surface-container border-l border-outline-variant shadow-2xl"
        style={{ width: panelWidth }}
      >
        {/* Drag handle on left edge */}
        <div
          ref={hatchDividerRef}
          onMouseDown={onHatchDividerMouseDown}
          className="absolute left-0 top-0 bottom-0 w-1 bg-outline-variant hover:bg-primary cursor-col-resize transition-colors"
        />
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-outline-variant flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #4a7c59, #264a34)' }}
        >
          <div className="flex items-center gap-2">
            <HatchGlyph size={20} state={isLoading ? 'reviewing' : 'listening'} className="text-on-primary" />
            <span className="font-label font-semibold text-sm text-on-primary">Hatch</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode('floating')}
              className="text-on-primary/70 hover:text-on-primary transition-colors"
              title="Undock"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            </button>
            <button
              onClick={() => setMode('closed')}
              className="text-on-primary/70 hover:text-on-primary transition-colors"
              title="Close"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {msg.role === 'hatch' && (
                <HatchGlyph size={20} state="idle" className="text-primary shrink-0 mt-0.5" />
              )}
              <div
                data-testid={msg.role === 'user' ? 'hatch-message-user' : 'hatch-message-assistant'}
                className={`rounded-xl px-3 py-2 text-sm max-w-[85%] font-body leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-on-primary'
                    : msg.kind === 'canvas_action'
                      ? 'bg-primary-container text-on-primary-container'
                      : msg.kind === 'nudge'
                        ? 'bg-tertiary-container text-on-secondary-container border border-outline-variant'
                        : 'bg-surface-container-high text-on-surface'
                }`}
              >
                {msg.kind === 'nudge' && (
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold opacity-70">Hatch noticed</span>
                    {onDismissNudge && (
                      <button onClick={onDismissNudge} className="text-xs opacity-60 hover:opacity-100" aria-label="Dismiss nudge">✕</button>
                    )}
                  </div>
                )}
                {msg.role === 'hatch' ? <Md>{msg.content}</Md> : msg.content}
                {msg.kind === 'canvas_action' && (
                  <span className="material-symbols-outlined text-[14px] ml-1 opacity-70">draw</span>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <HatchGlyph size={20} state="reviewing" className="text-primary shrink-0" />
              <div className="bg-surface-container-high rounded-xl px-3 py-2 text-sm text-on-surface-variant">
                {challengeType === 'coding' ? 'Hatch is thinking…' : onCanvasActions ? 'Hatch is drawing…' : '…'}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {/* Input */}
        {!feedbackMode && (
          <div className="border-t border-outline-variant p-2 bg-surface-container-high flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                data-testid="hatch-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={challengeType === 'coding' ? "Ask Hatch about your code…" : "Ask Hatch or describe what to add…"}
                rows={2}
                className="flex-1 resize-none rounded-lg bg-surface-container border border-outline-variant text-on-surface text-sm px-3 py-2 font-body placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
              />
              <div className="flex flex-col gap-1">
                <VoiceInputButton onTranscript={sendMessage} disabled={isLoading} />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  className="p-2 rounded-full bg-primary text-on-primary disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/challenge/CanvasChatPanel.tsx
git commit -m "feat(hatch): add docked panel layout with resize to CanvasChatPanel"
```

---

## Task 4: Add Hatch chat to `ChallengeWorkspace` — floating mode

**Files:**
- Modify: `src/components/challenge/ChallengeWorkspace.tsx`

Currently no Hatch chat in the FLOW workspace. Add the FAB + floating window wired to `/api/hatch/chat`.

- [ ] **Step 1: Add imports and hook**

At the top of `ChallengeWorkspace.tsx`, add:

```ts
import { Md } from '@/components/ui/Md'
import { useHatchDockState } from '@/hooks/useHatchDockState'
```

Inside `ChallengeWorkspace`, after the existing state declarations, add:

```ts
// Hatch chat
const { mode: hatchMode, panelWidth: hatchWidth, setMode: setHatchMode, setPanelWidth: setHatchWidth, MIN_WIDTH: HATCH_MIN, MAX_WIDTH: HATCH_MAX } = useHatchDockState('flow')
interface FlowChatMessage { role: 'user' | 'hatch'; content: string }
const [hatchMessages, setHatchMessages] = useState<FlowChatMessage[]>([
  { role: 'hatch', content: "I'm watching your work. Ask me about any FLOW step, or how to strengthen your answer." }
])
const [hatchInput, setHatchInput] = useState('')
const [hatchLoading, setHatchLoading] = useState(false)
const hatchBottomRef = useRef<HTMLDivElement>(null)
```

- [ ] **Step 2: Add scroll-to-bottom effect for Hatch messages**

After the existing `useEffect` blocks, add:

```ts
useEffect(() => {
  hatchBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
}, [hatchMessages])
```

- [ ] **Step 3: Add sendHatchMessage function**

After the `handleSubmit` function, add:

```ts
const sendHatchMessage = useCallback(async (text: string) => {
  if (!text.trim() || hatchLoading) return
  setHatchMessages(prev => [...prev, { role: 'user', content: text }])
  setHatchInput('')
  setHatchLoading(true)
  try {
    const res = await fetch('/api/hatch/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: hatchMessages.slice(-10),
        challengeId: challenge.id,
        challengePrompt: challenge.title,
        pageContext: {
          pageType: 'challenge',
          entityId: challenge.id,
          pathname: `/workspace/challenges/${challenge.id}`,
          currentStep: FLOW_STEPS[activeStep]?.key?.toUpperCase() ?? null,
          currentMode: mode,
          challengeTitle: challenge.title,
        },
      }),
    })
    const data = res.ok ? await res.json() : null
    const reply = data?.reply ?? "I'm having trouble responding right now. Try again in a moment."
    setHatchMessages(prev => [...prev, { role: 'hatch', content: reply }])
  } catch {
    setHatchMessages(prev => [...prev, { role: 'hatch', content: "I'm having trouble responding right now. Try again in a moment." }])
  } finally {
    setHatchLoading(false)
  }
}, [hatchLoading, hatchMessages, challenge.id, challenge.title, activeStep, mode])
```

- [ ] **Step 4: Add Hatch floating FAB + panel JSX**

The FLOW workspace wraps all content in `<div className="flex flex-col h-screen bg-background overflow-hidden">`. Inside the content area, add the Hatch overlay. Find the closing `</div>` of the outer wrapper (end of the component `return`) and insert before it:

```tsx
{/* ═══════════════════════════════════════════════════════
    HATCH CHAT — floating FAB + panel (closed & floating modes)
    ═══════════════════════════════════════════════════════ */}
{hatchMode === 'closed' && (
  <button
    onClick={() => setHatchMode('floating')}
    className="absolute bottom-4 right-4 z-20 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-on-primary shadow-lg hover:shadow-xl hover:scale-105 transition-all"
    title="Ask Hatch"
  >
    <HatchGlyph size={20} state="idle" className="text-on-primary" />
    <span className="font-label font-semibold text-sm">Ask Hatch</span>
  </button>
)}

{hatchMode === 'floating' && (
  <div className="absolute bottom-4 right-4 z-20 flex flex-col w-80 h-[480px] max-h-[calc(100%-2rem)] border border-outline-variant rounded-xl bg-surface-container shadow-2xl overflow-hidden">
    {/* Header */}
    <div
      className="flex items-center justify-between px-3 py-2 border-b border-outline-variant flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, #4a7c59, #264a34)' }}
    >
      <div className="flex items-center gap-2">
        <HatchGlyph size={20} state={hatchLoading ? 'reviewing' : 'idle'} className="text-on-primary" />
        <span className="font-label font-semibold text-sm text-on-primary">Hatch</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setHatchMode('docked')}
          className="text-on-primary/70 hover:text-on-primary transition-colors"
          title="Dock to side"
        >
          <span className="material-symbols-outlined text-[18px]">dock_to_bottom</span>
        </button>
        <button
          onClick={() => setHatchMode('closed')}
          className="text-on-primary/70 hover:text-on-primary transition-colors"
          title="Close"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
    {/* Messages */}
    <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
      {hatchMessages.map((msg, i) => (
        <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
          {msg.role === 'hatch' && (
            <HatchGlyph size={20} state="idle" className="text-primary shrink-0 mt-0.5" />
          )}
          <div className={`rounded-xl px-3 py-2 text-sm max-w-[85%] font-body leading-relaxed ${
            msg.role === 'user'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-high text-on-surface'
          }`}>
            {msg.role === 'hatch' ? <Md>{msg.content}</Md> : msg.content}
          </div>
        </div>
      ))}
      {hatchLoading && (
        <div className="flex gap-2">
          <HatchGlyph size={20} state="reviewing" className="text-primary shrink-0" />
          <div className="bg-surface-container-high rounded-xl px-3 py-2 text-sm text-on-surface-variant">Hatch is thinking…</div>
        </div>
      )}
      <div ref={hatchBottomRef} />
    </div>
    {/* Input */}
    <div className="border-t border-outline-variant p-2 bg-surface-container-high flex-shrink-0">
      <div className="flex gap-2 items-end">
        <textarea
          value={hatchInput}
          onChange={(e) => setHatchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendHatchMessage(hatchInput) }
          }}
          placeholder="Ask Hatch about this step…"
          rows={2}
          className="flex-1 resize-none rounded-lg bg-surface-container border border-outline-variant text-on-surface text-sm px-3 py-2 font-body placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
        />
        <button
          onClick={() => sendHatchMessage(hatchInput)}
          disabled={hatchLoading || !hatchInput.trim()}
          className="p-2 rounded-full bg-primary text-on-primary disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 5: Verify TypeScript compiles clean**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/challenge/ChallengeWorkspace.tsx
git commit -m "feat(hatch): add Hatch chat FAB + floating panel to FLOW workspace"
```

---

## Task 5: Add docked mode to `ChallengeWorkspace`

**Files:**
- Modify: `src/components/challenge/ChallengeWorkspace.tsx`

When docked, the FLOW workspace becomes a 3-column layout: `[Scenario] | [Workspace] | [Hatch]`. The existing 2-pane `leftWidth` percentage divider is preserved. Hatch panel is added as a third `px`-width column on the right, with its own drag handle.

- [ ] **Step 1: Add Hatch divider drag state**

After the existing `dragging = useRef(false)` for the scenario/workspace divider, add:

```ts
const hatchDragging = useRef(false)
```

Add the Hatch divider mouse handler function after `onDividerMouseDown`:

```ts
function onHatchDividerMouseDown() {
  hatchDragging.current = true
  document.body.style.cursor = 'col-resize'
}
```

In the existing `useEffect` that handles `onMove` / `onUp`, extend the `onMove` handler to also handle the Hatch divider:

```ts
function onMove(e: MouseEvent) {
  if (dragging.current && containerRef.current) {
    const rect = containerRef.current.getBoundingClientRect()
    const pct = ((e.clientX - rect.left) / rect.width) * 100
    setLeftWidth(Math.max(28, Math.min(72, pct)))
  }
  if (hatchDragging.current && containerRef.current) {
    const rect = containerRef.current.getBoundingClientRect()
    const newHatchWidth = rect.right - e.clientX
    setHatchWidth(newHatchWidth)
  }
}
function onUp() {
  dragging.current = false
  hatchDragging.current = false
  document.body.style.cursor = ''
}
```

- [ ] **Step 2: Add docked Hatch panel JSX to content area**

The content area renders three modes (quick / guided / freeform). In **guided mode**, add the Hatch column. Find the guided mode block. The outermost div of the guided split pane looks like:

```tsx
<div ref={containerRef} className="flex-1 flex overflow-hidden">
```

When `hatchMode === 'docked'`, append a drag handle + Hatch panel after the right pane. Wrap the guided mode content div to conditionally add the Hatch column:

After the closing `</section>` of the right pane (and before the closing `</div>` of `containerRef`), add:

```tsx
{hatchMode === 'docked' && (
  <>
    {/* Hatch divider */}
    <div
      onMouseDown={onHatchDividerMouseDown}
      className="w-1 bg-outline-variant hover:bg-primary cursor-col-resize transition-colors flex-shrink-0"
    />
    {/* Hatch panel */}
    <div
      className="flex flex-col bg-surface-container border-l border-outline-variant flex-shrink-0 overflow-hidden"
      style={{ width: hatchWidth }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-outline-variant flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #4a7c59, #264a34)' }}
      >
        <div className="flex items-center gap-2">
          <HatchGlyph size={20} state={hatchLoading ? 'reviewing' : 'listening'} className="text-on-primary" />
          <span className="font-label font-semibold text-sm text-on-primary">Hatch</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setHatchMode('floating')}
            className="text-on-primary/70 hover:text-on-primary transition-colors"
            title="Undock"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </button>
          <button
            onClick={() => setHatchMode('closed')}
            className="text-on-primary/70 hover:text-on-primary transition-colors"
            title="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {hatchMessages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {msg.role === 'hatch' && (
              <HatchGlyph size={20} state="idle" className="text-primary shrink-0 mt-0.5" />
            )}
            <div className={`rounded-xl px-3 py-2 text-sm max-w-[85%] font-body leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface'
            }`}>
              {msg.role === 'hatch' ? <Md>{msg.content}</Md> : msg.content}
            </div>
          </div>
        ))}
        {hatchLoading && (
          <div className="flex gap-2">
            <HatchGlyph size={20} state="reviewing" className="text-primary shrink-0" />
            <div className="bg-surface-container-high rounded-xl px-3 py-2 text-sm text-on-surface-variant">Hatch is thinking…</div>
          </div>
        )}
        <div ref={hatchBottomRef} />
      </div>
      {/* Input */}
      <div className="border-t border-outline-variant p-2 bg-surface-container-high flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={hatchInput}
            onChange={(e) => setHatchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendHatchMessage(hatchInput) }
            }}
            placeholder="Ask Hatch about this step…"
            rows={2}
            className="flex-1 resize-none rounded-lg bg-surface-container border border-outline-variant text-on-surface text-sm px-3 py-2 font-body placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
          />
          <button
            onClick={() => sendHatchMessage(hatchInput)}
            disabled={hatchLoading || !hatchInput.trim()}
            className="p-2 rounded-full bg-primary text-on-primary disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </div>
    </div>
  </>
)}
```

Also add the floating FAB for quick and freeform modes (the `hatchMode === 'closed'` FAB and `hatchMode === 'floating'` panel from Task 4 already render at the bottom of the component, covering those modes). For docked mode in quick/freeform (where there's no 3-pane layout), fall back to the floating panel — add this condition to the docked render in guided mode only; in other modes, the floating/closed states handle it naturally.

- [ ] **Step 3: Verify TypeScript compiles clean**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/challenge/ChallengeWorkspace.tsx
git commit -m "feat(hatch): add docked 3-pane layout to FLOW workspace (guided mode)"
```

---

## Task 6: Playwright smoke test + final TypeScript check

**Files:**
- No code changes — verification only

- [ ] **Step 1: Start dev server**

```bash
cd /Users/sandeep/Projects/myproductschool && npm run dev &
```

Wait ~5s for the server to be ready.

- [ ] **Step 2: Run TypeScript final check**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep -v "supabase/functions"
```

Expected: clean output (no errors).

- [ ] **Step 3: Playwright — canvas challenge smoke test**

Spawn a Haiku subagent to run the following Playwright test. The agent should:

1. Navigate to a system_design or coding challenge (find one from `/challenges` page or use a known ID)
2. Take screenshot — confirm Hatch FAB is visible at bottom-right
3. Click the FAB — confirm floating panel opens with dock icon in header
4. Click the dock icon — confirm the panel switches to a fixed right panel (docked)
5. Take screenshot of docked state
6. Click the undock icon — confirm panel reverts to floating
7. Take screenshot
8. Report what rendered at each step

Save screenshots to `.playwright-screenshots/hatch-dock-canvas-*.png`

- [ ] **Step 4: Playwright — FLOW workspace smoke test**

Spawn a Haiku subagent to run the following Playwright test:

1. Navigate to a FLOW challenge workspace
2. Take screenshot — confirm Hatch FAB visible at bottom-right
3. Click FAB — confirm floating Hatch panel opens with dock icon
4. Click dock — confirm guided mode shows 3-pane layout (scenario | workspace | Hatch)
5. Take screenshot of docked state
6. Type a question in the Hatch input, send it, confirm a reply arrives
7. Click undock — reverts to floating
8. Refresh page — confirm mode is restored from localStorage
9. Report what rendered at each step

Save screenshots to `.playwright-screenshots/hatch-dock-flow-*.png`

- [ ] **Step 5: Commit screenshots**

```bash
git add .playwright-screenshots/hatch-dock-*.png
git commit -m "test(hatch): add Playwright smoke screenshots for dock/undock feature"
```
