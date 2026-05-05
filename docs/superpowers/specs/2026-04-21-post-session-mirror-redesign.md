# PostSessionMirror Redesign

**Date:** 2026-04-21  
**Status:** Approved

## Context

The current PostSessionMirror screen has three problems:
1. Raw internal option IDs (e.g. `HP-BRIEF-FICT-B2B-TRAD-MOD6-DEVOPS-001-FRAME-Q3-B`) are shown to users instead of human-readable labels.
2. The per-step option display breaks for steps with more than one question — there's no structure to disambiguate which question an option belongs to.
3. Hatch coaching text overflows its card without proper truncation.

The redesign replaces the current per-option inline display with a two-level pattern: a compact summary card per step, and a paginated modal for full drill-down.

## Files Affected

- `src/components/v2/PostSessionMirror.tsx` — primary rewrite target
- `src/components/v2/StepDetailModal.tsx` — new component (extracted from PostSessionMirror)

## Design

### Summary Screen

**Score strip** (top of screen):
- Total score (large, primary green)
- Grade pill: STRONG / PARTIAL / NEEDS WORK
- XP earned badge

**Step cards grid** (2×2):

Each of the 4 FLOW steps (Frame, List, Optimize, Win) gets a card. Card contents:
- Step number (01–04) + step name + verdict badge (CLEAN / PARTIAL / MISSED)
- Choice chips row: compact `Q1 · Option B` chips, one per question answered in that step. For single-question steps, just `Option B`. Uses `selectedOptionId` from `StepResult` and question index from `StepAttemptRecord[]`.
- Hatch coaching excerpt: 2 lines max, truncated with `-webkit-line-clamp: 2`. Source: `StepResult.reasoning` or `StepResult.lumaSignal`.
- Footer: primary competency tag (from `StepResult.competency_signal.primary`) + "Full detail ›" text link.
- Entire card is clickable → opens `StepDetailModal` for that step.

### Step Detail Modal

Opens on card click. Covers:

**Header:**
- Step badge (e.g. "Frame"), step title (e.g. "Identify the real problem"), verdict badge, close (✕) button.

**Question tab bar** (hidden when step has only 1 question):
- Tabs labelled Q1, Q2, Q3… One per question in the step.
- Active tab highlighted. Clicking a tab navigates to that question.

**Per-question page** (one at a time, paginated):
- Question text (full, not truncated)
- Options list, sorted by quality: Best → Good (good_but_incomplete) → Surface → Misleading (plausible_wrong)
  - User's selected option highlighted with border + background tint + "← your pick" label
  - Quality badge on each option: Best (green) / Good (blue) / Surface (amber) / Misleading (red)
- Explanation box: explanation for the selected option only (from `FlowOption.explanation`)
- Framework hint box: `FlowOption.framework_hint` if present, else `StepResult.competency_signal.framework_hint`

**Navigation:**
- Prev / Next buttons. Prev disabled on Q1. Next button becomes "Close" on the last question.
- Smooth CSS transition between questions (slide or fade).

### Option Label Format

| Scenario | Display |
|---|---|
| Step has 1 question | `Option B` |
| Step has multiple questions | `Q2 · Option B` |

Never show internal DB IDs. Derive option letter from `FlowOption.option_label` (already `A`/`B`/`C`/`D`).

## Data Flow

`PostSessionMirror` already receives `stepResults: StepResult[]` and `attemptRecords: StepAttemptRecord[]`. To render choice chips:
1. Group `attemptRecords` by `step`.
2. For each record, look up `selected_option_id` and map to option letter via `FlowOption.option_label`.
3. If the step group has >1 record, prefix with `Q{n} ·`.

`StepDetailModal` receives:
- `step: FlowStep`
- `stepResult: StepResult`
- `questions: { questionText: string; options: FlowOption[]; selectedOptionId: string }[]`
- `onClose: () => void`

## Component Extraction

`StepDetailModal` is a new file at `src/components/v2/StepDetailModal.tsx`. It is a pure presentational component — no data fetching, no side effects. Accepts the props above and manages its own `currentQ` state internally.

## Verification

1. Run `npm run dev`, navigate to a completed FLOW challenge feedback screen.
2. Confirm no raw IDs appear anywhere on the summary cards.
3. For a step with 1 question: chip shows `Option B` (no Q prefix).
4. For a step with multiple questions: chips show `Q1 · Option B`, `Q2 · Option C`.
5. Hatch text clips at 2 lines — no overflow.
6. Click a card → modal opens. Tab bar hidden for single-question steps, visible for multi.
7. Options are sorted Best → Good → Surface → Misleading.
8. User's pick is highlighted; explanation and framework hint render below.
9. Prev disabled on Q1; Next becomes "Close" on last question.
10. Run `npx tsc --noEmit` — no new errors.
