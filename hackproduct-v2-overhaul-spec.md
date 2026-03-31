# hackproduct — Platform Overhaul Specification
## v2: From Product Sense Quiz App to AI-Graded Product Thinking Gym

**Date**: March 27, 2026
**Status**: Ready for implementation
**Linear Epic**: SUN-167 (Explore Redesign v2)
**Branch**: feat/explore-redesign-v2

---

## 1. EXECUTIVE SUMMARY

This document captures the complete product thinking evolution of hackproduct — from initial concept through multiple rounds of prototyping, persona evaluation, expert founder review, and integration planning. It serves as the definitive specification for coding agents to implement the v2 platform overhaul.

**The one-sentence pitch**: hackproduct teaches engineers the 4 thinking moves (Frame, Split, Weigh, Sell) that separate Staff engineers from Senior engineers, using AI-graded freeform writing challenges with anti-pattern detection and personalized progression.

**What changed from v1 to v2**:

The v1 platform organized content by "domains" (Metrics, Strategy, Execution, etc.) — PM interview categories that engineers don't relate to. Challenges used a bubble-selection or basic freeform input with framework tabs. The nav had 8 items. The progression system was flat (ProductIQ radar with raw scores).

The v2 platform organizes content by 4 paradigms (Traditional, AI-Assisted, Agentic, AI-Native) with 4 thinking moves (Frame, Split, Weigh, Sell) replacing the old framework system. Challenges use freeform writing graded by AI agents with per-dimension scoring, anti-pattern detection, recommended answers, and thinking patterns. Progression uses Move Levels instead of raw scores. The entire experience is wrapped in engagement mechanics (Quick Takes, streaks, XP, archetypes) informed by expert founders from Maven, Udacity, TikTok, Duolingo, and game design.

---

## 2. WHAT EXISTS TODAY (v1 State from Linear)

### Current Navigation (8 items — SUN-171 consolidation planned)
1. Home (/dashboard)
2. Domains — skill areas like Metrics, Strategy
3. Product 75 — curated challenge set
4. Practice (/challenges) — challenge browser
5. Progress (/progress) — analytics
6. Interview Prep — company-specific prep
7. Simulation — mock interview mode
8. Frameworks — reference pages

### Current Design System (SUN-120)
- Fonts: Literata (headlines, 700-800), Nunito Sans (body, 400-600)
- Colors: Forest green #4a7c59, Amber #705c30, Cream background #FAF6F0
- Glass TopBar: rgba(250,246,240,0.85) + blur(12px)
- NavRail: bg #f5f1ea, active pill #c8e8d0, 64px wide
- Luma Coach: forest green gradient strip (the ONE dark element)
- Material Design 3 surface system

### Current Challenge Experience (SUN-177)
- Split-pane workspace: scenario left, answer right
- Answer pane has tabs: Guided | Freeform | Frameworks
- Guided tab walks through steps
- Freeform tab is open textarea
- Frameworks tab shows reference frameworks
- AI grading returns dimension scores and feedback

### Current Data Model (SUN-168, SUN-169, SUN-170)
- `challenges` table with domain_id FK
- `domains` table (being extended with topics layer)
- `concepts` table for flashcard content
- `challenge_topics` join table (NEW, being added)
- `concept_topics` join table (NEW, being added)
- `topics` table (NEW, being added)
- `study_plans`, `study_plan_chapters`, `study_plan_items` (NEW)
- `challenge_companies` join table (NEW)
- `company_profiles` table (existing)

### Current Scoring System
- ProductIQ score with 4 dimensions (currently radar chart)
- Streak counter (basic, no unlocks)
- Challenge completion tracking

### Current Issues Being Addressed (SUN-167 Epic)
- Phase 1: Schema migration for topics + study plans (SUN-168, 169, 170)
- Phase 2: NavRail 8→5, Explore hub, Skill Area/Topic/Plan pages (SUN-171-176)
- Phase 3: Workspace UX — Guided default, frameworks as drawer (SUN-177)
- Phase 4: Practice hub filters, Dashboard redesign (SUN-178, 179)
- Phase 5: Progress redesign, cross-links, feedback enhancement (SUN-180-182)
- Phase 6: Prep hub, Luma mascot image swap (SUN-183, 184)

---

## 3. THE CORE PIVOT: WHAT CHANGES AND WHY

### 3.1 Positioning Pivot

**v1 positioning**: "Product sense practice for PM interviews" — organized by PM interview categories (Metrics, Strategy, Execution, Behavioral)

**v2 positioning**: "Product sense for engineers — coding isn't the moat, thinking in products is" — organized by engineering paradigms and universal thinking moves

**Why this matters**: The v1 framing attracted PM candidates. The v2 framing targets the much larger market of engineers who need product thinking for career growth (Staff promotion), daily work (shaping what gets built), and the AI era (new skills nobody teaches). The persona evaluation confirmed: engineers who saw "product sense for engineers" with their specific role tag (SWE, Data Eng, ML Eng, DevOps, EM, Founding Eng) felt "seen" for the first time. PMs who saw it understood it wasn't for them but wanted to buy it for their eng partners — a powerful GTM motion.

### 3.2 Framework Simplification: 6 Frameworks → 4 Thinking Moves

**v1 had 6 named frameworks**: UNPACK, SEGMENT-FIRST, TRADEOFF MATRIX, IMPACT CHAIN, BLAST RADIUS, TRUST CALIBRATION. These required upfront learning. Users had to understand the framework system before getting value. The persona evaluation showed: 6 frameworks felt like "an MBA class" to engineers, especially non-SWE roles.

**v2 has 4 thinking moves**: Frame, Split, Weigh, Sell. These are questions, not systems. They map directly to the old frameworks but are immediately understandable:

| v2 Move | v1 Frameworks Absorbed | The Question |
|---------|----------------------|--------------|
| **Frame** ◇ | UNPACK | "What's the real problem here?" |
| **Split** ◈ | SEGMENT-FIRST | "Who exactly is affected, and how?" |
| **Weigh** ◆ | TRADEOFF MATRIX, IMPACT CHAIN, BLAST RADIUS, TRUST CALIBRATION | "What are the real tradeoffs?" |
| **Sell** ◎ | (New — was Communication dimension) | "How do you make others see what you see?" |

The old framework names become "techniques" discovered DURING challenges, not pre-taught. When a challenge step requires reversibility analysis, the "One-Way Door Test" technique surfaces inside the Weigh move. Users don't need to know it existed beforehand.

**Implementation impact**: The existing Frameworks page (/frameworks) and framework tab in the workspace get replaced. The Guided tab in the challenge workspace walks through these 4 moves instead. The framework reference content moves to a side drawer (per SUN-177) but uses the new move vocabulary.

### 3.3 Content Organization: Domains → Paradigms + Topics

**v1 organized by PM interview domains**: Metrics & Analytics, Product Strategy, Product Execution, Behavioral, Technical, Product Design, System Design

**v2 organizes by engineering paradigms**:

| Paradigm | Color | Description | Problem Count Target |
|----------|-------|-------------|---------------------|
| **Traditional** | Green #2dd4a0 | Build the right thing, not just the thing right | ~150 |
| **AI-Assisted** | Blue #5eaeff | Use AI tools without losing judgment | ~50 |
| **Agentic** | Purple #a78bfa | Design systems where agents act autonomously | ~70 |
| **AI-Native** | Orange #f59e0b | Products that couldn't exist without AI | ~70 |

Within each paradigm, challenges are grouped by **topics** (the new topics layer from SUN-168). Topics map to the old domains but with engineering framing:

| Old Domain | New Topic(s) | Paradigm |
|-----------|-------------|----------|
| Metrics & Analytics | Failure Analysis, Impact Translation | Traditional |
| Product Strategy | Second-Order Thinking, AI Product Strategy | Traditional, AI-Native |
| Product Execution | Scope Negotiation, Agent Economics | Traditional, Agentic |
| Behavioral | (Absorbed into Sell step of all challenges) | All |
| Product Design | Trust & Autonomy, AI UX Patterns | Agentic, AI-Native |

**Implementation impact**: The existing `domains` table maps to paradigms. The new `topics` table (SUN-168) sits between domains and challenges. The Explore hub (SUN-172) should display paradigms as the top-level organizer with topics nested inside. The practice hub (SUN-178) should have paradigm filter pills.

### 3.4 Challenge Experience: Bubble Selection → AI-Graded Freeform Writing

**v1 challenge flow**: Read scenario → pick from Guided tab steps (bubble options OR freeform text) → see feedback

**v2 challenge flow**: Read scenario → write freeform response at each thinking move (Frame → Split → Weigh → Sell) → get AI-graded per step with 5-dimension scoring, anti-pattern detection, recommended answer, thinking pattern, and interview tip → see final radar with all patterns collected

This is the single biggest product change. The persona evaluation showed the freeform writing + AI grading was rated higher than bubble selection by all 10 personas. Sarah Chen (Google L5): "This is the best product thinking tool I've ever used." Lisa Zhang (ML Eng): "This diagnosed my career problem in one challenge."

#### 3.4.1 The 5 Grading Dimensions

Every step gets scored on 5 dimensions (1-5 each):

| Dimension | Color | What It Measures |
|-----------|-------|-----------------|
| Problem Reframing | Blue #5eaeff | Did they see past the surface to the real tension? |
| User Segmentation | Green #2dd4a0 | Did they break users into meaningful groups? |
| Data Reasoning | Cyan #22d3ee | Did they use data to support, not just assert? |
| Tradeoff Clarity | Amber #f59e0b | Did they name what they're giving up? |
| Communication | Purple #a78bfa | Could a non-technical stakeholder follow this? |

**Implementation**: These 5 dimensions replace the current 4-dimension ProductIQ system. The radar chart updates from 4 axes to 5. The grading agent uses a step-specific rubric (see Section 4 for rubric architecture).

#### 3.4.2 Anti-Pattern Detection (Named Traps)

The AI grading agent detects specific thinking errors and returns them by name. Each trap has: a name, a description of what the user did wrong, and a specific rewrite showing how to fix it.

| Trap ID | Name | Description | Fix |
|---------|------|-------------|-----|
| `surface_restatement` | Surface-Level Restatement | Restated the PM's solution as the problem | "Identify the underlying tension instead" |
| `aggregate_fallacy` | Aggregate Fallacy | Treated all users as one group | "Segment by behavior before deciding" |
| `confirmation_bias` | Confirmation Bias | Forced data to fit the proposed solution | "Let data challenge the hypothesis" |
| `data_delay` | Data Delay | Called for research when signals already exist | "Act on available signal, validate in parallel" |
| `metric_tunnel` | Metric Tunnel Vision | Optimized dashboard metric over business outcome | "Trace the metric to real business impact" |
| `abdication` | Abdication | Presented data without a recommendation | "Always pair data with a specific recommendation" |
| `adversarial` | Adversarial Framing | Was right but positioned it as an attack | "Build on their insight, then redirect" |
| `premature_solution` | Premature Solution | Jumped to a fix before understanding the problem | "Understand the problem fully first" |
| `model_product_gap` | Model-Product Gap | Confused model performance with product success | "Ask: what user behavior actually changed?" |
| `over_autonomy` | Over-Autonomy | Gave the AI/agent too much unsupervised power | "Match autonomy level to error cost" |

**Implementation**: Store trap definitions in a `thinking_traps` table or JSON config. The grading rubric for each step specifies which traps to check. The AI agent returns detected trap IDs in the grading response. The frontend renders them with the red warning styling, description, and fix suggestion.

#### 3.4.3 Grading Rubric Architecture

Each challenge step has a grading rubric — a system prompt sent to the AI agent along with the user's response. The rubric specifies:

1. Context (the challenge scenario)
2. Step focus (what this specific step should demonstrate)
3. Per-dimension scoring criteria (what 1/5 vs 5/5 looks like)
4. Anti-patterns to detect (which trap IDs to check)
5. Recommended answer (the strong response)
6. Thinking pattern (title + body — the transferable concept)

The rubric is a function that takes the challenge scenario as input and returns the complete grading prompt. This allows rubrics to reference scenario-specific data.

**Implementation**: Store rubrics as structured data in a `challenge_step_rubrics` table or as JSON within the challenge step record. The grading agent receives: rubric + user response → returns structured JSON:

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

### 3.5 Role Tagging System

Every challenge is tagged with 1-3 roles it's most relevant for. This drives filtering, study plan personalization, and the "this is for YOU" signal.

| Role | Tag | Color | Target User |
|------|-----|-------|-------------|
| Software Engineer | SWE | Blue #5eaeff | IC engineers at any level |
| Data Engineer | Data | Cyan #22d3ee | Pipeline builders, analytics engineers |
| ML Engineer | ML | Purple #a78bfa | Model builders, applied ML |
| DevOps / SRE | DevOps | Orange #f59e0b | Infrastructure, platform, reliability |
| Eng Manager | EM | Yellow #fbbf24 | Tech leads managing teams |
| Founding Engineer | Founding | Green #2dd4a0 | Engineers at early-stage startups |

**Implementation**: Add a `challenge_roles` join table (challenge_id, role_id). Add a `roles` reference table. Wire role filter to the practice hub (SUN-178) and Explore hub (SUN-172). The onboarding/calibration flow captures the user's role and stores it in their profile.

---

## 4. THE 5 LAUNCH CHALLENGES

These are the fully-designed, AI-graded challenges ready for implementation. Each has complete scenario text, step prompts, grading rubrics, anti-pattern checks, recommended answers, and thinking patterns.

### Challenge 1: "The Feature That Backfired" (Calibration Challenge)
- **Paradigm**: Traditional | **Difficulty**: Easy | **Roles**: SWE, Data Eng
- **Moves**: Frame → Split → Weigh → Sell (all 4)
- **Scenario**: Share button shipped. Downloads +12%, sessions -18%, purchases -9%. PM confused. Leadership wants answers Friday.
- **Core insight**: Composition effect — feature works but brings low-intent visitors who drag down averages. Not a product failure, a measurement problem.
- **Why this is the calibration challenge**: Tests all 4 moves, has a satisfying "aha" arc, accessible to all roles, teaches the most common anti-patterns (Surface-Level Restatement, Aggregate Fallacy, Data Delay, Metric Tunnel Vision).

### Challenge 2: "Power User Paradox"
- **Paradigm**: Traditional | **Difficulty**: Medium | **Roles**: SWE, Data Eng, EM
- **Moves**: Frame → Split → Sell
- **Scenario**: Top 5% users = 60% revenue ($1.44M/month) but 80% of support tickets. Ticket breakdown: 70% feature requests, 20% bugs, 10% confusion. PM wants UI simplification.
- **Core insight**: Only 10% of tickets are confusion. 70% are feature requests meaning users want MORE, not less. Simplification addresses 10% while risking $1.44M.

### Challenge 3: "Model Accuracy Up, Engagement Down"
- **Paradigm**: AI-Assisted | **Difficulty**: Hard | **Roles**: ML Eng, SWE, Data Eng
- **Moves**: Frame → Split → Weigh
- **Scenario**: Recommendation accuracy 78%→91% but CTR -18%, session diversity -55%, discovery satisfaction 3.8→3.1. ML team says better. Product team says worse.
- **Core insight**: Both teams are right. Model optimized for precision, which narrowed recommendations. Users lost serendipity. Better predictor, worse product.
- **Unique anti-pattern**: MODEL-PRODUCT GAP — specific to ML engineers.

### Challenge 4: "The $400 Shopping Spree"
- **Paradigm**: Agentic | **Difficulty**: Medium | **Roles**: SWE, Founding Eng
- **Moves**: Frame → Weigh → Sell
- **Scenario**: Shopping agent made 7 unsupervised purchases ($412) while user was at lunch. User wanted to browse, not buy.
- **Core insight**: No intent disambiguation between browse and buy. No purchase confirmation gate. No spending limit. Three design failures.
- **Unique anti-pattern**: OVER-AUTONOMY — specific to agent builders.
- **Unique Sell step**: Write TWO messages — customer-facing (empathy + refund) AND internal post-mortem.

### Challenge 5: "OpenAI Ships Your Feature — Free"
- **Paradigm**: AI-Native | **Difficulty**: Hard | **Roles**: Founding Eng, SWE, EM
- **Moves**: Frame → Weigh → Sell
- **Scenario**: DocuBrain (AI doc analysis, $34K MRR, 1200 users). ChatGPT Plus adds Document Analysis covering 70% of DocuBrain's features. Three enterprise prospects waver. Investor texts "Call me."
- **Core insight**: The 70% overlap is generic analysis. Paying customers pay for vertical-specific features (compliance rules, audit trails, integrations) that OpenAI won't build. Sprint up the value stack, don't compete horizontally.
- **Unique Sell step**: Write user email AND investor call opening — two audiences, two tones.

---

## 5. ONBOARDING & CALIBRATION FLOW

The onboarding IS a challenge. No empty dashboards. No placeholder data. The user solves a real problem before seeing their first dashboard.

### Flow:
```
Welcome Screen → Role Select → Calibration Challenge (4 steps, AI-graded)
  → Calibration Results (radar + level + patterns) → Main App Dashboard
```

### Welcome Screen
- Headline: "Coding isn't the moat. Thinking in products is."
- Subhead: "Write your thinking. Get AI-graded feedback. Build the 4 moves that separate Staff from Senior."
- 4 thinking move icons displayed (◇ ◈ ◆ ◎ with Frame, Split, Weigh, Sell labels)
- Primary CTA: "Take the Assessment →" (goes to Role Select)
- Secondary: "Skip assessment, explore the platform →" (goes directly to Dashboard with no calibration data)
- No signup required. Assessment is anonymous until they choose to create an account.

### Role Select
- "What's your role?" with 6 role cards
- Each card shows: role name, short tag (SWE, Data, ML, etc.), and the specific pain ("Ship clean code but keep getting passed over for Staff")
- Selecting a role launches the calibration challenge immediately
- Skip link: "Skip assessment →" (sets role to SWE default, goes to Dashboard)

### Calibration Challenge
- Uses "The Feature That Backfired" (Challenge 1)
- 4 steps (one per thinking move) with freeform text input
- Each step graded by AI in real-time
- "Skip →" link visible in the challenge header for users who want to bail mid-assessment
- On completion, "See My Profile →" goes to Calibration Results

### Calibration Results
- Radar chart showing 5-dimension scores
- Level assignment: Beginner (0-1 dimensions at 4+), Intermediate (2-3), Advanced (4-5)
- Headline adapts: "Sharp instincts." / "Solid foundation." / "Room to grow."
- Thinking patterns collected during calibration displayed
- "Start Training →" drops user into Dashboard with real data from their calibration

### Dashboard Without Calibration (Skip Flow)
- Instead of radar chart, shows: "Take the Calibration Assessment" banner card
- Explains what they'll get: "5-dimension scores, personalized skill radar, ~5 min"
- All challenges are still browsable and playable
- Progress tab shows "No Data Yet" state with assessment prompt
- Top bar shows "New" badge instead of level

---

## 6. STUDY PLANS

Role-specific guided paths through the challenge bank. Each plan has chapters with ordered challenge items.

### Plan 1: Staff Engineer Path 🎯
- **For**: SWE | **Duration**: 6 weeks
- **Description**: "The Blind 75 for product sense. 30 problems that build the complete toolkit for Senior → Staff."
- Chapters: See Product in Code → Drive Decisions → Systems & Incentives → AI-Era Thinking → Hard Mode → AI-Native Frontier

### Plan 2: 7-Day Prep ⏱️
- **For**: SWE, Data Eng, ML Eng | **Duration**: 7 days
- **Description**: "Interview in a week. Panic → structure → confidence."
- Chapters: Days 1-2 Fundamentals → Days 3-4 AI Thinking → Days 5-7 Hard Mode + Mock

### Plan 3: AI Product Fluency 🧠
- **For**: SWE, ML Eng, Founding Eng | **Duration**: 4 weeks
- **Description**: "4 weeks to think like an AI product builder."
- Chapters: AI Tool Judgment → Agent Design → AI-Native Patterns → Frontier Hard Mode

### Plan 4: Data Eng → Product 📊
- **For**: Data Eng | **Duration**: 4 weeks
- **Description**: "Stop being the pipeline person."
- Chapters: Data as Product → Metrics Mastery → AI Data → Strategy

### Plan 5: EM Product Leadership 👔
- **For**: Eng Manager | **Duration**: 4 weeks
- **Description**: "Partner with PMs as equals."
- Chapters: Shape Don't Execute → Translate Upward → Team + Product → AI-Era Leadership

### Plan 6: Founding Engineer 🚀
- **For**: Founding Eng | **Duration**: 6 weeks
- **Description**: "You ARE the product team."
- Chapters: Product Fundamentals → Scope & Tradeoffs → AI Product Design → Agent + Native → Strategy & Survival → Full Scenarios

### Plan 7: DevOps → Product Impact ⚙️
- **For**: DevOps/SRE | **Duration**: 4 weeks
- **Description**: "Stop being infra that keeps the lights on."
- Chapters: Infra as Product → Platform Decisions → Agent Infra → AI-Era Platform

**Implementation**: Uses the study_plans, study_plan_chapters, study_plan_items schema from SUN-168. Each item links to a challenge_id. The plan detail page (SUN-176) shows chapters with challenge links. Challenge links that are playable should launch directly into the challenge experience.

---

## 7. ENGAGEMENT MECHANICS (from Expert Founder Review)

These are the engagement features to build on top of the core learning engine, prioritized by implementation tier.

### 7.1 P0 — Ship Before/With Launch

#### Quick Takes (90-second micro-challenges)
- **What**: A single Frame or Sell step pulled from any challenge
- **Where**: Above the full challenge card on the Home/Dashboard screen
- **UX**: Just the prompt, a 3-line text input, and "Grade in 15s" button
- **Why**: Daily habit formation. The full challenge is a 15-20 min commitment. Quick Takes let users practice in 90 seconds on the subway.
- **Data model**: Create a `quick_takes` view that randomly selects Frame or Sell steps from challenges, weighted toward the user's weakest dimensions.

#### Algorithmic "Next Challenge" Serving
- **What**: Replace the challenge browser on Home with ONE algorithmically-selected challenge
- **Where**: Home screen, replacing the challenge list
- **Algorithm**: Optimize for (1) weakest dimension from last graded challenge, (2) paradigm not practiced recently, (3) difficulty matched to level, (4) anti-patterns recently triggered
- **UX**: "Your Next Challenge" card with reason ("Your Communication is 2.8 — this targets that"). "Shuffle →" button for users who want choice.
- **Data needs**: User's dimension history, paradigm completion history, anti-pattern trigger history

#### Animated Grading Reveal
- **What**: Replace instant score dump with a 3-second animated sequence
- **Where**: Challenge grading step, after "Submit for Grading"
- **Animation sequence**: (1) Pulse animation during API call, (2) Dimension bars fill one-at-a-time with 400ms stagger and easing, (3) 5/5 scores get subtle glow pulse, (4) Anti-pattern trigger gets brief shake on the feedback card, (5) Zero traps = "Clean run ✦" badge flash
- **Why**: Transforms "seeing" scores into "feeling" them. The emotional difference between reading a text and hearing someone say it.

#### Streak System with Escalating Unlocks
- **What**: Daily streak that unlocks content at milestones
- **Where**: Home screen (counter), Progress tab (detail)
- **Milestones**: Day 3 = trap dodge celebrations eligible. Day 7 = rare thinking pattern essay unlocks. Day 14 = Thinking Archetype unlocks. Day 30 = personalized insight report (Day 1 vs Day 30 radar). Day 60 = "Consistent Thinker" LinkedIn badge.
- **Rules**: Quick Take OR full challenge counts. One freeze earned per 7 consecutive days (max 2 stored).
- **Data model**: `user_streaks` table with current_streak, longest_streak, freeze_count, last_active_date.

#### Push Notifications as Content
- **What**: Daily notification that IS a Quick Take, not a reminder about Quick Takes
- **Format**: "Your app's DAU is up 20% but revenue is flat. What's the first question you ask? Tap to answer in 60 seconds."
- **Delivery**: User's preferred time (captured in settings)
- **Open rate**: Expected 3-5x higher than "Don't forget to practice!" reminders

### 7.2 P1 — Ship Within 2 Weeks

#### Move Levels (replacing flat radar scores)
- **What**: Frame Level 1-5, Split Level 1-5, etc. with progress bars showing % to next level
- **Where**: Home screen (compact view), Progress tab (detail)
- **Level requirements**: Level 1 = 3 challenges scoring 3+. Level 2 = 5 scoring 3.5+. Level 3 = 7 scoring 4+. Level 4 = 10 scoring 4+ with zero anti-patterns. Level 5 = mastery.
- **Why**: "Communication: Level 2 (68% → Level 3)" feels like progress you're building. "Communication: 2.8/5" feels like a measurement you're failing.
- **Data model**: Extend user_analytics with per-dimension level tracking.

#### XP System
- **What**: XP awarded per graded step based on quality
- **Scoring**: Score 1-2 = 5 XP. Score 3 = 10 XP. Score 4 = 20 XP. Score 5 = 30 XP. Bonus +10 for dodging a previously-triggered trap. +15 for completing all steps in a challenge.
- **Where**: Brief "+20 XP" float animation next to score after grading. Cumulative XP drives Move Levels.
- **Data model**: `user_xp_log` table (user_id, challenge_id, step_index, xp_earned, timestamp).

#### Thinking Archetype
- **What**: Identity label based on radar shape, updating as user grows
- **Archetypes**: High Frame+Split, low Sell = "The Analyst." High Sell, low Frame = "The Diplomat." Balanced = "The Generalist." All high = "The Architect."
- **Where**: Progress tab (prominent), profile header, shareable cards
- **Why**: "I'm an Analyst working on my Sell" is emotionally resonant in a way "Communication: 2.8" is not.

#### "Trap Dodged" Celebrations
- **What**: When user avoids an anti-pattern they previously triggered, show celebration
- **UX**: "🛡 Trap Dodged: Aggregate Fallacy — you segmented before deciding this time"
- **Why**: Celebrates growth, not just performance. Avoiding a trap you used to fall into is the most meaningful learning signal.

#### "Just One More" Challenge Teaser
- **What**: After completing a challenge, tease the next one instead of "Back to Dashboard"
- **UX**: "Your Sell score was 2.8. This next challenge targets exactly that skill. Continue? →" with the algorithmically-selected next challenge pre-loaded.
- **Expected impact**: +40% challenges per session.

#### Anti-Pattern Spaced Repetition
- **What**: When a user triggers an anti-pattern, schedule challenges testing that skill at 3, 7, and 14 days
- **Rule**: Anti-pattern not "learned" until dodged 3 consecutive times
- **Where**: Feeds into the algorithmic serving logic
- **Data model**: `user_trap_history` table (user_id, trap_id, triggered_count, dodged_count, last_triggered, last_dodged, mastered_at).

#### Shareable Thinking Card
- **What**: After challenge results, generate a designed image card for sharing
- **Content**: Challenge title, paradigm badge, 5-dimension score bars, archetype, trap dodged
- **Sizes**: LinkedIn (1200x627), Twitter (1200x675)
- **UX**: One-tap share button on results screen
- **Why**: Engineers share to signal intelligence. Same psychology as Spotify Wrapped or GitHub contributions.

#### Before/After Comparison
- **What**: Side-by-side view of first Frame response vs most recent, with both AI grades
- **Where**: Progress tab
- **Update frequency**: Every 5th challenge completed
- **Why**: The most satisfying growth visualization possible. Seeing your own improvement in your own words.

### 7.3 P2 — Ship Within Month 1

#### Variable Feedback Depth
- 70% of steps: standard feedback (scores + text + recommended answer)
- 20% of steps: "Deep Dive" — add a Staff engineer perspective essay
- 10% of steps: "Rare Insight" — counterintuitive take that challenges the recommended answer
- **Why**: Prevents format fatigue after 10+ challenges

#### End-of-Challenge Reflection
- After results, before dashboard: "One sentence: what will you do differently at work this week?"
- Optional but prompted. Saved to Thinking Journal.
- **Why**: Bridges practice and application. Written commitments increase follow-through.

#### Mastery Map
- Visual grid showing every challenge colored by score: grey (unplayed), red (<3), yellow (3-4), green (4+)
- **Where**: Progress tab
- **Why**: Collector's instinct. Watching the map fill with green is inherently satisfying.

#### Thinking Journal
- All collected thinking patterns, dodged traps, and reflections in one chronological, searchable, exportable view
- **Where**: Progress tab section
- **Exportable**: PDF for interview prep or promo packet evidence

#### Comeback Mechanic
- If gone 7+ days: "While you were away, 312 engineers practiced. Your Frame Level dropped from Level 3 to Level 2. One challenge to restore it."
- **Why**: Loss aversion is 2x more motivating than gain encouragement

#### Monthly Wrapped
- Auto-generated monthly recap: challenges completed, XP earned, dimensions improved, anti-patterns overcome, archetype evolution, percentile ranking
- Multi-screen shareable format
- **Why**: Retention (shows progress) + acquisition (shared Wrapped brings new users)

#### Certification Path (visible, gated)
- "hackproduct Certified" shown on Progress tab from Day 1
- Requirements: 20 challenges across all 4 paradigms, Level 3+ on all 5 dimensions, capstone challenge
- **Why**: Long-term retention anchor. Gives users something to build toward.

#### Difficulty Oscillation
- Algorithmic serving oscillates: Hard → Easy → Medium → Hard
- Never 3 Hard in a row. Never 3 Easy in a row.
- **Why**: Alternating tension and release prevents fatigue

#### Adaptive Step Difficulty
- If user scores 5/5 on Frame, serve a harder Split step variant
- If they score 2/5, serve a more structured hint
- **Implementation**: 2 variants per step prompt (standard + advanced), serve advanced when previous step scored 4+

---

## 8. MAPPING TO EXISTING LINEAR ISSUES

### What stays from the current SUN-167 epic:
- **SUN-168** (Schema migration): KEEP but extend with role tables, trap definitions, XP tables, and streak tables
- **SUN-169** (TypeScript types): KEEP but update types to use new dimension names and add Move Level, XP, Archetype types
- **SUN-170** (Data access layers): KEEP but add functions for paradigm-based filtering, role filtering, algorithmic challenge selection
- **SUN-171** (NavRail 8→5): KEEP — consolidation aligns with v2
- **SUN-172** (Explore hub): KEEP but organize by paradigms at top level, not skill areas
- **SUN-173-176** (Study plan pages, topic/skill area pages): KEEP — these map directly to the new study plans and paradigm/topic hierarchy
- **SUN-177** (Workspace UX): MODIFY — Guided tab should walk through the 4 thinking moves (Frame → Split → Weigh → Sell). Freeform remains. Frameworks become a side drawer with the new move vocabulary.
- **SUN-178** (Practice hub): MODIFY — Add paradigm filter pills, role filter pills, thinking move tags on challenge cards
- **SUN-179** (Dashboard): MODIFY — Add Quick Take card, algorithmic "Next Challenge," Move Levels replacing flat radar, daily quest
- **SUN-180** (Cross-links): KEEP — thinking patterns should cross-link to challenges that practice the same move
- **SUN-181** (Progress redesign): MODIFY — Add Thinking Archetype, Before/After comparison, Mastery Map, Thinking Journal, certification path display
- **SUN-182** (Feedback enhancement): MODIFY — Add animated grading sequence, anti-pattern detection with fix suggestions, "Trap Dodged" celebrations, XP award display
- **SUN-183** (Prep hub): KEEP
- **SUN-184** (Luma mascot): KEEP

### New issues to create:
1. Implement 4 Thinking Moves system (replace old framework references throughout)
2. Build calibration/onboarding flow (Welcome → Role → Challenge → Results → Dashboard)
3. Implement AI grading rubric architecture (per-step rubrics, structured JSON response parsing)
4. Build anti-pattern detection and display system
5. Implement role tagging system (roles table, challenge_roles join, role filter UI)
6. Build Quick Take component and data layer
7. Implement algorithmic challenge serving
8. Build animated grading reveal sequence
9. Implement streak system with escalating unlocks
10. Build XP system with Move Level progression
11. Implement Thinking Archetype system
12. Build shareable Thinking Card generator
13. Implement push notification system for content-as-notification
14. Build 5 launch challenges with complete rubric data
15. Implement skip-assessment flow and no-calibration dashboard state

---

## 9. DESIGN SYSTEM UPDATES

The v1 design system (Terra warm palette, forest green, Literata + Nunito Sans) is retained. The following additions are needed:

### New Colors (for thinking moves and paradigms)
```
Frame: #5eaeff (blue)
Split: #2dd4a0 (green — aligns with existing forest green family)
Weigh: #f59e0b (amber — aligns with existing amber accent)
Sell:  #a78bfa (purple — new accent)

Paradigm Traditional: green (existing)
Paradigm AI-Assisted: blue
Paradigm Agentic: purple
Paradigm AI-Native: amber/orange
```

### New Icons
- Frame: ◇ (diamond outline)
- Split: ◈ (diamond with dot)
- Weigh: ◆ (diamond filled)
- Sell: ◎ (target/bullseye)

### New Components Needed
- `QuickTakeCard` — compact challenge step with inline text input
- `NextChallengeCard` — algorithmically-selected challenge with reason text
- `MoveProgressBar` — 4-segment bar showing which moves are completed in current challenge
- `AnimatedScoreBar` — score bar that fills with easing and optional glow
- `TrapDodgedBanner` — celebration banner for avoided anti-patterns
- `XPFloatAnimation` — "+20 XP" floating text that fades up
- `ThinkingCard` — shareable image card for social media
- `MoveLevelDisplay` — "Frame Level 2 (68% → Lv3)" with progress bar
- `ArchetypeBadge` — thinking archetype with icon and description
- `MasteryMapGrid` — visual grid of all challenges colored by score

---

## 10. PERSONA VALIDATION SUMMARY

### Round 1 Evaluation (10 personas on v1 prototype)
- Average scores: First Impression 7.6, Challenge 8.2, Navigation 7.5
- Key finding: Framework-guided challenge was the standout feature. Onboarding was missing. Role content depth uneven.

### Round 2 Evaluation (same 10 personas on refined v2)
- Average scores: First Impression 9.0 (+1.4), Challenge 9.3 (+1.1), Navigation 8.8 (+1.3)
- Key finding: Freeform writing + AI grading was rated higher by ALL 10 personas. 4 moves replacing 6 frameworks removed learning barrier. Skip assessment flow captured users who would have bounced.
- Would pay: 9/10 (up from 8/10)

### Expert Founder Review (5 experts)
- Wes Kao (Maven): "Make it social. Cohort challenges."
- Sebastian Thrun (Udacity): "Build the credential. Practice without proof is a vitamin."
- Zhang Yiming (TikTok): "Build a feed, not a bookshelf. Algorithmic serving."
- Luis von Ahn (Duolingo): "A+ learning engine, C- engagement wrapper. Add XP, leagues, levels."
- Raph Koster (Game designer): "Make practice feel like a game. Animate the grading. Add narrative arcs."

### Consensus
PMF is confirmed. The learning engine is excellent. The remaining work is engagement engineering (P0-P2 mechanics above) and content depth (more challenges per paradigm and role).

---

## 11. CONTENT VOLUME TARGETS

### Launch
- 5 playable AI-graded challenges (1 per paradigm + calibration)
- 10 challenge entries in the bank (5 playable + 5 "coming soon")
- 7 study plans
- 6 role profiles

### Month 1
- 15+ playable challenges (3+ per paradigm, 2+ per role)
- 20+ total challenge entries
- All study plan items linked to playable challenges

### Month 3
- 50+ playable challenges
- Community-submitted challenges (curated, not open)
- Company-specific problem sets (Google, Meta, Stripe)

### Month 6
- 150+ playable challenges
- Role-specific depth (30+ per role)
- Seasonal content drops (8-12 week themed cycles)

---

## 12. TECHNICAL NOTES FOR AGENTS

### AI Grading
- Model: Claude Sonnet 4 via Anthropic API
- Input: Step rubric (system prompt) + user response (user message)
- Output: Structured JSON (scores, anti_patterns, feedback, recommended, thinking_pattern, interview_tip)
- Error handling: If API fails, return fallback scores (3/3/3/3/3) with generic feedback
- Latency: Expected 2-5 seconds. Show pulsing animation during grading.

### State Management
- User role: stored in profile, captured at onboarding
- Calibration scores: stored after calibration challenge, displayed throughout
- Challenge progress: per-step responses and grades stored in session, persisted on completion
- Streaks: server-side calculation on each session
- XP: calculated from grades, accumulated in user profile
- Move Levels: derived from challenge completion history per dimension

### Data Flow
```
User writes response
  → Frontend sends to grading API endpoint
  → Backend constructs prompt: rubric + user response
  → Backend calls Claude API
  → Claude returns structured JSON
  → Backend validates/stores response
  → Frontend receives grades
  → Frontend renders animated score reveal
  → Frontend updates XP, streak, level progress
```

### Key Principle
Every mechanic should make the user THINK MORE, not just CLICK MORE. If a feature adds clicks without adding thinking, cut it.

---

*End of specification. This document should be used as the single source of truth for all v2 implementation work. All Linear issues should reference this document for context and rationale.*
