## Stripe — Needs Valid Secret Key

**Status:** Blocked on valid API key
The current key (`mk_1Pnt7sEGJUB78L7naxFkCSLi`) is not a standard Stripe format and is rejected by the API.

Get the real secret key from: **Stripe Dashboard → Developers → API keys → Secret key** (starts with `sk_live_` or `sk_test_`)

Once available:
1. Update `STRIPE_SECRET_KEY` in `.env.local`
2. Run `stripe listen --api-key sk_... --forward-to localhost:3000/api/stripe/webhook` to get `STRIPE_WEBHOOK_SECRET`
3. Update `STRIPE_WEBHOOK_SECRET` in `.env.local`
4. Set both in production env (Vercel)

See `stripe.md` for full setup details.

---

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

## Deferred: Go Deeper Conversation Mode (Autopsy)

**Status:** Not started
**Why deferred:** Deprioritized in autopsy v1 to focus on Hack Stories.

After answering an autopsy challenge, offer a 3-turn Luma coaching exchange via Claude API.

### What to build
- Edge function `autopsy-deeper` (POST): takes challengeId, userAnswer, gradingResult, conversationHistory
- System prompt per challenge seeded alongside challenge content
- Conversation state machine: COMPLETE → CONVERSATION (max 3 turns) → SYNTHESIS
- UI: Luma insight card expands with a chat input below
- Model: claude-sonnet-4-6 (same as coaching endpoints)

See original spec section 10 for full system prompt template and API response schema.
