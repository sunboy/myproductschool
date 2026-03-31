## Luma Brain — Personalized Context Architecture

**Status:** Stubbed in `src/lib/v2/luma-context.ts`
**Why deferred:** Full implementation requires architectural decisions not yet made.

### What the stub does now
- Fetches latest 3 `luma_context_v2` rows for the user
- Fetches `learner_competencies` to surface weakest area
- Returns a compact string injected into all AI prompts
- Fails open (returns empty string on error)

### What the full implementation needs
1. **Embedding strategy:** Decide on provider (Anthropic vs OpenAI). `flow_options` have an `embedding vector(1024)` column but nothing populates it yet.
2. **What to embed:** `luma_context_v2.content`, `step_attempts.grading_explanation`, user notes.
3. **Retrieval function:** A Postgres RPC `match_luma_context(user_id, query_embedding, match_count)` using pgvector.
4. **Context assembly:** Ranked, token-budgeted context from competency profile + past insights + notes + career signals.
5. **Staleness / expiry:** `luma_context_v2.expires_at` exists but nothing sets it.
6. **Cross-surface injection:** Dashboard, coaching, grading, nudge resolver — all should pull from the same function.
