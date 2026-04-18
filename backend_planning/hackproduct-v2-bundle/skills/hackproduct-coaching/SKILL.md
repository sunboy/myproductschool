---
name: hackproduct-coaching
description: "Luma coaching system for HackProduct. Covers role-contextualized nudges, post-answer coaching, and career signals. Use when building the coaching endpoint, nudge resolver, role context generator, or any Luma feedback code. Also for coaching_cache, role_lenses, or luma_context_v2. Triggers on: coaching, nudge, Luma, role context, career signal, feedback, coaching cache, role lens."
---

# HackProduct Coaching System (Luma)

Luma appears at three moments: before answering (nudge), after answering (role coaching), and across sessions (stored context).

## 1. Nudge Resolution (deterministic, no AI)

```typescript
export function resolveNudge(baseNudge: string | null, step: FlowStep, roleLens: RoleLens): string {
  const roleNudge = roleLens[`${step}_nudge`] as string | null
  if (!baseNudge && !roleNudge) return ''
  if (!roleNudge) return baseNudge ?? ''
  if (!baseNudge) return roleNudge
  return `${baseNudge}\n\n💡 As a ${roleLens.short_label}: ${roleNudge}`
}
```

The `role_lenses` table has 40 nudge templates (10 roles × 4 steps), seeded in migration. Base nudge comes from `flow_steps.step_nudge`.

## 2. Post-Answer Role Coaching (AI, cached)

### API: `POST /api/v2/challenges/[id]/coaching`

Request: `{ attempt_id, question_id, step }`
Response: `{ role_context, career_signal, cached }`

### Cache-first pattern

```typescript
const cacheKey = `${challengeId}:${step}:${questionId}:${optionId}:${roleId}`
const { data: cached } = await admin.from('coaching_cache')
  .select('role_context, career_signal').eq('cache_key', cacheKey).single()
if (cached) {
  await admin.from('coaching_cache')
    .update({ hit_count: cached.hit_count + 1, last_hit_at: new Date().toISOString() })
    .eq('cache_key', cacheKey)
  return { ...cached, cached: true }
}
```

### Claude prompt for coaching

```
The learner is a {{role_label}} who just answered the {{step}} step.
Challenge: {{scenario_context}} {{scenario_trigger}}
They selected: "{{selected_option_text}}" ({{quality_label}})
Best answer: "{{best_option_text}}"
Explanation: {{static_explanation}}

Write two short paragraphs:
1. "role_context" (2-3 sentences): Connect their answer to a specific situation a {{role_label}} actually runs into. Name the situation concretely.
2. "career_signal" (1 sentence): What this reasoning gap or strength means for their work. Be specific, not motivational.

Tone: Direct. A senior {{role_label}} talking to someone earlier in their career. No padding, no praise for weak answers, no hedging.
Return ONLY JSON: {"role_context":"...","career_signal":"..."}
```

Model: `claude-sonnet-4-6`, max_tokens: 500. Store result in `coaching_cache` + `step_attempts`.

## 3. Luma Context (persistent memory)

Insert after challenge completion:
```typescript
await admin.from('luma_context_v2').insert({
  user_id: userId, context_type: 'challenge_insight',
  content: `Scored ${totalScore}/3 on "${title}". Gap: ${weakest}.`,
  metadata: { challenge_id, total_score, competency_deltas },
})
```

## LumaGlyph States

- Nudges: `<LumaGlyph state="speaking" size={32} />`
- Coaching loading: `<LumaGlyph state="reviewing" size={32} />`
- Results: `<LumaGlyph state="celebrating" size={48} />`
- Dashboard: `<LumaGlyph state="idle" size={48} />`

## Files This Skill Produces

```
src/lib/v2/skills/nudge-resolver.ts
src/lib/v2/skills/ai/role-context-gen.ts
src/app/api/v2/challenges/[id]/coaching/route.ts
```
