# Hackproduct — Backend Agent Architecture
## Product Sense for Engineers

**Version**: v2.1 (embeddings layer added)
**Last Updated**: March 28, 2026
**Linear Epic**: SUN-167 (sub-issues SUN-168 through SUN-184)

---

## 1. System Overview

Hackproduct is an AI-graded product thinking platform for engineers. Users write freeform responses to real-world product challenges, and a multi-agent backend scores them across 5 dimensions, detects anti-patterns, surfaces transferable thinking patterns, and algorithmically serves the next best challenge.

The backend is designed around four core principles:

1. **Separation of concerns** — each agent is independently tunable. The interviewer needs to feel adversarial; the coach needs to feel supportive; the grader needs to be calibrated and fair.
2. **Compounding intelligence** — seven learning systems consume session events to make the platform better with every interaction.
3. **Semantic understanding** — a pgvector embeddings layer powers cross-challenge discovery, grader calibration, anti-pattern detection, and smarter recommendations.
4. **Cost efficiency** — model routing (Opus for scoring, Sonnet for conversation, Haiku for lightweight tracking) keeps per-session cost at ~$0.40, yielding ~79% gross margin on a $29/month plan.

---

## 2. The 5-Agent Architecture

Each agent has a distinct responsibility, model assignment, and interface contract.

### Agent 1 — The Interviewer

**Role**: Conducts the scenario session. Asks questions, pushes back, follows up.

**Model**: Claude Sonnet (conversational, low latency)

**Behavior**: Adapts based on user level — gentler at Level 1, tougher at Level 4+. Presents the scenario, guides through the 4 thinking moves, and presses for specificity.

**Context**: Has the full scenario brief, the user's skill profile (Learner DNA), and per-step rubric expectations.

**Cost**: ~$0.04/session (~8K tokens in, ~2K out across ~8 exchanges)

### Agent 2 — The Coach (Luma)

**Role**: Generates contextual hint cards and nudges during sessions.

**Model**: Claude Haiku (lightweight, fast, cheap)

**Behavior**: Monitors user responses in real-time. Triggers on: imprecise terms, missed analytical angles, getting stuck for >60 seconds.

**Throttle**: Fewer cards at higher levels (adaptive difficulty). Level 1-2: up to 3 hints. Level 3-4: 1 hint max. Level 5: none unless explicitly requested.

**Identity**: Non-human, non-gendered AI coach. Forest green gradient strip is the single dark design element. Visual presence is minimal — the user should feel coached, not watched.

**Cost**: ~$0.006/session (~1K in, ~200 out per message)

### Agent 3 — The Grader

**Role**: Post-step scoring and debrief generation.

**Model**: Claude Opus (highest accuracy for evaluation)

**Behavior**: Receives the step-specific grading rubric + user's response. Returns structured JSON with scores, anti-pattern detections, recommended answer, thinking pattern, and interview tip.

**Calibration**: At launch, calibrated against 5 expert-scored transcripts per challenge. By month 6, calibrated against 47+ high-confidence data points from challenges, expert re-scoring, and score distribution monitoring. Target accuracy: ±0.3 on a 5-point scale (down from ±0.8 at launch). Challenge overturn rate target: <8%.

**Cost**: ~$0.30/session (~12K in, ~3K out, single call per step)

**Output Contract**:
```json
{
  "scores": {
    "problem_reframe": 4,
    "user_segmentation": 5,
    "data_reasoning": 3,
    "tradeoff_clarity": 4,
    "communication": 2
  },
  "anti_patterns": ["adversarial"],
  "feedback": "Your analysis is strong but your recommendation reads like a post-mortem, not a strategic proposal.",
  "recommended": "The recommended answer text...",
  "thinking_pattern": {
    "title": "Build On, Don't Tear Down",
    "body": "When redirecting a stakeholder, start from their insight and extend it."
  },
  "interview_tip": "Before I'd agree to simplify, I'd segment the tickets by type..."
}
```

### Agent 4 — The Curator

**Role**: Recommends next scenarios, drills, and concepts.

**Model**: Rule-based at launch → Claude Sonnet at scale → collaborative filtering at 1K+ users

**Behavior**: Weighted toward weakest dimensions + spaced repetition. Factors in: goal (interview prep vs on-the-job growth), company targets, time commitment preference, and role.

**Personalization**: Uses the Learner DNA profile (see Section 5) to select challenges that target the user's specific gaps.

**Evolution**: Three stages:
- **Launch**: Rule-based (weakest dimension → matching challenge)
- **1K users**: Collaborative filtering ("users similar to you improved most on these challenges")
- **10K users**: Outcome-optimized ("the practice path with the highest pass rate for Google L5 is these 12 challenges in this sequence")

### Agent 5 — The What-If Generator

**Role**: Creates plot twists and constraint changes mid-challenge.

**Model**: Claude Sonnet

**Behavior**: Takes the user's proposal and flips a variable. Twists are designed to test DIFFERENT skills than the main scenario — if the main tested User Empathy, the twist tests Prioritization.

**Design rule**: Twists should feel unfair in a way real work feels unfair. "Your PM just told you the deadline moved up 2 weeks" is a valid twist. "An alien invasion changes market conditions" is not.

---

## 3. The 5 Grading Dimensions

Every step in every challenge gets scored on 5 dimensions (1-5 each). These replace the v1 4-dimension ProductIQ system.

| Dimension | Color | What It Measures |
|-----------|-------|------------------|
| Problem Reframing | Blue #5eaeff | Did they see past the surface to the real tension? |
| User Segmentation | Green #2dd4a0 | Did they break users into meaningful groups? |
| Data Reasoning | Cyan #22d3ee | Did they use data to support, not just assert? |
| Tradeoff Clarity | Amber #f59e0b | Did they name what they're giving up? |
| Communication | Purple #a78bfa | Could a non-technical stakeholder follow this? |

**Scoring rubric**: 5 = expert-level (identifies core tension, multi-axis behavioral segments, specific data-backed argument, explicit tradeoff with quantification, structured and persuasive). 3 = partial (restates some nuance, basic split, mentions data vaguely, vague risks, has ideas but disorganized). 1 = below threshold (restates given framing, treated as monolith, opinion only, presented as obvious, unclear).

---

## 4. Anti-Pattern Detection System (Named Traps)

The Grader agent detects specific thinking errors and returns them by ID. Each trap has a name, description, and a specific rewrite showing how to fix it.

| Trap ID | Name | Description | Fix |
|---------|------|-------------|-----|
| `surface_restatement` | Surface-Level Restatement | Restated the PM's solution as the problem | Identify the underlying tension instead |
| `aggregate_fallacy` | Aggregate Fallacy | Treated all users as one group | Segment by behavior before deciding |
| `confirmation_bias` | Confirmation Bias | Forced data to fit the proposed solution | Let data challenge the hypothesis |
| `data_delay` | Data Delay | Called for research when signals already exist | Act on available signal, validate in parallel |
| `metric_tunnel` | Metric Tunnel Vision | Optimized dashboard metric over business outcome | Trace the metric to real business impact |
| `abdication` | Abdication | Presented data without a recommendation | Always pair data with a specific recommendation |
| `adversarial` | Adversarial Framing | Was right but positioned it as an attack | Build on their insight, then redirect |
| `premature_solution` | Premature Solution | Jumped to a fix before understanding the problem | Understand the problem fully first |
| `model_product_gap` | Model-Product Gap | Confused model performance with product success | Ask: what user behavior actually changed? |
| `over_autonomy` | Over-Autonomy | Gave the AI/agent too much unsupervised power | Match autonomy level to error cost |

**Implementation**: Store trap definitions in a `thinking_traps` table or JSON config. The grading rubric for each step specifies which traps to check via their IDs. The Grader agent returns detected trap IDs in the `anti_patterns` array.

**Spaced repetition for traps**: Trigger AGGREGATE FALLACY once, and a segmentation-focused challenge resurfaces at 3, 7, and 14 days. Not considered "learned" until dodged 3 consecutive times.

---

## 5. Learner DNA (Personalization Layer)

The Learner DNA is the user's evolving skill profile. It drives agent behavior, challenge serving, and difficulty calibration.

### Profile Components

| Component | Source | Updates |
|-----------|--------|---------|
| Role | Onboarding (SWE, Data, ML, DevOps, EM, Founding, PM) | Manual |
| Goal | Onboarding (interview prep vs on-the-job) | Manual |
| Dimension scores | Grader agent output, per dimension | Per challenge |
| Move levels | Aggregated from dimension scores | Per challenge |
| Anti-pattern history | Grader detections over time | Per step |
| Thinking Archetype | Computed from radar shape | Per 5 challenges |
| Company targets | User settings (Google, Meta, etc.) | Manual |
| Time commitment | User settings (10min/day, 30min/day, etc.) | Manual |

### Thinking Archetypes

Derived from the shape of the 5-dimension radar:

| Archetype | Pattern | Identity Hook |
|-----------|---------|---------------|
| The Analyst | High Frame + Split, low Sell | "I diagnose perfectly but can't get buy-in" |
| The Diplomat | High Sell, low Frame | "I get alignment but sometimes on the wrong thing" |
| The Generalist | Balanced across all | "Solid everywhere, exceptional nowhere" |
| The Architect | All high | "Full-stack thinker" |

Archetypes update every 5 challenges and are displayed on the Progress tab, profile header, and shareable cards.

### Move Levels (replacing flat radar scores)

Each of the 4 thinking moves (Frame, Split, Weigh, Sell) has its own level (1-5):

- **Level 1**: 3 challenges scoring 3+
- **Level 2**: 5 challenges scoring 3.5+
- **Level 3**: 7 challenges scoring 4+
- **Level 4**: 10 challenges scoring 4+ with zero anti-patterns
- **Level 5**: Mastery

XP awarded per graded step: Score 1-2 = 5 XP, Score 3 = 10 XP, Score 4 = 20 XP, Score 5 = 30 XP. Bonus +10 for dodging a previously-triggered trap. +15 for completing all steps.

---

## 6. Grading Rubric Architecture

Each challenge step has a custom grading rubric — a system prompt sent to the Grader agent along with the user's response.

### Rubric Structure

```
RUBRIC = function(challenge_context) → system_prompt
```

The rubric specifies:

1. **Context** — the full challenge scenario text
2. **Step focus** — what this specific step should demonstrate
3. **Per-dimension scoring criteria** — what 1/5 vs 5/5 looks like for this step
4. **Anti-patterns to detect** — which trap IDs to check (subset of the 10)
5. **Recommended answer** — the strong response (used for comparison, not displayed until after grading)
6. **Thinking pattern** — title + body, the transferable concept this step teaches

### Example Rubric (buildRubric function)

```
You are a senior product thinking evaluator grading an engineer's response.

CONTEXT: {scenario_text}
STEP FOCUS: {step_description}

Grade on 5 dimensions (1-5 each):
- problem_reframe: 5=identified core tension. 3=partial. 1=restated given framing.
- user_segmentation: 5=multi-axis behavioral segments. 3=basic split. 1=monolith.
- data_reasoning: 5=specific data-backed argument. 3=mentioned data vaguely. 1=opinion only.
- tradeoff_clarity: 5=explicit tradeoff with quantification. 3=vague risks. 1=presented as obvious.
- communication: 5=structured, concise, persuasive. 3=has ideas but disorganized. 1=unclear.

ANTI-PATTERNS to detect (return IDs): {trap_ids}
RECOMMENDED ANSWER: {recommended_answer}
THINKING PATTERN: Title: "{pattern_title}" Body: "{pattern_body}"

Respond ONLY with valid JSON, no markdown fences:
{output_schema}
```

### Storage

Store rubrics as structured data in a `challenge_step_rubrics` table or as JSON within the challenge step record. The rubric is a function that takes the challenge scenario as input and returns the complete grading prompt — this allows rubrics to reference scenario-specific data (e.g., specific numbers from the scenario).

---

## 7. The 4 Thinking Moves Framework

v2 simplifies from 6 frameworks to 4 universal thinking moves. Every challenge guides the user through some or all of these:

| Move | Color | What It Teaches | Old Framework Mapping |
|------|-------|-----------------|----------------------|
| **Frame** | Blue #60a5fa | See past the surface to the real problem | UNPACK Steps 1-4 |
| **Split** | Green #34d399 | Segment users, decompose, find the wedge | UNPACK Steps 5-6 + Segmentation |
| **Weigh** | Amber #fb923c | Name tradeoffs, use data, make the call | RICE, Prioritization |
| **Sell** | Purple #c084fc | Communicate so a VP follows it | Stakeholder Management, Communication |

---

## 8. Content Architecture

### 8.1 Four Paradigms

| Paradigm | Color | Icon | Target Problems |
|----------|-------|------|-----------------|
| Traditional | Green #4ade80 | 🏗️ | Build the right thing (~150 problems) |
| AI-Assisted | Blue #60a5fa | 🤖 | Use AI tools without losing judgment (~50) |
| Agentic | Purple #c084fc | ⚡ | Design systems where agents act (~70) |
| AI-Native | Orange #fb923c | 🧬 | Products that couldn't exist without AI (~70) |

### 8.2 Role Tagging

Every challenge is tagged with 1-3 roles. This drives filtering, study plan personalization, and the "this challenge is for YOU" signal.

| Role | Tag | Color |
|------|-----|-------|
| Software Engineer | SWE | Blue #5eaeff |
| Data Engineer | Data | Cyan #22d3ee |
| ML Engineer | ML | Purple #a78bfa |
| DevOps / SRE | DevOps | Orange #f59e0b |
| Eng Manager | EM | Yellow #fbbf24 |
| Founding Engineer | Founding | Green #2dd4a0 |
| Product Manager | PM | Pink #f472b6 |

### 8.3 Study Plans

7 pre-built study plans at launch: Staff Engineer Path (6 weeks), 7-Day Interview Prep, AI Product Fluency, Data Eng → Product, EM Product Leadership, Founding Engineer, DevOps → Product Impact.

---

## 9. Data Model

### 9.1 Core Tables

```sql
-- Challenges
challenges
  id              uuid PRIMARY KEY
  title           text NOT NULL
  paradigm        enum(traditional, ai_assisted, agentic, ai_native)
  difficulty      enum(easy, medium, hard)
  scenario        text NOT NULL
  scenario_embedding vector(512)     -- pgvector: scenario semantic fingerprint
  domain_id       uuid REFERENCES domains
  created_at      timestamptz

-- Challenge Steps (one per thinking move per challenge)
challenge_steps
  id              uuid PRIMARY KEY
  challenge_id    uuid REFERENCES challenges
  move            enum(frame, split, weigh, sell)
  step_index      int
  prompt          text NOT NULL
  hint            text
  recommended     text NOT NULL
  recommended_embedding vector(512)  -- pgvector: recommended answer semantic fingerprint
  pattern_title   text NOT NULL
  pattern_body    text NOT NULL
  pattern_embedding vector(512)      -- pgvector: thinking pattern semantic fingerprint
  trap_ids        text[]            -- which anti-patterns to check

-- Challenge-Role Join
challenge_roles
  challenge_id    uuid REFERENCES challenges
  role_id         uuid REFERENCES roles
  PRIMARY KEY (challenge_id, role_id)

-- Roles
roles
  id              uuid PRIMARY KEY
  tag             text UNIQUE       -- 'swe', 'data', etc.
  label           text
  color           text

-- Topics (nested under paradigms)
topics
  id              uuid PRIMARY KEY
  paradigm        enum(traditional, ai_assisted, agentic, ai_native)
  label           text
  description     text

-- Challenge-Topic Join
challenge_topics
  challenge_id    uuid REFERENCES challenges
  topic_id        uuid REFERENCES topics
  PRIMARY KEY (challenge_id, topic_id)

-- Thinking Traps (anti-patterns)
thinking_traps
  id              text PRIMARY KEY  -- 'aggregate_fallacy', etc.
  name            text
  description     text
  fix_suggestion  text
  exemplar_embedding vector(512)    -- pgvector: canonical example of this trap
```

### 9.2 User & Session Tables

```sql
-- User Profiles
profiles
  id              uuid PRIMARY KEY (references auth.users)
  email           text
  role_id         uuid REFERENCES roles
  goal            enum(interview_prep, on_the_job)
  archetype       text              -- 'analyst', 'diplomat', etc.
  created_at      timestamptz

-- Sessions (one per challenge attempt)
sessions
  id              uuid PRIMARY KEY
  user_id         uuid REFERENCES profiles
  challenge_id    uuid REFERENCES challenges
  status          enum(in_progress, completed, abandoned)
  duration_sec    int
  started_at      timestamptz
  completed_at    timestamptz

-- Evaluations (grading results per step)
evaluations
  id              uuid PRIMARY KEY
  session_id      uuid REFERENCES sessions
  step_index      int
  user_response   text              -- raw user text (stored for embeddings + calibration)
  response_embedding vector(512)    -- pgvector: user response semantic fingerprint
  scores          jsonb             -- {problem_reframe: 4, ...}
  anti_patterns   text[]            -- detected trap IDs
  feedback        text
  recommended     text
  thinking_pattern jsonb            -- {title, body}
  interview_tip   text
  model_used      text
  created_at      timestamptz

-- Aggregated Skill Scores (rolling per dimension)
skill_scores
  user_id         uuid REFERENCES profiles
  dimension       text              -- 'problem_reframe', etc.
  score           float             -- rolling weighted average
  level           int               -- 1-5
  sessions_count  int
  trend           float             -- change over last 5 sessions
  updated_at      timestamptz
  PRIMARY KEY (user_id, dimension)

-- XP Log
user_xp_log
  id              uuid PRIMARY KEY
  user_id         uuid REFERENCES profiles
  challenge_id    uuid REFERENCES challenges
  step_index      int
  xp_earned       int
  reason          text              -- 'score_5', 'trap_dodged', etc.
  created_at      timestamptz

-- Streaks
user_streaks
  user_id         uuid REFERENCES profiles PRIMARY KEY
  current_streak  int DEFAULT 0
  longest_streak  int DEFAULT 0
  freeze_count    int DEFAULT 0
  last_active_date date

-- Anti-Pattern History (for spaced repetition)
user_trap_history
  id              uuid PRIMARY KEY
  user_id         uuid REFERENCES profiles
  trap_id         text REFERENCES thinking_traps
  triggered_at    timestamptz
  dodged_at       timestamptz       -- NULL if not yet dodged
  consecutive_dodges int DEFAULT 0  -- "learned" at 3

-- Study Plans
study_plans
  id              uuid PRIMARY KEY
  title           text
  description     text
  duration_weeks  int
  role_id         uuid REFERENCES roles  -- NULL if universal

study_plan_chapters
  id              uuid PRIMARY KEY
  plan_id         uuid REFERENCES study_plans
  week_number     int
  title           text

study_plan_items
  id              uuid PRIMARY KEY
  chapter_id      uuid REFERENCES study_plan_chapters
  challenge_id    uuid REFERENCES challenges
  order_index     int
```

### 9.3 Community & Learning Tables

```sql
-- Community Approaches (anonymized high-score submissions)
community_approaches
  id              uuid PRIMARY KEY
  challenge_id    uuid REFERENCES challenges
  session_id      uuid REFERENCES sessions
  summary         text              -- AI-generated summary
  summary_embedding vector(512)     -- pgvector: for cross-challenge similarity search
  score           float
  upvotes         int DEFAULT 0
  published_at    timestamptz

-- Quick Takes (60-second daily challenges)
quick_takes
  id              uuid PRIMARY KEY
  scenario_text   text
  paradigm        enum(traditional, ai_assisted, agentic, ai_native)
  move            enum(frame, split, weigh, sell)
  active_date     date              -- when this Quick Take is served
```

---

## 9.4 Embeddings Layer (pgvector)

### Why Embeddings

The agent architecture handles real-time grading and coaching. The embeddings layer handles the slower, compounding intelligence — semantic search, calibration drift detection, cross-challenge pattern discovery, and smarter recommendations. It's the difference between "here's your score" and "here's how your thinking compares to 500 other engineers who faced a similar problem."

### Embedding Model

| Option | Dimensions | Cost | Notes |
|--------|-----------|------|-------|
| **Voyage AI `voyage-3-lite`** (recommended) | 512 native | $0.02/1M tokens | Optimized for retrieval, avoids second vendor dependency if using Anthropic partnership |
| OpenAI `text-embedding-3-small` | 1536 → truncate to 512 | $0.02/1M tokens | Matryoshka-capable, widely used |
| Cohere `embed-english-v3.0` | 1024 → truncate to 512 | $0.10/1M tokens | Highest quality but 5x cost |

**Decision: 512 dimensions.** For a platform with thousands (not millions) of documents, 512 is more than sufficient for accurate semantic matching. Cuts storage by 3x versus full-dimension vectors and speeds up all similarity calculations proportionally.

**Cost at scale:** ~340 challenges × 4 steps × ~200 tokens/response = ~272K tokens to embed all content. At $0.02/1M tokens, that's less than $0.01. Per-session embedding cost (one user response per step, ~4 steps): ~$0.00004. Negligible.

### Infrastructure

pgvector is a native Supabase extension — no additional infrastructure. Enable it with:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Schema: New Columns Summary

| Table | Column | Type | What Gets Embedded |
|-------|--------|------|-------------------|
| `challenges` | `scenario_embedding` | vector(512) | Full scenario text |
| `challenge_steps` | `recommended_embedding` | vector(512) | The recommended (strong) answer |
| `challenge_steps` | `pattern_embedding` | vector(512) | Thinking pattern title + body concatenated |
| `thinking_traps` | `exemplar_embedding` | vector(512) | Canonical example text of the anti-pattern |
| `evaluations` | `response_embedding` | vector(512) | User's freeform response text |
| `community_approaches` | `summary_embedding` | vector(512) | AI-generated summary of the approach |

### Indexes

```sql
-- IVFFLAT indexes for approximate nearest neighbor search
-- Use ivfflat over hnsw: lower memory, faster builds, good enough for <100K rows

-- Challenge similarity (for "related challenges" and Curator recommendations)
CREATE INDEX idx_challenges_scenario_embedding
  ON challenges USING ivfflat (scenario_embedding vector_cosine_ops)
  WITH (lists = 20);

-- Response similarity (for calibration + community approaches)
CREATE INDEX idx_evaluations_response_embedding
  ON evaluations USING ivfflat (response_embedding vector_cosine_ops)
  WITH (lists = 50);

-- Community approach similarity (cross-challenge "how others solved it")
CREATE INDEX idx_community_approaches_embedding
  ON community_approaches USING ivfflat (summary_embedding vector_cosine_ops)
  WITH (lists = 30);

-- Thinking pattern search (user's personal pattern library)
CREATE INDEX idx_challenge_steps_pattern_embedding
  ON challenge_steps USING ivfflat (pattern_embedding vector_cosine_ops)
  WITH (lists = 20);

-- Anti-pattern exemplar matching (secondary grading signal)
CREATE INDEX idx_thinking_traps_exemplar_embedding
  ON thinking_traps USING ivfflat (exemplar_embedding vector_cosine_ops)
  WITH (lists = 5);
```

**Index tuning note:** `lists` parameter = sqrt(row_count) is the rule of thumb. Start low, increase as tables grow. At <1K rows, a sequential scan is faster than the index — pgvector will auto-choose. The indexes become useful past ~1K evaluations.

### Embedding Pipeline

Embeddings are generated asynchronously — never in the critical path of the user experience.

```
User submits response
  → Grader scores immediately (real-time, no embedding needed)
  → Score revealed to user
  → ASYNC: embed response text → store in evaluations.response_embedding
  → ASYNC: if score >= 4.0, generate community approach summary → embed → store
```

**When embeddings are computed:**

| Event | Trigger | Latency Requirement |
|-------|---------|-------------------|
| User response submitted | After grading complete | Async (< 2s, non-blocking) |
| Challenge created/edited | Admin action | Async (batch on save) |
| Community approach published | Score threshold met | Async (< 5s, non-blocking) |
| Trap exemplar updated | Admin action | Immediate (10 exemplars total) |
| Thinking pattern search | User searches pattern library | Sync (query-time, < 100ms) |

### Five Use Cases

**Use Case 1 — Community Approach Discovery (highest ROI)**

"Show me how other engineers approached this differently" — not just for the same challenge, but semantically similar responses across all challenges.

```sql
-- Find similar approaches across all challenges
SELECT ca.summary, ca.score, c.title AS challenge_title,
       1 - (ca.summary_embedding <=> $1) AS similarity
FROM community_approaches ca
JOIN challenges c ON ca.challenge_id = c.id
WHERE 1 - (ca.summary_embedding <=> $1) > 0.7
ORDER BY similarity DESC
LIMIT 5;
```

This is the "learn from the crowd" mechanic. A user who wrote a strong segmentation argument on one challenge can see related segmentation approaches from completely different scenarios. Makes the platform feel alive.

**Use Case 2 — Grader Calibration Drift Detection**

System 1 (Scorer Calibration) currently tracks challenge/overturn rates. With response embeddings, you can cluster semantically similar responses and check scoring consistency.

```sql
-- Find response pairs with high similarity but divergent scores
SELECT e1.id, e2.id,
       1 - (e1.response_embedding <=> e2.response_embedding) AS similarity,
       ABS((e1.scores->>'problem_reframe')::int -
           (e2.scores->>'problem_reframe')::int) AS score_gap
FROM evaluations e1
JOIN evaluations e2 ON e1.id < e2.id
  AND e1.step_index = e2.step_index
WHERE 1 - (e1.response_embedding <=> e2.response_embedding) > 0.90
  AND ABS((e1.scores->>'problem_reframe')::int -
          (e2.scores->>'problem_reframe')::int) >= 2
ORDER BY similarity DESC
LIMIT 20;
```

If two responses are 0.95 cosine similar but scored 2 and 4, that's a calibration flag. Run weekly as a batch job feeding System 1.

**Use Case 3 — Anti-Pattern Double-Check**

The Grader agent detects traps via LLM reasoning. Embeddings provide a second signal — compare the user's response against canonical trap exemplars.

```sql
-- Check user response against all trap exemplars
SELECT tt.id AS trap_id, tt.name,
       1 - (e.response_embedding <=> tt.exemplar_embedding) AS similarity
FROM evaluations e
CROSS JOIN thinking_traps tt
WHERE e.id = $1
  AND 1 - (e.response_embedding <=> tt.exemplar_embedding) > 0.75
ORDER BY similarity DESC;
```

If the LLM says "no traps" but the response is 0.88 similar to a known `aggregate_fallacy` exemplar, flag for review or log as a calibration data point. This catches false negatives without adding latency to the grading path (runs async).

**Use Case 4 — Thinking Pattern Semantic Search**

Users accumulate thinking patterns across challenges. "How did I learn to handle stakeholder pushback?" shouldn't require exact keyword matching.

```sql
-- Semantic search over user's collected thinking patterns
SELECT cs.pattern_title, cs.pattern_body, c.title AS challenge_title,
       1 - (cs.pattern_embedding <=> $1) AS similarity
FROM challenge_steps cs
JOIN challenges c ON cs.challenge_id = c.id
JOIN sessions s ON s.challenge_id = c.id AND s.user_id = $2
JOIN evaluations e ON e.session_id = s.id AND e.step_index = cs.step_index
WHERE s.status = 'completed'
ORDER BY similarity DESC
LIMIT 10;
```

The `$1` parameter is the embedding of the user's search query (embedded at query time). Returns their most semantically relevant patterns regardless of keyword overlap.

**Use Case 5 — Smarter Challenge Serving (Curator Agent)**

The Curator currently uses rule-based weakest-dimension matching. Embeddings add a "conceptual distance" signal — serve challenges that are in the user's weak zone but not so semantically distant that there's no transfer learning.

```sql
-- Find challenges semantically adjacent to user's recent work
-- but targeting their weakest dimension
WITH recent_responses AS (
  SELECT e.response_embedding
  FROM evaluations e
  JOIN sessions s ON e.session_id = s.id
  WHERE s.user_id = $1
  ORDER BY e.created_at DESC
  LIMIT 5
),
avg_embedding AS (
  SELECT AVG(response_embedding) AS centroid FROM recent_responses
)
SELECT c.id, c.title, c.paradigm, c.difficulty,
       1 - (c.scenario_embedding <=> ae.centroid) AS conceptual_proximity
FROM challenges c
CROSS JOIN avg_embedding ae
WHERE c.id NOT IN (SELECT challenge_id FROM sessions WHERE user_id = $1)
ORDER BY conceptual_proximity DESC
LIMIT 10;
```

The Curator agent then filters this list by weakest dimension and role match. The embedding gives "conceptual proximity" — the structured metadata gives "skill targeting." Together they produce better recommendations than either alone.

### Migration Strategy

**Phase 1 (launch):** Enable pgvector, add columns as nullable, embed all static content (challenges, steps, traps). No user-facing embedding features yet.

**Phase 2 (week 2-3):** Start embedding user responses async post-grading. Build community approach discovery UI.

**Phase 3 (month 2):** Activate calibration drift detection (System 1 enhancement). Wire thinking pattern search.

**Phase 4 (month 3+):** Feed embedding similarity into Curator agent. Activate anti-pattern double-check.

This sequencing means embeddings never block launch. They layer on as the data accumulates to make them useful.

All seven systems consume from a single event bus. Every session emits ~10 event types. Each learning system subscribes to the events it needs and runs async — nothing slows down the real-time experience.

### 10.1 Event Bus

```
// Events emitted per session
session.started           { user_id, challenge_id, role, level }
session.phase_changed     { session_id, from_phase, to_phase, elapsed_sec }
session.message_sent      { session_id, role, content_hash, timestamp }
session.ai_interaction    { session_id, prompt_hash, response_hash, accepted }
session.completed         { session_id, duration_sec, phases_visited }
session.abandoned         { session_id, phase_at_abandon, elapsed_sec }
session.scored            { session_id, dimensions[], overall_score }
session.challenged        { session_id, dimension, user_reasoning }
session.challenge_resolved { session_id, dimension, outcome }
session.approach_shared   { session_id, summary_hash }
session.retried           { session_id, previous_session_id }
```

### 10.2 The Seven Systems

| # | System | What It Learns | Consumed Events | Embedding Enhancement | Update Frequency |
|---|--------|---------------|-----------------|----------------------|------------------|
| 1 | **Scorer Calibration** | Grading accuracy ±0.8 → ±0.3 | scored, challenged, challenge_resolved | Drift detection via response similarity clustering | Batch (daily/weekly) |
| 2 | **Interviewer Tuning** | Which probes elicit better answers | phase_changed, message_sent | — | Monthly |
| 3 | **Problem Self-Optimization** | Completion rates, ambiguity detection | completed, abandoned, scored | — | Batch (weekly) |
| 4 | **Recommendation Engine** | Best practice paths per cohort | scored, retried, outcome.reported | Conceptual proximity for challenge serving | Daily |
| 5 | **AI Collaboration Patterns** | What "good AI usage" looks like | ai_interaction | — | Weekly analysis |
| 6 | **Difficulty Calibration** | Observed difficulty per cohort | scored, abandoned, completed | — | Daily |
| 7 | **Content Gap Detection** | Unmet search queries, radar dead zones | search.executed, filter.applied | Semantic search query matching | Weekly report |

### 10.3 The Compound Effect

A competitor who launches tomorrow with identical features is still 12 months behind — because they don't have the learning data. The scorer's calibration, the interviewer's tuning, the problem revisions, the recommendation model, the discovered AI patterns — all of this is earned through usage and compounds over time. That's the moat.

---

## 11. AI Cost Model

| Component | Model | Tokens / Session | Cost / Session |
|-----------|-------|-------------------|----------------|
| Interviewer Agent | Claude Sonnet | ~8K in, ~2K out (8 exchanges) | ~$0.04 |
| Coach (Luma) | Claude Haiku | ~1K in, ~200 out (per message) | ~$0.006 |
| Grader (Rubric Scorer) | Claude Opus | ~12K in, ~3K out (single call) | ~$0.30 |
| Curator (Pattern Matcher) | Claude Sonnet | ~10K in, ~1.5K out (single call) | ~$0.05 |
| Embeddings (async) | Voyage AI voyage-3-lite | ~800 tokens (4 step responses) | ~$0.00004 |
| **Total per session** | | | **~$0.40** |

At $0.40 per session, a Pro user doing 15 sessions/month costs ~$6 in AI. That's a **79% gross margin** on a $29/month plan. Embedding costs are negligible — even at 10K users doing 15 sessions/month, total monthly embedding cost is ~$0.60.

---

## 12. Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind + shadcn/ui | SSR, RSC, component library |
| Database | Supabase (PostgreSQL + Auth + Storage) | Managed Postgres, Row Level Security, real-time subscriptions |
| Vector Search | pgvector (Supabase-native extension) | No additional infra, IVFFLAT indexes, cosine similarity |
| Embedding Model | Voyage AI `voyage-3-lite` (512 dims) | Retrieval-optimized, Anthropic partnership, $0.02/1M tokens |
| LLM | Anthropic Claude API (Opus/Sonnet/Haiku routing) | Best quality for evaluation tasks |
| Payments | Stripe (Checkout + Customer Portal) | Standard |
| Deployment | Vercel | Edge, auto-preview |
| Event Bus | Supabase Realtime + simple queue | Session event fanout |
| Monitoring | Vercel Analytics + Sentry | Error tracking, performance |

---

## 13. Design System (Retained from v1)

| Element | Value |
|---------|-------|
| Display font | Literata (700-800 weight) |
| Body font | Nunito Sans (400-600 weight) |
| Mono font | JetBrains Mono |
| Primary | Forest Green #4A7C59 |
| Secondary | Amber #705C30 |
| Background | Cream #FAF6F0 |
| TopBar | Glass: rgba(250,246,240,0.85) + blur(12px) |
| NavRail | bg #f5f1ea, active pill #c8e8d0, 64px wide |
| Coach strip | Forest green gradient (the ONE dark element) |
| System | Material Design 3 surface system |
| Logo | Bridge Mark |

---

## 14. Onboarding Flow

```
Welcome Screen → Role Select → Calibration Challenge → Results → Dashboard
```

1. **Welcome**: 4 thinking moves visual + "Take the Assessment" CTA. No signup.
2. **Role Select**: One tap. Each role shows the specific pain ("Nobody asks the pipeline person about product decisions").
3. **Calibration Challenge**: "The Feature That Backfired" (Traditional/Easy). User writes freeform at each of the 4 moves.
4. **Results**: Radar chart with 5 dimensions, initial Move Levels, first thinking patterns collected.
5. **Dashboard**: Lands with real data — no empty state.

Skip paths exist at every stage. Users who skip calibration see a no-data dashboard state with a prominent "Take Assessment" card.

---

## 15. Engagement Mechanics (Prioritized)

### P0 — Ship at Launch

- **Quick Takes**: 60-second daily micro-challenges (one scenario, one move, one answer). Counts toward streaks.
- **Algorithmic challenge serving**: Weakest dimension + role match + spaced repetition for traps.
- **Animated grading reveal**: Scores reveal one dimension at a time (0.5s each), anti-patterns flash red with fix text, thinking pattern card slides in, XP award animates. ~3 seconds total.
- **Streaks with escalating unlocks**: Day 3 = trap dodge celebrations. Day 7 = rare pattern essay. Day 14 = archetype unlocks. Day 30 = personalized insight report. Quick Take OR full challenge counts.

### P1 — Within 2 Weeks

- Move Levels (replace flat radar), XP system, Thinking Archetype, "Trap Dodged" celebrations, "Just One More" challenge teaser, anti-pattern spaced repetition, shareable Thinking Cards, Before/After comparison.

### P2 — Within Month 1

- Variable feedback depth (70% standard, 20% Deep Dive, 10% Rare Insight), Thinking Journal, Mastery Map, comeback mechanic, Monthly Wrapped, certification path, adaptive difficulty oscillation.

### V3 (Parked)

- Social/multiplayer: cohorts, leagues, peer review, challenge-a-friend. Requires user density.

---

## 16. Linear Issue Mapping

### Existing Issues (SUN-167 Epic)

| Issue | Action | What Changes |
|-------|--------|--------------|
| SUN-168, 169, 170 | EXTEND | Add paradigm, role, thinking move columns |
| SUN-171 (NavRail 8→5) | KEEP | |
| SUN-172 (Explore hub) | MODIFY | Organize by paradigm, not domain |
| SUN-173-176 (Skill Area/Topic/Plan) | MODIFY | Paradigm replaces domain as top-level |
| SUN-177 (Workspace UX) | MODIFY | Guided becomes 4-move stepper with AI grading. Frameworks become side drawer. |
| SUN-178 (Practice hub) | MODIFY | Add paradigm + role filter pills, thinking move tags |
| SUN-179 (Dashboard) | MODIFY | Quick Take card, algorithmic next challenge, Move Levels |
| SUN-180 (Cross-links) | KEEP | Thinking patterns cross-link to challenges |
| SUN-181 (Progress) | MODIFY | Thinking Archetype, Before/After, Mastery Map, Thinking Journal |
| SUN-182 (Feedback) | MODIFY | Animated grading, anti-pattern detection, "Trap Dodged", XP display |
| SUN-183 (Prep hub) | KEEP | |
| SUN-184 (Luma mascot) | KEEP | |

### New Issues to Create

1. Implement 4 Thinking Moves system
2. Build calibration/onboarding flow
3. Implement AI grading rubric architecture
4. Build anti-pattern detection and display system
5. Implement role tagging system
6. Build Quick Take component and data layer
7. Implement algorithmic challenge serving
8. Build animated grading reveal sequence
9. Implement streak system with escalating unlocks
10. Build XP system with Move Level progression
11. Implement Thinking Archetype system
12. Build shareable Thinking Card generator
13. Implement push notification system (content-as-notification)
14. Build 5 launch challenges with complete rubric data
15. Implement skip-assessment flow and no-calibration dashboard state
16. Enable pgvector extension + add embedding columns (nullable) to schema
17. Build async embedding pipeline (post-grading response embedding)
18. Implement community approach semantic search UI
19. Build grader calibration drift detection batch job (embedding-powered)
20. Implement thinking pattern semantic search in pattern library

---

## 17. Guiding Principle

> Every mechanic should make the user THINK MORE, not just CLICK MORE. If a feature adds clicks without adding thinking, cut it.

---

*This document is the single source of truth for all Hackproduct v2 backend implementation work. All Linear issues should reference this document for context and rationale.*
