# HackProduct Content Planning — Mental Model Map
*Last updated: March 31, 2026*

This document maps every mental model, framework, and concept we have researched and structured — showing what exists at each layer and what still needs to be built.

---

## The Three Layers

```
LAYER 1 — CURRICULUM (teaching)
  Mental models, frameworks, FLOW-structured concepts
  → Teaches engineers the vocabulary and thinking patterns

LAYER 2 — EDITORIAL (publishing)
  Posts, stories, case teardowns
  → Builds the audience and signals what HackProduct is about

LAYER 3 — CHALLENGES (practice)
  Case study questions users answer, get graded on
  → The actual product. This is what Luma coaches.
```

---

## The FLOW Framework

Every challenge, concept, and piece of content on HackProduct maps to one or more FLOW steps:

| Step | What it trains | Anti-pattern it corrects |
|---|---|---|
| **F — Frame** | Define the real problem before jumping to solutions | Jumping to solutions, treating symptoms as causes |
| **L — List** | Map the full solution space and all stakeholders | Only seeing the obvious stakeholder, missing second-order effects |
| **O — Optimize** | Weigh trade-offs, evaluate options against each other | Picking without reasoning, treating all options as equal |
| **W — Win** | Make a clear, specific, defensible recommendation | Vague answers, no conviction, listing options instead of deciding |

---

## Mental Model Inventory

### Module 1 — User Segmentation
**FLOW step focus:** Frame, List
**Difficulty:** Beginner
**Core concept:** Segment by behavior and motivation, not demographics
**Key framework:** Reach × Underserved Degree (2×2 prioritization)
**Key anti-patterns:**
- Demographic segmentation (age, location, income)
- Designing for everyone = designing for no one
- Ignoring multi-sided markets (missing host OR guest)
- Vague personas without behavioral specificity

**Curriculum status:** ✅ FLOW JSON written
**Editorial status:** ✅ Post published to Notion — *"Stop Segmenting by Age"*
**Challenge status:** 🔲 Not yet created

---

### Module 2 — Problem Identification & Prioritization
**FLOW step focus:** Frame
**Difficulty:** Intermediate
**Core concept:** Diagnose root causes before proposing solutions; connect problems to mission
**Key frameworks:**
- 5 Whys (symptom → contributing factor → root cause)
- Frequency × Severity × Underservedness prioritization
- Mission fit test

**Key anti-patterns:**
- Jumping to solutions before defining the problem
- Confusing symptoms with root causes ("users are churning" ≠ root cause)
- Picking the loudest problem, not the most important one
- Ignoring problems users have stopped complaining about (Gmail storage example)

**Curriculum status:** ✅ FLOW JSON written
**Editorial status:** ✅ Post published to Notion — *"The Bug You Shouldn't Fix"*
**Challenge status:** 🔲 Not yet created

---

### Module 3 — Defining Success Metrics
**FLOW step focus:** Optimize, Win
**Difficulty:** Intermediate
**Core concept:** Measure user outcomes, not feature outputs; every North Star needs a guardrail
**Key frameworks:**
- AARRR (Pirate Metrics): Acquisition → Activation → Retention → Revenue → Referral
- North Star Metric (one metric that captures real user value)
- Output vs. outcome metrics distinction
- Guardrail metrics (prevent gaming the North Star)

**Key anti-patterns:**
- Using technical metrics as product success proxies (latency ≠ user value)
- Measuring feature adoption instead of user outcomes
- Picking metrics that can be gamed
- No guardrail metric → dark pattern optimization

**Real examples:**
- Netflix: hours watched from recommendations (not "recs shown") → $1B/year in content savings
- Airbnb: nights booked
- Spotify: time listening

**Curriculum status:** ✅ FLOW JSON written
**Editorial status:** ✅ Post published to Notion — *"All Your Metrics Are Green and Nobody Cares"*
**Challenge status:** 🔲 Not yet created

---

### Module 4 — Product Improvement (Distribution vs. Novelty)
**FLOW step focus:** Frame, List, Optimize
**Difficulty:** Intermediate
**Core concept:** Distribution and existing behavior beat originality; improve what users are already doing
**Key case:** Instagram Stories vs. Snapchat (August 2016)
- Instagram: ~500M MAU, copied Stories feature-for-feature
- Result: 100M DAU in 60 days; Snapchat took 4 years
- Snapchat stock dropped 18% day-of

**Key anti-patterns:**
- Assuming novelty drives adoption
- Proposing a new feature when deepening an existing behavior is more valuable
- Ignoring competitive context when framing an improvement
- Treating a feature copy as a failure rather than a strategic signal

**Curriculum status:** ✅ FLOW JSON written
**Editorial status:** ✅ Post published to Notion — *"Instagram Stole It. Then Won."*
**Challenge status:** 🔲 Not yet created

---

### Module 5 — Trade-off Decisions
**FLOW step focus:** Optimize, Win
**Difficulty:** Advanced
**Core concept:** "It depends" without reasoning is a red flag; name what you're optimizing for, name the sacrifice
**Key frameworks:**
- RICE: Reach × Impact × Confidence ÷ Effort
- Impact-vs-effort matrix (quick wins / big bets / incremental / money pits)
- The Naming Move: "We get X, we sacrifice Y, Y is acceptable because Z"

**Key anti-patterns:**
- "It depends" as an ending, not a starting point
- Treating all options as equally valid
- Optimizing for nothing (no stated goal or metric)
- Ignoring brand, regulatory, or trust constraints — only seeing engineering effort
- Preference-based answers instead of criterion-based reasoning

**Real examples:**
- Spotify Wrapped: zero direct revenue, 100M+ shares — explicit trade-off: monetization vs. brand identity
- TikTok algorithm: engagement-based ranking sacrificed incumbent creators to unlock creator democracy

**Curriculum status:** ✅ FLOW JSON written
**Editorial status:** ✅ Post published to Notion — *"'It Depends' Is Not an Answer"*
**Challenge status:** 🔲 Not yet created

---

### Module 6 — Jobs to Be Done (User Empathy)
**FLOW step focus:** Frame, List
**Difficulty:** Beginner
**Core concept:** Users hire products to get a job done — functional, emotional, and social
**Key framework:** Three job types:
- **Functional** — the pure task (track calories)
- **Emotional** — how they want to feel (feel less guilty after dinner)
- **Social** — what it signals to others (prove discipline to my running club)

**Key examples:**
- Spotify Wrapped: job = identity signaling, not data display
- Gmail 1GB storage: job = "stop making me decide what to delete" (constraint removal)
- Fitness apps: same product, two completely different emotional and social jobs

**Key anti-patterns:**
- Treating the feature as the job (not the outcome)
- Optimizing only for functional job, ignoring emotional and social dimensions
- Assuming all users hire the product for the same job
- Confusing what the product does with why users love it

**Curriculum status:** ✅ FLOW JSON written
**Editorial status:** ✅ Post published to Notion — *"Spotify Wrapped Isn't a Feature"*
**Challenge status:** 🔲 Not yet created

---

### Module 7 — Product Strategy & Competitive Moats
**FLOW step focus:** Frame, List, Optimize, Win
**Difficulty:** Advanced
**Core concept:** Technical superiority without a moat is a feature, not a business
**Key frameworks:**
- Moat types: network effects, switching costs (individual vs. org-level), data advantage, distribution, ecosystem lock-in
- Aggregation Theory (Ben Thompson): aggregate demand → dictate terms to suppliers
- Defensive vs. offensive product strategy

**Key examples:**
- Figma vs. Sketch: architectural lock-in (org-level coordination layer) → $20B Adobe acquisition
- Threads: 100M users in 5 days → 80% DAU drop. Distribution ≠ product-market fit.
- Slack: all-or-nothing adoption, network effects, context history as moat

**Key anti-patterns:**
- Jumping to features without a moat strategy
- Treating distribution as product-market fit
- Assuming technical superiority creates a moat
- Solving for wrong user segment (acquisition vs. retention require opposite bets)

**Curriculum status:** ✅ FLOW JSON written
**Editorial status:** ✅ Post published to Notion — *"Why Adobe Paid $20B for a Browser Tab"*
**Challenge status:** 🔲 Not yet created

---

### Module 8 — Engineer-to-PM Mindset Shift
**FLOW step focus:** Frame (meta-module — applies to all FLOW steps)
**Difficulty:** Beginner (entry point for new users)
**Core concept:** Engineers don't lack product intuition — they lack vocabulary and reps
**Key framework:** Why-First Check (3 parts):
1. **User Impact** — what happens to a real person if this ships?
2. **Business Viability** — does this connect to someone's actual need?
3. **Engineering Sense** — can we build it well? (comes third, not first)

**The 9 traits of product-minded engineers (Gergely Orosz):**
Proactive ideation, business literacy, curiosity, communication, trade-off analysis, pragmatic edge-case handling, validation cycles, end-to-end ownership, developed instincts

**Key anti-patterns:**
- Asking "how" before "why"
- Treating technical elegance as product success
- Fixing bugs without ROI analysis
- Building for abstract users instead of real ones
- Lacking vocabulary to articulate product intuitions to stakeholders

**Curriculum status:** ✅ FLOW JSON written
**Editorial status:** ✅ Post published to Notion — *"Engineers Don't Lack Intuition. They Lack the Words."*
**Challenge status:** 🔲 Not yet created

---

## Supporting Mental Models (Researched, Not Yet Structured)

These are in the research corpus but haven't been turned into FLOW modules yet. Candidates for next phase.

| Mental Model | Source | Key Insight | Priority |
|---|---|---|---|
| Network Effects (3 types) | MASTER_CORPUS.md | Direct / Cross-side / Indirect — each requires different product strategy | High |
| Growth Loops | MASTER_CORPUS.md | Loops compound; funnels don't. Acquisition loop vs. engagement loop. | High |
| North Star + Input Metrics tree | MASTER_CORPUS.md | Input metrics are the levers; North Star is the outcome | High |
| Monetization Models | MASTER_CORPUS.md | Freemium vs. subscription vs. marketplace vs. usage-based | Medium |
| Platform vs. Product strategy | MASTER_CORPUS.md | When to build a platform and when building a platform kills you | Medium |
| Accessibility as product sense | Research corpus | Designing for constraints surfaces better solutions for everyone | Medium |
| AI product decisions | Research corpus (Shreyas Doshi) | When execution is cheap, judgment is expensive | High |
| The "favorite product" interview answer | PRODUCT_SENSE_EXAMPLE_ANSWERS.md | Most answers are consumer preferences, not product thinking | High |
| User research vs. product sense | Research corpus | Product sense complements, not replaces, user research | Low |

---

## Editorial Posts Status

| # | Title | Type | Status | Notion |
|---|---|---|---|---|
| 1 | Stop Segmenting by Age | Insight | ✅ Ready for Review | [→](https://www.notion.so/33400bae869981d2b745deeefd0cbe56) |
| 2 | Spotify Wrapped Isn't a Feature | Product Story | ✅ Ready for Review | [→](https://www.notion.so/33400bae86998108a514c596f916c197) |
| 3 | The Bug You Shouldn't Fix | Insight | ✅ Ready for Review | [→](https://www.notion.so/33400bae869981c1b817f5bf597c15bd) |
| 4 | Instagram Stole It. Then Won. | Product Story | ✅ Ready for Review | [→](https://www.notion.so/33400bae8699814dbe29e619fabecc4c) |
| 5 | All Your Metrics Are Green and Nobody Cares | Insight | ✅ Ready for Review | [→](https://www.notion.so/33400bae869981218834eb346253662c) |
| 6 | 'It Depends' Is Not an Answer | Insight | ✅ Ready for Review | [→](https://www.notion.so/33400bae86998103851dfcbc5b46bb0b) |
| 7 | Engineers Don't Lack Intuition. They Lack the Words. | Insight | ✅ Ready for Review | [→](https://www.notion.so/33400bae869981f4b3c8e71722c6e7a1) |
| 8 | Why Adobe Paid $20B for a Browser Tab | Product Story | ✅ Ready for Review | [→](https://www.notion.so/33400bae869981d3995bc5b000a8fd12) |

---

## Challenge Design — Decisions Locked

### Decision 1: Question Format Types

Every challenge is tagged with one format identifier. Two classes:

**Interview-Native Formats** (mirrors real PM interview question types):
| ID | Format | Description | Example |
|---|---|---|---|
| `INT-DESIGN` | Product Design | Design a product for X user / Y context | "Design a navigation tool for visually impaired users" |
| `INT-IMPROVE` | Product Improvement | How would you improve [existing product]? | "How would you improve Spotify's discovery experience?" |
| `INT-METRIC` | Metrics & Success | How would you measure success of X? | "How would you measure success of LinkedIn's feed algorithm?" |
| `INT-STRATEGY` | Strategy / Market Entry | Should [company] enter [market]? | "Should Apple enter the health insurance market?" |
| `INT-GROWTH` | Growth | How would you grow X in Y market? | "How would you grow WhatsApp in rural India?" |
| `INT-TRADE` | Tradeoffs | Given constraints A and B, what do you prioritize? | "You have 2 sprints. Ship monetization or fix retention?" |
| `INT-DIAG` | Diagnosis | A metric dropped. What happened? | "DAU on Instagram dropped 15% month-over-month. Why?" |
| `INT-FAV` | Favorite Product | What's your favorite product and why? | "What product do you think is most underrated right now?" |

**HackProduct-Native Formats** (platform-original, scenario-first):
| ID | Format | Description | Example |
|---|---|---|---|
| `HP-SCENARIO` | Luma Scenario | Luma presents a product situation; user diagnoses using FLOW | "A fintech app's activation rate dropped post-redesign. Walk through it." |
| `HP-TEARDOWN` | Case Teardown | Analyze a real product decision with hindsight | "Break down why TikTok's algorithm choice was a strategic values decision" |
| `HP-DEBATE` | Luma Debates You | User makes a call; Luma pushes back; user defends | "You chose retention over growth. Defend it to the skeptical board." |
| `HP-BRIEF` | PM Brief | User receives a fictional PM brief; must FLOW it | "You're PM at a B2B SaaS. Sprint planning in 2 days. Prioritize these 5 issues." |
| `HP-POSTMORTEM` | Product Postmortem | Analyze a product failure using FLOW | "Google+ had 500M users and died. What went wrong at each FLOW step?" |

---

### Decision 2: FLOW Arc Structure

Every case study follows the full FLOW arc — Frame → List → Optimize → Win — as sequential sub-questions within one session.

**Sub-question cap per FLOW step: 3 questions**
Total questions per challenge: **12** (3 per step × 4 steps)

Rationale: 3 per step is enough to build depth without exhausting the user. 12 total fits a focused 15–20 minute session. Luma grades each step separately before unlocking the next.

**Standard FLOW question structure per step:**

```
FRAME (3 sub-questions):
  Q1 — Observation: What do you notice about the situation?
  Q2 — Definition: What is the real problem / goal here?
  Q3 — Constraint: What are we NOT solving, and why?

LIST (3 sub-questions):
  Q1 — Stakeholders: Who is affected? (include non-obvious)
  Q2 — Solution space: What are all the approaches?
  Q3 — Ecosystem: What second-order effects or missing pieces?

OPTIMIZE (3 sub-questions):
  Q1 — Criteria: What are you optimizing for, and why?
  Q2 — Evaluation: How do the options compare against that criterion?
  Q3 — Trade-off: What do you give up, and is it acceptable?

WIN (3 sub-questions):
  Q1 — Recommendation: What do you do? (specific, not vague)
  Q2 — Rationale: Why this over the alternatives?
  Q3 — Validation: How will you know it worked?
```

---

### Decision 3: Company / Scenario Types

Every challenge is also tagged with a **company type**:

| Tag | Type | Description |
|---|---|---|
| `REAL` | Real company, real product | "Improve Spotify's shuffle feature" |
| `FICT-B2C` | Fictional consumer product | "Luma's Closet is a fashion app with a retention problem" |
| `FICT-B2B` | Fictional enterprise/SaaS | "StackFlow is a devtools company. Their trial-to-paid is 4%." |
| `INTERNAL` | Fictional internal decision | "You're PM at Airbnb. Engineering wants to rebuild search. Do you approve?" |

And every challenge is tagged with one of **4 product paradigms**:

| Tag | Paradigm | What it means |
|---|---|---|
| `TRAD` | Traditional | Pre-AI product decisions. Human workflow, no AI involvement. |
| `AI-ASSIST` | AI-Assisted | AI is a tool in the workflow. Copilot, autocomplete, recommendations. |
| `AGENTIC` | Agentic | AI takes multi-step autonomous actions on behalf of users. |
| `AI-NATIVE` | AI-Native | Product is fundamentally impossible without AI at its core. |

**Full challenge ID format:**
`[FORMAT]-[COMPANY TYPE]-[PARADIGM]-[MODULE]-[NUMBER]`

Examples:
- `INT-IMPROVE-REAL-TRAD-MOD3-001` — Real interview, improve a real product, traditional paradigm, metrics module, challenge 1
- `HP-SCENARIO-FICT-B2B-AGENTIC-MOD7-014` — HackProduct native, fictional B2B, agentic paradigm, strategy module, challenge 14
- `HP-BRIEF-INTERNAL-AI-NATIVE-MOD5-003` — PM Brief, internal decision, AI-native paradigm, trade-offs module, challenge 3

---

### Decision 4: Launch Targets

**Total target: 700 challenges**

| Bucket | Count | Source | Status |
|---|---|---|---|
| Case studies (HackProduct-native + interview format) | 500 | Generated from FLOW curriculum + paradigm matrix | 🔲 To build |
| Real interview questions broken into FLOW | 200 | Scraped from corpus (63 questions → expanded + FLOW-structured) | 🔲 To build |
| **Total** | **700** | | |

**Paradigm distribution target (across 500 case studies):**
| Paradigm | Count | Rationale |
|---|---|---|
| Traditional | 150 | Foundation layer — classic interview prep |
| AI-Assisted | 150 | Current reality — most engineers work in AI-assisted environments |
| Agentic | 100 | Emerging — agents making decisions, PM implications |
| AI-Native | 100 | Forward-looking — products impossible without AI at core |

**Format distribution target (across 500 case studies):**
| Format | Count |
|---|---|
| `INT-*` (all interview-native) | 200 |
| `HP-SCENARIO` | 100 |
| `HP-TEARDOWN` | 75 |
| `HP-DEBATE` | 50 |
| `HP-BRIEF` | 50 |
| `HP-POSTMORTEM` | 25 |

**Module distribution target (across 500 case studies):**
Each of the 8 FLOW modules gets ~62 challenges. Supplementary modules (network effects, growth loops, etc.) get ~10 each once created.

**Real interview FLOW breakdown (200 total):**
- Source: `PRODUCT_SENSE_INTERVIEW_CORPUS.md` (63 questions) + additional scraping
- Each question gets restructured into full 12-question FLOW arc
- Expanded to 200 by adding company variants and paradigm variants of existing questions

---

## Target Roles & Domain Matrix

HackProduct serves 10 roles across two cohorts. Every challenge is tagged with one or more target roles.

### The 10 Roles

| ID | Role | Cohort | Product Thinking Context |
|---|---|---|---|
| `SWE` | Software Engineer | v1 | Builds features; needs to ask "why" before "how" |
| `DE` | Data Engineer | v1 | Owns data pipelines; needs to think about data product decisions, metric design |
| `MLE` | ML Engineer | v1 | Trains/deploys models; needs to evaluate AI product tradeoffs (accuracy vs. latency, etc.) |
| `DEVOPS` | DevOps / Platform Eng | v1 | Owns infra; needs to think about internal product decisions, developer experience as product |
| `EM` | Engineering Manager | v1 | Manages teams; needs prioritization, stakeholder management, roadmap thinking |
| `FE` | Founding Engineer | v1 | Early-stage; needs full-stack product thinking — strategy, build/buy, MVP scoping |
| `TL` | Tech Lead | v2 | Bridges eng and product; needs to translate user problems into technical decisions |
| `PM` | Product Manager | v2 | Core user; practices structured product sense for interviews and on-the-job |
| `DES` | Designer | v2 | Owns UX; needs to think beyond aesthetics to user value and business trade-offs |
| `DS` | Data Scientist | v2 | Owns analysis; needs to connect insights to product decisions, not just report findings |

---

### Role × FLOW Module Affinity Map

Which modules matter most to each role. `●` = primary, `○` = secondary, `—` = low relevance.

| Module | SWE | DE | MLE | DEVOPS | EM | FE | TL | PM | DES | DS |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 — User Segmentation | ○ | ○ | ○ | — | ● | ● | ● | ● | ● | ○ |
| 2 — Problem Identification | ● | ○ | ○ | ○ | ● | ● | ● | ● | ● | ○ |
| 3 — Success Metrics | ○ | ● | ● | ○ | ● | ● | ● | ● | ○ | ● |
| 4 — Product Improvement | ● | ○ | ○ | ○ | ● | ● | ● | ● | ● | ○ |
| 5 — Trade-off Decisions | ● | ● | ● | ● | ● | ● | ● | ● | ○ | ● |
| 6 — Jobs to Be Done | ○ | — | ○ | — | ○ | ● | ● | ● | ● | ○ |
| 7 — Strategy & Moats | — | — | ○ | — | ● | ● | ● | ● | ○ | ○ |
| 8 — Engineer→PM Mindset | ● | ● | ● | ● | ● | ● | ● | — | ○ | ● |

---

### Role × Paradigm Affinity

Which paradigms each role encounters most in their actual work:

| Role | TRAD | AI-ASSIST | AGENTIC | AI-NATIVE |
|---|---|---|---|---|
| SWE | ● | ● | ● | ○ |
| DE | ● | ● | ○ | ○ |
| MLE | ○ | ● | ● | ● |
| DEVOPS | ● | ● | ● | ○ |
| EM | ● | ● | ○ | ○ |
| FE | ● | ● | ● | ● |
| TL | ● | ● | ● | ○ |
| PM | ● | ● | ● | ● |
| DES | ● | ● | ○ | ○ |
| DS | ● | ● | ● | ● |

---

### Role × Format Affinity

Which question formats feel most natural and valuable per role:

| Format | SWE | DE | MLE | DEVOPS | EM | FE | TL | PM | DES | DS |
|---|---|---|---|---|---|---|---|---|---|---|
| `INT-DESIGN` | ○ | — | ○ | — | ● | ● | ● | ● | ● | ○ |
| `INT-IMPROVE` | ● | ○ | ○ | ○ | ● | ● | ● | ● | ● | ○ |
| `INT-METRIC` | ○ | ● | ● | ○ | ● | ● | ● | ● | ○ | ● |
| `INT-STRATEGY` | — | — | ○ | — | ● | ● | ● | ● | ○ | ○ |
| `INT-GROWTH` | — | ○ | ○ | — | ● | ● | ○ | ● | ○ | ● |
| `INT-TRADE` | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| `INT-DIAG` | ● | ● | ● | ● | ● | ● | ● | ● | ○ | ● |
| `INT-FAV` | ○ | ○ | ○ | ○ | ○ | ● | ○ | ● | ● | ○ |
| `HP-SCENARIO` | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| `HP-TEARDOWN` | ● | ○ | ○ | ○ | ● | ● | ● | ● | ● | ○ |
| `HP-DEBATE` | ○ | ○ | ○ | ○ | ● | ● | ● | ● | ○ | ○ |
| `HP-BRIEF` | ○ | ○ | ○ | ○ | ● | ● | ● | ● | ○ | ○ |
| `HP-POSTMORTEM` | ● | ○ | ● | ● | ● | ● | ● | ● | ○ | ○ |

---

### Domain-Specific Scenario Contexts Per Role

Each role has domain-specific product scenarios that feel authentic to their world:

**SWE** — API product decisions, open source vs. build, tech debt ROI, feature flag strategy, developer tooling
**DE** — Data pipeline as product, data catalog decisions, schema design trade-offs, data quality as UX, self-serve analytics
**MLE** — Model serving trade-offs (accuracy vs. latency), eval metric choices, training data as product, AI feature rollout, shadow mode decisions
**DEVOPS** — Developer experience as product, CI/CD pipeline design, incident response as product UX, internal tooling prioritization
**EM** — Sprint prioritization, headcount allocation, roadmap negotiation, team structure decisions, skip-level feedback loops
**FE** — MVP scoping, build vs. buy, technical co-founder product decisions, pre-PMF pivots, first-hire prioritization
**TL** — Technical direction as product strategy, architecture decisions with user impact, eng/product interface, spec review
**PM** — Full product sense coverage across all formats and paradigms
**DES** — UX decisions with business trade-offs, design system ROI, accessibility as strategy, research prioritization
**DS** — Metric selection, experiment design trade-offs, insight-to-decision gap, dashboard as product, self-serve analytics design

---

### Challenge Volume by Role (Launch Target Allocation)

Total 700 challenges distributed to ensure every role has enough targeted content:

| Role | Dedicated challenges | Shared/overlap challenges | Total accessible |
|---|---|---|---|
| SWE | 60 | 180 | ~240 |
| DE | 40 | 120 | ~160 |
| MLE | 50 | 140 | ~190 |
| DEVOPS | 35 | 100 | ~135 |
| EM | 60 | 180 | ~240 |
| FE | 55 | 200 | ~255 |
| TL | 55 | 200 | ~255 |
| PM | 80 | 250 | ~330 |
| DES | 45 | 150 | ~195 |
| DS | 50 | 140 | ~190 |

*Overlap: many challenges tagged for 2–4 roles simultaneously. A metrics challenge might be tagged `[MLE, DS, PM, EM]`. A trade-off challenge might be tagged `[SWE, TL, EM]`.*

---

## Source Files

| File | Contents |
|---|---|
| `flow_curriculum.json` | 8 FLOW-structured modules, 139 questions total |
| `MASTER_CORPUS.md` | Synthesized research foundation |
| `PRODUCT_SENSE_INTERVIEW_CORPUS.md` | 63+ interview questions by company and type |
| `PRODUCT_SENSE_QUICK_REFERENCE.md` | Cheat sheet, 8-week prep schedule |
| `PRODUCT_SENSE_EXAMPLE_ANSWERS.md` | 5 fully worked example answers with commentary |
| `PRODUCT_TEARDOWN_RESEARCH.md` | 10 famous product decisions + teardown frameworks |
| `PRODUCT_SENSE_INDEX.md` | Navigation guide |
