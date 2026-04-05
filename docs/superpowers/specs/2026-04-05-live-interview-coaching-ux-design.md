# Live Interview — Real-Time Coaching UX

## Context

The live interview feature works end-to-end: voice + chat with Luma, 20-turn conversations, debriefs with FLOW scoring. But the intelligence layer (per-turn grading signals, competency detection, failure patterns) is generated and then **discarded** before reaching the user. The debrief reads flat. There's no warm-up. The experience feels robotic compared to competitors like Final Round AI (per-answer feedback) and Tough Tongue (multimodal coaching).

This spec upgrades the UX to surface coaching intelligence in real-time and make the interview feel human.

---

## Changes

### 1. Store Grading Signals Per-Turn

Both `/turn` and `/chat` routes parse the `{"flow_move","competency","signal"}` JSON block appended by Claude. Currently `/chat` discards it entirely.

**Change:** Extract signal parsing into `src/lib/live-interview/parse-grading-signal.ts`:
```typescript
export function parseGradingSignal(rawContent: string): {
  cleanContent: string
  signal: { flowMove: string; competency: string; signal: string } | null
}
```

Both routes call this, store `flow_move_detected` and `competency_signals` on the `live_interview_turns` row. DB columns already exist in the migration but need ALTER on the live database (`flow_move_detected TEXT`, `competency_signals JSONB`).

### 2. Update FLOW Coverage from LLM Signals

Replace the keyword heuristic in `/turn` with the LLM-detected `flow_move`. When signal has a valid flow_move (frame|list|optimize|win), increment that step's coverage by +0.15 (capped at 1.0). Both `/turn` and `/chat` do this identically after storing the signal.

### 3. Return Signal Metadata to Frontend

`/chat` returns `{ reply, signal?: { flowMove, competency, signal } }`.

For voice mode: SSE `/status` adds `latestSignal` field (the most recent turn's signal) so the session page can attach it to the latest Luma transcript turn.

**TranscriptTurn interface:**
```typescript
interface TranscriptTurn {
  id: string
  role: 'luma' | 'user'
  content: string
  coachingSignal?: { flowMove: string; competency: string; signal: string }
}
```

### 4. Coaching Chips on TranscriptPanel

After each Luma turn with a `coachingSignal`, render a chip below the bubble:
- Default: FLOW step pill only (`Frame`, `List`, etc.) — `bg-primary-fixed text-primary rounded-full text-xs px-2 py-0.5`
- Tap/click: expands to show competency name + signal text
- Styling: `bg-surface-container-low rounded-lg p-2 text-xs text-on-surface-variant`
- Only on Luma turns

### 5. "Luma Is Thinking" State

Add `'thinking'` to `lumaState` union type.

- Chat send → `setLumaState('thinking')` immediately
- LumaAvatar maps `thinking` → LumaGlyph `reviewing` state
- TranscriptPanel: when last turn is user and `isThinking=true`, show pulsing dots indicator on Luma's side
- Reply arrives → `setLumaState('idle')`

### 6. Warm-Up Phase in System Prompt

Add to `buildLiveInterviewSystemPrompt()` between identity and company persona:

```
[WARM-UP]
Start with a brief, warm greeting. Use the candidate's name ({learnerName}).
Ask one casual question to help them settle in — "How are you feeling about
interviews lately?" or "What have you been working on?" Keep it to 1-2
exchanges. Then transition naturally: "Alright, let's jump in." The warm-up
should feel like a real human interviewer putting someone at ease. These
turns don't count toward FLOW tracking — set flow_move to null.
```

Also enhance the internal tracking section:

```
When the candidate demonstrates a weak reasoning move (especially their
weakest: {weakestMove}), name what's missing in your spoken response. Don't
say "you missed the Frame step." Instead say things like "You jumped to
solutions before diagnosing the root cause" or "What are you actually
optimizing for here?" Ground your pushback in the specific reasoning gap.
```

### 7. FLOW Bar Animation

When a FLOW step's value increases:
- Bar width transitions: `transition-all duration-500 ease-out`
- Brief glow: `ring-2 ring-primary/30` for 1 second, then fades
- CSS-only via a `data-updated` attribute toggled by React state

### 8. Debrief Per-Turn Timeline

Replace the flat collapsible transcript with a timeline:
- Each turn pair (user + Luma) is a row
- Left: turn number + relative timestamp
- Center: user message + Luma response (abbreviated to ~100 chars, expandable)
- Right: FLOW step pill + competency badge (if signal exists)
- Left border color-coded by active FLOW step (primary=Frame, tertiary=List, blue=Optimize, purple=Win, gray=none)

### 9. Debrief Competency Radar

SVG hexagonal radar chart (no library):
- 6 axes = 6 competency dimensions
- Filled polygon = this session's detected competencies (scored from signal count/strength)
- Outline polygon = baseline from `learner_competencies` table
- Axes labeled: Motivation Theory, Cognitive Empathy, Taste, Strategic Thinking, Creative Execution, Domain Expertise

### 10. SSE Status Enhancement

Change from 5-poll-then-close to continuous polling while session is active:
- Poll every 3 seconds
- Add `latestSignal` to payload: `{ flowCoverage, totalTurns, latestSignal?: {...} }`
- Stop when session `status !== 'active'`

---

## Files

| File | Change |
|------|--------|
| `src/lib/live-interview/parse-grading-signal.ts` | NEW — shared signal parser |
| `src/app/api/live-interview/[id]/turn/route.ts` | MODIFY — use shared parser, store signal, update FLOW from LLM |
| `src/app/api/live-interview/[id]/chat/route.ts` | MODIFY — use shared parser, store signal, update FLOW, return signal |
| `src/app/api/live-interview/[id]/status/route.ts` | MODIFY — continuous polling, add latestSignal |
| `src/lib/live-interview/system-prompt.ts` | MODIFY — add warm-up + coaching instructions |
| `src/components/live-interview/TranscriptPanel.tsx` | MODIFY — coaching chips, thinking indicator |
| `src/components/live-interview/FlowCoveragePanel.tsx` | MODIFY — transition animation + glow |
| `src/app/(app)/live-interviews/[id]/page.tsx` | MODIFY — thinking state, signal attachment, SSE signal handling |
| `src/components/live-interview/LumaAvatar.tsx` | MODIFY — map thinking→reviewing |
| `src/app/(app)/live-interviews/[id]/debrief/page.tsx` | MODIFY — timeline + radar chart |
| `supabase/migrations/033_live_interview_sessions.sql` | MODIFY — ensure columns in ALTER |

---

## Verification

1. **Chat mode:** Send message → see "thinking" animation → Luma replies → coaching chip appears below bubble → FLOW bar animates up
2. **Voice mode:** Speak → Luma responds → SSE delivers signal → coaching chip appears → FLOW bar updates
3. **Warm-up:** Start new session → Luma greets by name, asks casual question → transitions to interview after 1-2 exchanges
4. **Debrief timeline:** End session → debrief shows per-turn timeline with FLOW badges and color-coded borders
5. **Debrief radar:** Competency radar shows this session vs baseline
6. **Signal persistence:** Check `live_interview_turns` rows have `flow_move_detected` and `competency_signals` populated
7. **tsc clean:** `npx tsc --noEmit` passes
8. **E2E test:** 20-turn real test passes with signals stored
