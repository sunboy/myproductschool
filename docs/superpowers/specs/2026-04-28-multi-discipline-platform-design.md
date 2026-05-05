# Multi-Discipline Platform Expansion — Design Spec

**Date:** 2026-04-28
**Status:** Approved for implementation planning

---

## Context

HackProduct currently serves engineers practising product sense interviews via the FLOW framework (Frame → List → Optimize → Win). System Design and Data Modeling challenges exist in nascent form (canvas-based, migration 070). This expansion promotes those disciplines to full parity and adds Coding as a fourth discipline, making HackProduct a full-loop interview prep platform for engineers. The core differentiator is cross-discipline coaching: Hatch observes the same thinking patterns across all four disciplines and surfaces connections that single-discipline platforms cannot.

---

## 1. Navigation — No Changes

The current 5-tab nav (Home, Explore, Practice, Interviews, Progress) stays unchanged. Disciplines are not top-level nav items. They surface as grouping layers within Explore and Practice, and as a filter in the Interview lobby.

---

## 2. Explore Page Restructure

Sections in order, top to bottom:

### 2.1 Browse by Discipline (new hero section)
Four cards in a 4-column grid, colour-coded by discipline:
- **Product Sense** (`#4a7c59`) — challenge count
- **System Design** (`#705c30`) — challenge count
- **Data Modeling** (`#6b6358`) — challenge count
- **Coding** (`#3a5a7c`) — "Coming soon" badge

Each card links to Practice with that discipline pre-selected.

### 2.2 Interview Loop Tracks (new section)
Multi-discipline prep tracks that combine disciplines into a time-boxed plan targeting a specific role. Distinct from single-discipline Study Plans.

Examples: "Staff Eng Loop" (System Design + Product Sense + Coding, 6 weeks), "PM Switch Loop" (Product Sense + Data Modeling, 4 weeks), "Founding Eng Loop" (all 4, 8 weeks).

Data model: uses the existing `study_plans` table with a new `track_type = 'loop'` column and a `disciplines TEXT[]` column.

### 2.3 By Paradigm (unchanged)
Traditional / AI-Assisted / Agentic / AI-Native grid. Paradigm applies across all disciplines.

### 2.4 By FLOW Move — removed from Explore
FLOW Move browsing moves inside the Product Sense discipline view in Practice. It does not appear as a top-level Explore section.

### 2.5 Featured Study Plans (unchanged)
Existing single-discipline study plans remain.

---

## 3. Practice Hub — Filter Redesign

### 3.1 Discipline tab strip (new top-level)
Horizontal tab strip above the filter bar: **All | Product Sense | System Design | Data Modeling | Coding**

- Full labels on desktop, abbreviated on mobile ("Product", "Sys Design", "Data", "Coding")
- Tab strip scrolls horizontally on mobile (no truncation, `overflow-x: auto`, `scrollbar-width: none`)
- "Coding" tab is visible but disabled with a muted style until content ships

### 3.2 Contextual filter row (desktop)
One row of labeled dropdown buttons below the tab strip. Dropdowns change based on active discipline tab:

**All tab:** Paradigm ▾ | Difficulty ▾ | Role ▾ | Company ▾ | 🔍 Search

**Product Sense tab:** Paradigm ▾ | Difficulty ▾ | Role ▾ | Company ▾ | 🔍 Search
*(FLOW Move filter removed per design decision)*

**System Design tab:** Scope ▾ (Single Service / Distributed / Multi-Region) | Difficulty ▾ | Role ▾ | Company ▾ | 🔍 Search

**Data Modeling tab:** Difficulty ▾ | Role ▾ | Company ▾ | 🔍 Search

### 3.3 Mobile filter pattern
Single **Filter** button opens a dark bottom sheet containing all active-discipline filter groups as tap-to-select chip rows. Sticky "Show N results" CTA at bottom. Active filters always render as dismissible pills inline (visible without reopening the sheet).

### 3.4 Active filter pills
Appear in a row below the filter bar on both breakpoints. Each pill is dismissible (✕). "Clear all" link at end of row.

### 3.5 Results layout
**All tab:** Results grouped by discipline with colour-coded headers ("🧠 Product Sense — see all 184 →"). 3-column grid on desktop, 1-column list on mobile.

**Single discipline tab:** Flat grid, no grouping headers. 3-column desktop, 1-column mobile.

---

## 4. Live Interviews — Expanded Surface

### 4.1 Lobby redesign

**Two entry modes** at the top of the page (side-by-side cards):

**Single Round card** — practice one interview type with a company persona, 25–35 min. Shows 4 discipline badges. CTA: "Choose a round →"

**Full Loop card** (dark card, "New" badge) — sequential rounds simulating a real interview loop, pause and resume across sessions, Hatch grades across all rounds. Shows example round sequence. CTA: "Build your loop →"

**Discipline filter on persona grid** — chip strip above the company persona grid: All | 🧠 Product Sense | 🏗️ System Design | 🗄️ Data Modeling | 💻 Coding (soon). Filters which personas are shown. Company persona cards display discipline badges showing which interview types that company supports.

### 4.2 Single Round — discipline expansion
Existing product sense interviews are unchanged. System Design and Data Modeling rounds use the existing canvas workspace. Coding rounds (when launched) use a code editor workspace. All single rounds use the existing `live_interview_sessions` table — no schema change required for standalone rounds.

### 4.3 Full Loop Builder (new, 3 steps)

**Step 1 — Target:** Company (free text with suggestions) + Role & Level (free text). Not FK-constrained — users target companies not in the database.

**Step 2 — Configure rounds:** Hatch suggests a round order based on the role (e.g., Staff Eng → Coding first, then System Design, then Product Sense). Displayed as a draggable ordered list. Each row shows discipline, estimated duration, and a remove (✕) button. "Add a round" at the bottom opens a discipline picker. Minimum 2 rounds.

**Step 3 — Confirm:** Summary of the loop (title, rounds, total estimated time). "Start loop" creates the `interview_loops` row and first `loop_rounds` rows, then navigates to the first round.

---

## 5. Full Loop — Data Model

### 5.1 New table: `interview_loops`

```sql
CREATE TABLE interview_loops (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id),
  title               TEXT NOT NULL,               -- "Stripe Staff Eng Loop"
  target_company      TEXT,                         -- free text
  target_role         TEXT,
  status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','active','paused','completed','abandoned')),
  round_order         TEXT[] NOT NULL,              -- ['coding','system_design','product_sense']
  current_round_index INTEGER NOT NULL DEFAULT 0,
  cross_round_memory  JSONB NOT NULL DEFAULT '[]',  -- distilled signals across rounds
  loop_debrief_json   JSONB,                        -- set on completion
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 5.2 New table: `loop_rounds`

```sql
CREATE TABLE loop_rounds (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_id             UUID NOT NULL REFERENCES interview_loops(id),
  round_index         INTEGER NOT NULL,             -- 0-based
  discipline          TEXT NOT NULL
                        CHECK (discipline IN ('product_sense','system_design','data_modeling','coding')),
  session_id          UUID REFERENCES live_interview_sessions(id),  -- null until round starts
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','active','paused','completed')),
  paused_at           TIMESTAMPTZ,
  resumed_at          TIMESTAMPTZ,
  pause_snapshot      JSONB,                        -- {flow_coverage, conversation_memory, system_prompt_hash}
  round_score         INTEGER,                      -- 0-100, set on completion
  round_debrief_json  JSONB,                        -- per-round debrief (same shape as existing debrief_json)
  context_injected    JSONB,                        -- prior-round signals injected into this round's system prompt
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ
);
```

### 5.3 Additive columns on `live_interview_sessions`

```sql
ALTER TABLE live_interview_sessions
  ADD COLUMN loop_id            UUID REFERENCES interview_loops(id),   -- null for standalone
  ADD COLUMN round_index        INTEGER,
  ADD COLUMN prior_round_context JSONB;                                 -- cross-round memory snapshot at round start

-- Extend status enum:
-- 'active' | 'paused' | 'completed' | 'abandoned'  (add 'paused')
```

---

## 6. Full Loop — State Machine

```
draft → active ⇄ paused → completed
              ↘ abandoned
```

**Pause triggers:**
- User taps "Pause loop" button in the persistent loop progress bar
- Tab close / `sendBeacon` while inside a loop session (auto-pause, not abandon)
- Natural pause point between rounds (after one round ends, before next begins)

**What is saved on pause:**
- Full transcript already persisted per-turn in `live_interview_turns` (no change)
- `flow_coverage` + `conversation_memory` → `loop_rounds.pause_snapshot`
- `system_prompt_hash` in pause_snapshot to detect staleness on resume

---

## 7. Full Loop — In-Session UI

**Persistent loop progress bar** — dark bar pinned at the top of the interview page whenever `session.loop_id` is set. Shows all rounds as a horizontal stepper: completed rounds (✓ green), active round (● amber animated), pending rounds (numbered, muted). "Pause loop" button lives here.

**Prior-round recap panel** — narrow panel on the right side of the active round workspace showing the previous round's top 2 strengths and top 1 miss. Label: "Round N recap — Hatch is carrying this context." Panel is read-only and collapsed on mobile.

---

## 8. Full Loop — Cross-Round Context Pipeline

After each round completes:

1. Round debrief is generated (per-round, same process as standalone — see §9)
2. A **Haiku call** distils the debrief into 3–5 concise signal sentences focused on thinking patterns and blind spots. These are appended to `interview_loops.cross_round_memory`.
3. When the next round starts, `cross_round_memory` is injected into the system prompt as a **second uncached system block** using the existing `createCachedMessageMultiSystem` pattern:

```
[PRIOR ROUND CONTEXT]
You are Round {N} of {total} in a Full Loop for {target_company} {target_role}.

Signals from previous rounds:
- {signal_1}
- {signal_2}
- {signal_3}

Do not reference these rounds explicitly. Let them inform your probing questions.
```

The static persona prompt stays cached. Only the context block is dynamic. No additional cache cost per turn.

---

## 9. Grading Architecture

### 9.1 Per-round grading (unchanged from today)

| Discipline | Grading model | Trigger | Output table |
|---|---|---|---|
| Product Sense | Haiku per-turn + Opus debrief | Round end | `live_interview_sessions.debrief_json` |
| System Design | Sonnet canvas grader | Canvas submission | `interview_grades` |
| Data Modeling | Sonnet canvas grader | Canvas submission | `interview_grades` |
| Coding | Sonnet code grader (new) | Code submission | `interview_grades` |

Per-round debrief is stored in `loop_rounds.round_debrief_json` (copy of the session-level debrief for loop rounds).

### 9.2 Loop-level debrief (new)

**Model:** `claude-sonnet-4-6`
**Trigger:** All rounds reach `completed` status → `POST /api/interview-loops/[id]/debrief`
**Input:**
- All `loop_rounds.round_debrief_json` entries
- `interview_loops.cross_round_memory`
- User `calibration_snapshot`
- `target_company`, `target_role`

**System prompt intent:** Synthesise patterns across rounds. Surface 1–2 cross-cutting insights. Give a hire signal. Do not average scores — weight by round relevance to the target role.

**Output shape (`loop_debrief_json`):**

```typescript
{
  hire_signal: 'hire' | 'lean_hire' | 'lean_no_hire' | 'no_hire',
  overall_score: number,           // 0-100, weighted not averaged
  round_scores: [{
    discipline: string,
    score: number,
    grade: string
  }],
  cross_round_insights: [{
    pattern: string,               // e.g. "Skips success metrics before proposing solutions"
    rounds_seen_in: string[],      // e.g. ['system_design', 'product_sense']
    observation: string            // 1-2 sentences
  }],
  strengths: string[],
  improvements: string[],
  next_3_challenges: [{ id: string, reason: string }]
}
```

---

## 10. Pause / Resume

### 10.1 Pause
`POST /api/live-interview/[id]/pause`
- Reads current `flow_coverage` + `conversation_memory` from session
- Writes them to `loop_rounds.pause_snapshot` along with `system_prompt_hash`
- Sets `live_interview_sessions.status = 'paused'`, `loop_rounds.status = 'paused'`, `interview_loops.status = 'paused'`
- Sets `loop_rounds.paused_at`

### 10.2 Resume
`POST /api/live-interview/[id]/resume`
- Reads `loop_rounds.pause_snapshot`
- Restores `conversation_memory` + `flow_coverage` on the session row
- Sets session + round + loop status back to `'active'`
- Sets `loop_rounds.resumed_at`
- Returns the full session object to the client

### 10.3 Client-side resume sequence
1. Dashboard resume card links to `/live-interviews/{session_id}`
2. Session page detects `status === 'paused'` → calls `/resume`
3. Re-fetches `live_interview_turns` → renders transcript from where user left off (existing system_prompt already stored on session row, no rebuild)
4. Hatch sends a generated reorientation message derived from `conversation_memory` — not a verbatim transcript replay

### 10.4 Tab-close behaviour inside a loop
Existing `sendBeacon` on `visibilitychange` currently marks sessions as `abandoned`. For loop sessions (`session.loop_id !== null`), `sendBeacon` calls `/pause` instead. Standalone sessions retain the existing abandon behaviour.

---

## 11. New API Routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/interview-loops/create` | Create loop + loop_rounds rows from Builder step 3 |
| GET | `/api/interview-loops/[id]` | Loop status, rounds, scores (dashboard card) |
| POST | `/api/interview-loops/[id]/start-round` | Advance to next round; creates `live_interview_sessions` with `prior_round_context` injected |
| POST | `/api/interview-loops/[id]/debrief` | Trigger Sonnet loop debrief once all rounds complete |
| POST | `/api/live-interview/[id]/pause` | Save pause_snapshot, set statuses to paused |
| POST | `/api/live-interview/[id]/resume` | Restore from pause_snapshot, set statuses to active |

Existing `/api/live-interview/[id]/end` is extended: if `session.loop_id` is set, after generating the per-round debrief it also runs the Haiku distillation and appends to `cross_round_memory`, then checks if all rounds are complete to trigger the loop debrief.

---

## 12. Dashboard — Paused Loop Resume Card

When a loop is in `paused` status, a resume card appears on the dashboard (above the Quick Take card):

- Dark card (`#2e3230`)
- Amber "Loop paused" indicator
- Loop title + "Round N of M — [Discipline] · N min in"
- Round progress chips (✓ completed, ⏸ paused, muted pending)
- "Resume Round N →" primary CTA

---

## 13. Model Selection Summary

| Component | Model | Rationale |
|---|---|---|
| Per-turn FLOW move detection | `claude-haiku-4-5-20251001` | Fast classification, fire-and-forget |
| Per-turn grade-turn | `claude-haiku-4-5-20251001` | Low latency, structured output |
| Product Sense round debrief | `claude-opus-4-6` | Highest-stakes grading (unchanged) |
| Canvas grading (Sys Design / Data Modeling) | `claude-sonnet-4-6` | Structured rubric, sufficient for canvas |
| Coding round grading | `claude-sonnet-4-6` | New; structured rubric |
| Cross-round memory distillation | `claude-haiku-4-5-20251001` | Compression task, 3–5 sentences |
| **Loop-level debrief** | **`claude-sonnet-4-6`** | Synthesis over structured inputs; Opus not justified |

---

## 14. Out of Scope (this spec)

- Calibration redesign for multi-discipline (separate spec)
- Quick Takes for System Design / Data Modeling / Coding (separate spec)
- Progress page multi-discipline skill tracking (separate spec)
- Coding workspace (Monaco editor) — dependency for Coding discipline challenges; separate spec
- Human interviewer pool for live loops
- Loop recording / replay
