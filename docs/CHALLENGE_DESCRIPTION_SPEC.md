# Challenge Description Spec

The standard every published challenge description must meet. Enforced by
`src/lib/content/description-spec.ts` (`validateDescription`), run against the live DB by
`scripts/lint-descriptions.ts`, and applied at publish time by `scripts/commit-interview-seeds.ts`
and the FLOW pipeline validator (`src/lib/content/validator.ts`).

The reference quality bar is a LeetCode problem page: clear prose with inline code for
variables, worked examples with input/output, and an explicit constraints section. Each
challenge type has its own template below.

## Universal rules (all types)

- The body is Markdown rendered by ReactMarkdown (GFM). `##` headings, fenced code blocks,
  inline `code`, bullet lists, and tables all render.
- Inline `code` for every variable, column, table, metric value, and threshold mentioned in prose.
- No em dashes and no `--`. Use a comma, period, or restructure. **Hard error.**
- No second-person role framing ("you are a tech lead", "as a senior engineer", "imagine you").
  Drop into the situation. Role is metadata, not copy.
- No AI slop (see `BANNED_SLOP` in `src/lib/ai/voice-rules.ts`).
- No `#` H1 headings in the body. The page already renders the title; body headings start at `##`.
- Never duplicate the body text into `scenario_trigger` or `scenario_question`.

## algorithm

Body lives in `scenario_context`.

```markdown
{2-4 sentences of prose. State the input, what to compute, and what to return.
Inline `code` for every variable: given an array `prices` where `prices[i]` is ...
If no result is possible, say what to return, e.g. return `0`.}

## Examples

**Example 1:**

```
Input: prices = [7,1,5,3,6,4]
Output: 5
```

Buy on day 2 (`price = 1`) and sell on day 5 (`price = 6`), profit = `6 - 1 = 5`.

**Example 2:**

```
Input: prices = [7,6,4,3,1]
Output: 0
```

No profitable transaction is possible.

## Constraints

- `1 <= prices.length <= 10^5`
- `0 <= prices[i] <= 10^4`
```

Rules:
- 2-3 examples. Example inputs/outputs MUST be copied verbatim from visible (non-hidden)
  `metadata.test_cases` so they are guaranteed correct. The explanation line under each block
  is written prose, one or two sentences, showing the reasoning, not restating the output.
- Constraints are a bullet list of inline-`code` bounds. Every input named in the prose gets a
  bound. Include semantic guarantees ("Exactly one valid answer exists.") as plain bullets.
- `scenario_trigger` = `Solve it in the editor. Run the tests as you go.`
- `scenario_question` = `Write a working solution. Use Hatch for coaching.`

Validator requires: `## Examples` heading with at least one fenced block containing both
`Input:` and `Output:`, and a `## Constraints` heading with at least one bullet.

## sql

Body lives in `scenario_context`. The workspace renders the schema diagram, sample data, and
expected-output table from `metadata.sql_schema` and `metadata.test_cases`, so the body never
hand-writes schema or result tables.

```markdown
{1-2 sentences of business context naming the tables involved: Bookings on Airbnb can be
cancelled by either side. The `bookings` table records one row per booking with its
`property_type` and `status`.}

{The question as one clear paragraph: For each `property_type`, what percentage of bookings
were cancelled?}

## Output

Return one row per `property_type` with columns `property_type` and `cancellation_rate_pct`,
where `cancellation_rate_pct` is rounded to 2 decimal places. Rows may be returned in any order.

## Notes

- Treat `status = 'cancelled_by_guest'` and `'cancelled_by_host'` both as cancellations.
- Property types with zero bookings should not appear.
```

Rules:
- Body must be at least 150 characters. A bare question sentence is not a description.
- `## Output` is required: column names as inline `code`, the row grain, ordering rules
  (derive from the test cases' `match_mode`: `exact_unordered` → "any order",
  `exact_ordered` → state the ORDER BY), and rounding/tie rules.
- `## Notes` is optional: NULL handling, edge cases, definitions worth pinning down.
- `scenario_trigger` = `Write the query in the editor. Run the visible tests as you go.`
- `scenario_question` = NULL (the Output section owns the ask).

## system_design / data_modeling

Body lives in `scenario_context`. Canvas challenges; the user draws, Hatch coaches.

```markdown
{2-3 sentence scenario. Concrete product, concrete tension. Scale numbers inline:
A collaborative document editor serves `1M` daily active users with `500K` concurrently
edited documents. Edits must propagate to every active editor in under `500ms`.}

## Requirements

- {functional bullets, each one capability}

## Scale

- `1M` DAU, `50K` documents with 10+ concurrent editors at peak
- {QPS, storage, growth, retention as inline `code` numbers}

## What to draw   (data_modeling: ## What to model)

- {explicit deliverables: components, APIs, data stores, request flows | entities, keys,
  relationships, cardinality}
```

Rules:
- Scale numbers MUST be specific (`10K writes/s`, `100M users`), never "at scale" or
  "large volume".
- `## Requirements` is required. `## Scale` is required for system_design, recommended for
  data_modeling (constraints/business rules can substitute).
- `scenario_trigger` = the single most destabilizing constraint, one sentence, NOT a copy of
  the context. NULL is acceptable.
- `scenario_question` = NULL. The presentation layer supplies the "What to draw"/"What to model"
  default when the body has no such section.
- `scenario_question` must never equal `scenario_context`.

## flow (and quick_take)

Prose-first. No headings required; the three scenario columns each do one job.

- `scenario_context`: 2-4 sentences. Drop into the situation. At least one concrete number,
  named metric, or quote.
- `scenario_trigger`: exactly 1 sentence. The thing that just happened.
- `scenario_question`: exactly one ask. One `?`, at most 35 words. Not a restatement of the
  trigger, not a multi-part run-on ("Frame X, enumerate Y, name Z, and propose W" is four asks).

## Authoring pipeline integration

- Content skills (`hackproduct-coding-content`, `hackproduct-sql-content`,
  `hackproduct-system-design-content`, `hackproduct-data-modeling-content`) embed these
  templates verbatim and must produce bodies that pass `validateDescription`.
- `scripts/commit-interview-seeds.ts` validates every staged entry before insert and rejects
  failures.
- `scripts/lint-descriptions.ts` audits the live DB:
  `npx tsx --env-file=.env.local scripts/lint-descriptions.ts [--type algorithm] [--ids]`
