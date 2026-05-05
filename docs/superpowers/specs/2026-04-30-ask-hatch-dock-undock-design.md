# Ask Hatch — Dock / Undock Design

**Date:** 2026-04-30  
**Status:** Approved for implementation

---

## Context

The Ask Hatch button is a floating FAB + popup window in the challenge workspace. Users may find it intrusive when it overlaps their work. This change adds a **dock** option — users can pin Hatch to the right side as a persistent panel, then undock back to floating whenever they want.

The feature applies to two surfaces:
1. `CanvasChatPanel.tsx` — already has a floating Hatch chat in canvas challenges (system design, data modeling, coding)
2. `ChallengeWorkspace.tsx` — FLOW challenges (Frame/List/Optimize/Win); currently has no Hatch chat at all — this adds it with the same floating + dock pattern from the start

No new backend routes. Existing chat endpoints are reused.

---

## Modes

Three states, shared across both surfaces:

| State | Description | Trigger |
|---|---|---|
| `closed` | FAB button visible, no panel | — |
| `floating` | FAB tap opens the popup window | FAB click |
| `docked` | Panel pinned to right edge, workspace shrinks | Dock icon in floating header |

Transitions:
- `closed → floating`: tap FAB
- `floating → docked`: click dock icon (⊟) in floating window header
- `docked → floating`: click undock icon (⊞) in docked panel header
- `floating → closed`: click close (✕) in floating window header
- `docked → closed`: click close (✕) in docked panel header

Mode persists in `localStorage` keyed by surface (`hatch-mode:canvas`, `hatch-mode:flow`). On next visit the panel reopens in whatever state the user left it.

---

## Floating Mode (existing, minimal change)

The existing floating window gets one addition: a **dock icon** in the header, left of the close button.

- Icon: use Material Symbols `dock_to_bottom` or a suitable equivalent (⊟ visually)
- Tooltip: "Dock to side"
- Clicking it transitions to docked mode, preserving chat message history

No other changes to the floating window.

---

## Docked Mode

### Layout

Hatch panel is appended as a third column on the right of the workspace. The existing workspace panes shrink to accommodate it. Total viewport width is unchanged.

```
[  Scenario  ] | [  Workspace  ] | [  Hatch  ]
    flex-1           flex-1          320px default
```

In `ChallengeWorkspace.tsx` (guided mode), the existing 2-pane layout (`leftWidth` / `100 - leftWidth`) becomes a 3-column layout. The scenario/workspace divider keeps its existing behaviour. A new divider sits between workspace and Hatch.

In `CanvasChatPanel.tsx`, the panel currently uses `absolute bottom-4 right-4` positioning. Docked mode changes it to a flex sibling of the canvas area.

### Panel Header

Same gradient as the floating window (`linear-gradient(135deg, #4a7c59, #264a34)`).

Left: HatchGlyph (size 20, state `listening`) + "Hatch" label  
Right: undock icon (⊞, tooltip "Undock") + close icon (✕)

### Panel Width

- **Default:** 320px (matches floating window width)
- **Minimum:** 240px (chat remains readable)
- **Maximum:** 480px
- **Resize:** drag handle (the divider between workspace and Hatch panel), same `col-resize` cursor and mousedown/mousemove/mouseup pattern as the existing scenario/workspace divider in `ChallengeWorkspace.tsx`
- **Persistence:** width saved to `localStorage` keyed by surface (`hatch-width:canvas`, `hatch-width:flow`)

### Panel Body

Same chat UI as the floating window — message list, input textarea, send button. No changes to the chat internals.

---

## FLOW Workspace — Adding Hatch Chat

`ChallengeWorkspace.tsx` currently suppresses the global FloatingHatch and has no Hatch chat. This adds it.

**Floating mode:** FAB button (`absolute bottom-4 right-4` within the workspace container) + popup window. Same structure as `CanvasChatPanel`'s closed/open states.

**Chat endpoint:** reuse `/api/hatch/chat` — the same route `FloatingHatch` calls. Pass challenge context in the request body so Hatch has awareness of what the user is working on.

**Hatch context to pass:**
- `challengeId`
- `currentStep` (FRAME / LIST / OPTIMIZE / WIN)
- `currentMode` (quick / guided / freeform)
- `challengeTitle`

This satisfies the Hatch-awareness requirement: Hatch can see what the user is doing and give contextual coaching.

---

## Shared State Hook

Extract dock/undock state into a small shared hook `useHatchDockState(surface: 'canvas' | 'flow')` that returns:

```ts
{
  mode: 'closed' | 'floating' | 'docked'
  panelWidth: number
  setMode: (m: Mode) => void
  setPanelWidth: (w: number) => void
}
```

Backed by `localStorage`. Both `CanvasChatPanel` and the new FLOW Hatch chat use this hook. Keeps the persistence logic in one place.

---

## Files to Modify

| File | Change |
|---|---|
| `src/components/challenge/CanvasChatPanel.tsx` | Add dock icon to floating header; add docked panel layout; use `useHatchDockState` |
| `src/components/challenge/ChallengeWorkspace.tsx` | Add Hatch FAB + floating + docked panel; extend 2-pane to 3-pane when docked; use `useHatchDockState` |

## Files to Create

| File | Purpose |
|---|---|
| `src/hooks/useHatchDockState.ts` | Shared hook for mode + width persistence |

---

## Verification

1. Open a canvas challenge (system design / coding). Hatch FAB is visible.
2. Tap FAB → floating window opens. Dock icon (⊟) is in the header.
3. Click dock icon → window transitions to a right panel. Workspace panes compress. No layout jump.
4. Drag the divider between workspace and Hatch → panel resizes. Width clamped 240–480px.
5. Click undock (⊞) → reverts to floating window at same position as before.
6. Click close (✕) from floating → collapses to FAB.
7. Click close (✕) from docked → collapses to FAB.
8. Refresh page → mode and width are restored from localStorage.
9. Open a FLOW challenge (guided mode). Hatch FAB appears bottom-right.
10. Repeat steps 2–8 for the FLOW workspace.
11. In docked FLOW mode, ask Hatch a question about the current step → response references the active FLOW step (confirms context is wired).
12. `npx tsc --noEmit` passes clean.
