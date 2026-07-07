---
name: hackproduct-challenge-delivery
description: "Challenge delivery system for HackProduct. Covers listing, filtering, loading FLOW steps, managing attempts, and the workspace state machine. Use when building challenge list API, detail API, step loading, attempt management, workspace page, or FlowStepper. Triggers on: challenge list, detail, load step, start attempt, resume, workspace, FLOW stepper, taxonomy filters, option shuffling, state machine."
---

# HackProduct Challenge Delivery

## Challenge Discovery: `GET /api/v2/challenges`

```sql
SELECT c.*, COUNT(a.id) as attempt_count, MAX(a.total_score) as best_score,
  BOOL_OR(a.status = 'completed') as is_completed
FROM challenges c
LEFT JOIN challenge_attempts_v2 a ON a.challenge_id = c.id AND a.user_id = $user_id
WHERE c.is_published = true
  AND ($paradigm IS NULL OR c.paradigm = $paradigm)
  AND ($role IS NULL OR $role = ANY(c.relevant_roles))
GROUP BY c.id
```

Query params: `paradigm`, `industry`, `role`, `difficulty`, `framework`, `company`, `page`, `limit`.

## Attempt Management: `POST /api/v2/challenges/[id]/start`

1. Check existing in-progress attempt → return it
2. Free tier daily limit (3/day)
3. Insert `challenge_attempts_v2` with `status: 'in_progress'`, `current_step: 'frame'`
4. Return `{ attempt_id, role_id, first_step: 'frame' }`

## Step Loading: `GET /api/v2/challenges/[id]/step/[step]`

**CRITICAL:** Strip `quality`, `points`, `explanation`, `competencies` from options.

Shuffle deterministically:
```typescript
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr]
  let s = seed
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const j = s % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
// Seed: hashtext(user_id + challenge_id + step) or use JS equivalent
```

Resolve nudge via `nudge-resolver.ts`. Check `step_attempts` for already-answered questions.

Response: `{ step, step_nudge, questions[{ id, text, nudge, options[{id, label, text}], already_answered }], progress }`

## Workspace State Machine

```typescript
type WorkspacePhase =
  | 'loading'
  | 'question'          // StepQuestion component
  | 'question_reveal'   // StepReveal after submit
  | 'step_summary'      // Step score before advancing
  | 'complete'          // ChallengeComplete

// Transitions:
// submit → question → question_reveal
// continue → more questions? → next question
// continue → step done? → step_summary
// continue from summary → next step's first question
// last step done → complete
```

Resume on refresh: read `attempt.current_step` + `current_question_sequence`.

## v1 vs v2 Conditional Rendering

```typescript
const isV2 = !isUUID(params.id) // v2 = TEXT like "HP-AG-FIN-GM-042"
if (isV2) return <FlowWorkspace challengeId={params.id} />
return <LegacyWorkspace challengeId={params.id} />
```

## Writing Style

All user-facing copy this skill produces (nudges, labels, status messages, UI strings, coaching fragments) follows the canonical HackProduct Writing Style Guide: [`docs/notes/writing-style-guide.md`](../../../../docs/notes/writing-style-guide.md), summarized in `CLAUDE.md` at the repo root.

**The hard rules to enforce here:**
- No second-person role framing in user-facing copy ("you are a tech lead", "as a senior engineer", "imagine you work at"). Role is metadata used for filtering, never rendered as copy.
- No em dashes. Use commas, periods, or restructure.
- No AI slop: *delve, leverage, utilize, holistic, robust, seamlessly, it's worth noting, in order to, as well as, embark on, navigate, unlock, landscape, tapestry, ensure, tailored, cutting-edge, revolutionary, game-changing*.
- Coherent sentences that flow together. Fragment-style prose reads as a speech, not writing. Exception: UI chrome like button labels where terse is correct.

Status messages and error states inherit the same tone: direct, specific, not apologetic.

## Files This Skill Produces

```
src/app/api/v2/challenges/route.ts
src/app/api/v2/challenges/[id]/route.ts
src/app/api/v2/challenges/[id]/start/route.ts
src/app/api/v2/challenges/[id]/step/[step]/route.ts
src/app/api/v2/roles/route.ts
src/hooks/useChallengeV2.ts
src/hooks/useFlowStep.ts
src/components/v2/FlowWorkspace.tsx
src/components/v2/FlowStepper.tsx
```
