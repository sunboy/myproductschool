# HackProduct Content Pipeline

Content generation system for the HackProduct platform. Produces product thinking challenges at scale using Claude (Haiku via your Max plan).

---

## Files

```
content/
├── generate_challenges.py     # Pipeline script — briefs, run, merge
├── CHALLENGE_SPEC.md          # Writing spec + JSON schema (system prompt for every generation)
├── CONTENT_PLANNING.md        # Master planning doc — modules, formats, targets, role matrix
├── challenges_pilot.json      # Pilot batch: 20 challenges across 10 roles
├── challenges_all.json        # Master library (grows over time via merge)
├── flow_curriculum.json       # 8 FLOW modules as structured JSON (curriculum layer)
├── MASTER_CORPUS.md           # Research foundation — frameworks, product decisions, quotes
└── PRODUCT_SENSE_INTERVIEW_CORPUS.md  # 63+ real PM interview questions by company/category
```

---

## The Pipeline

Three commands. Run them in order.

### 1. Generate briefs

Produces a spec file describing what to generate — no API calls yet.

```bash
python3 generate_challenges.py briefs \
  --roles SWE,MLE,DE,DEVOPS,EM,FE,TL,PM,DES,DS \
  --count 2 \
  --modules 1,2,3,4,5,6,7,8 \
  --paradigms TRAD,AI-ASSIST,AGENTIC,AI-NATIVE \
  --formats HP-SCENARIO,INT-TRADE,INT-IMPROVE,HP-BRIEF \
  --out briefs_batch2.json
```

Options:
- `--roles` — comma-separated role codes (see roles below)
- `--count` — challenges per role per module
- `--modules` — which FLOW modules to cover (1–8)
- `--paradigms` — product paradigm tags to cycle through
- `--formats` — challenge format types to cycle through
- `--master` — path to master file to check existing IDs against (default: `challenges_all.json`)

### 2. Run generation

Calls `claude --print` in parallel. Uses your Max plan — no API key needed.

```bash
python3 generate_challenges.py run \
  --briefs briefs_batch2.json \
  --out challenges_batch2.json \
  --parallel 8
```

Options:
- `--parallel` — concurrent claude calls (default: 5, safe up to ~10)
- `--model` — claude model (default: `claude-haiku-4-5-20251001`)

Failed challenges are written to `challenges_batch2_errors.json` for manual review.

### 3. Merge into master

Appends new challenges to `challenges_all.json`. Deduplicates by ID.

```bash
python3 generate_challenges.py merge \
  --batch challenges_batch2.json \
  --master challenges_all.json
```

---

## Roles

| Code | Role |
|------|------|
| SWE | Software Engineer |
| DE | Data Engineer |
| MLE | ML Engineer |
| DEVOPS | DevOps / Platform Engineer |
| EM | Engineering Manager |
| FE | Founding Engineer |
| TL | Tech Lead |
| PM | Product Manager |
| DES | Designer |
| DS | Data Scientist |

## FLOW Modules

| # | Name | Difficulty |
|---|------|-----------|
| 1 | User Segmentation | Beginner |
| 2 | Problem Identification & Prioritization | Intermediate |
| 3 | Defining Success Metrics | Intermediate |
| 4 | Product Improvement (Distribution vs. Novelty) | Intermediate |
| 5 | Trade-off Decisions | Advanced |
| 6 | Jobs to Be Done (User Empathy) | Beginner |
| 7 | Product Strategy & Competitive Moats | Advanced |
| 8 | Engineer-to-PM Mindset Shift | Beginner |

## Formats

**Interview-native:** `INT-DESIGN` `INT-IMPROVE` `INT-METRIC` `INT-STRATEGY` `INT-GROWTH` `INT-TRADE` `INT-DIAG` `INT-FAV`

**HackProduct-native:** `HP-SCENARIO` `HP-TEARDOWN` `HP-DEBATE` `HP-BRIEF` `HP-POSTMORTEM`

## Paradigms

`TRAD` — Traditional (pre-AI workflows)
`AI-ASSIST` — AI as a tool (copilot, autocomplete, recommendations)
`AGENTIC` — AI taking autonomous multi-step actions
`AI-NATIVE` — Product impossible without AI at its core

---

## Challenge ID Format

`[FORMAT]-[COMPANY_TYPE]-[PARADIGM]-[MODULE]-[ROLE]-[SEQ]`

Example: `HP-SCENARIO-FICT-B2C-TRAD-MOD2-SWE-003`

---

## Improving Output Quality

Edit `CHALLENGE_SPEC.md` to change the writing rules, output schema, or image prompt guidelines. Every future generation run picks up the changes automatically. The spec is the single source of truth — do not hardcode writing rules in the script.

To improve a specific challenge type, add examples or negative examples to the relevant section of the spec.

---

## Volume Targets

| Bucket | Target | Status |
|--------|--------|--------|
| HackProduct case studies | 500 | 20 done (pilot) |
| Real interview questions (FLOW-structured) | 200 | 0 done |
| **Total** | **700** | **20 done** |

Next batch: run all 10 roles × all 8 modules × 2 per slot = 160 challenges. Estimated time at `--parallel 8`: ~20 minutes.
