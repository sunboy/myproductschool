import type { SolutionChallengeType } from './schema'

/**
 * System prompt for generating a challenge solution document.
 *
 * Used in two places with identical content rules:
 *  - The lazy generation route (src/app/api/challenges/[id]/solution/generate)
 *  - The backfill job instructions (scripts/solutions/export-solution-jobs.ts
 *    embeds this verbatim into INSTRUCTIONS.md for Claude Code sub-agents)
 */

// When a challenge is stepped-eligible, the server attaches a server-owned
// interactive walkthrough of the optimal approach. The VISUAL STATES (array
// pointers, SQL stage tables, request-flow nodes) are always the platform's: for
// algorithm/SQL they are computed by executing the real reference, for design
// types they are derived from the architecture diagram the model provides. The
// model may write the per-step PROSE (a short title and explanation per step);
// the platform keeps that prose and replaces the visuals with the verified
// trace, matching the model's steps to the trace BY INDEX. So the step count and
// order are decided by the trace, not the model: write a clean walkthrough and
// the platform aligns it to the real states, ignoring any extra steps and
// falling back to its own captions if the counts do not line up.
function steppedTraceNote(challengeType: SolutionChallengeType): string {
  const common =
    'You MAY author a "stepped" diagram for the optimal approach with concise per-step title and explanation text (and an optional one-line decision). The platform keeps your prose but OWNS the visual states: it replaces them with the verified trace and matches your steps to that trace by index, so your step count and order will be aligned to the real states (extra steps are ignored, and if the counts do not match the platform uses its own captions). Do NOT invent pointer positions, intermediate tables, or cell values in the diagram, and do NOT restate the per-step mechanics blow-by-blow in body_md. Keep each explanation insight, not instruction, in one or two short sentences, with no em dashes and no slop.'
  switch (challengeType) {
    case 'algorithm':
      return `A verified interactive step-by-step walkthrough of the optimal approach will be ATTACHED to your solution automatically; its visual states are computed by executing the real algorithm. ${common} Focus the body_md on the invariant, why each move is safe, and the boundary traps. You MAY still include a complexity_curves diagram contrasting approaches.`
    case 'sql':
      return `A verified interactive walkthrough of the optimal query will be ATTACHED to your solution automatically; it animates each query stage by executing the real query against the real setup data, one CTE at a time through to the final result. ${common} Focus the body_md on why the query is built in those stages and what each stage establishes. You MAY still include a schema_tables or comparison_bars diagram.`
    case 'system_design':
    case 'data_modeling':
      return `An interactive request-flow walkthrough of the optimal approach will be ATTACHED to your solution automatically; it is derived from the architecture diagram you provide and lights up each node as a request travels the path. ${common} Make sure the optimal approach carries a clear architecture diagram (the walkthrough is built from it). Focus the body_md on the data flow, the bottleneck, and when this alternative wins.`
    default:
      return `An interactive step-by-step walkthrough of the optimal approach will be ATTACHED to your solution automatically. ${common}`
  }
}

const JSON_CONTRACT = `Return ONLY a JSON object, no markdown fence, matching this exact shape:

{
  "version": 1,
  "challenge_type": "<the challenge type you were given>",
  "overview_md": "markdown. What this problem is really testing. 2-4 short paragraphs.",
  "approaches": [
    {
      "id": "lowercase-slug",
      "title": "Approach name",
      "tagline": "One line: the core idea and what it costs or buys.",
      "body_md": "Long-form markdown. Use ## section headings. This is the meat.",
      "code": { "language": "python|javascript|sql|...", "source": "..." },          // coding types only
      "complexity": { "time": "O(n)", "space": "O(1)", "note": "optional" },          // algorithm only (sql optional)
      "diagram": { ... },                                                             // see diagram specs below
      "tradeoffs": [ { "gain": "...", "cost": "..." } ]                               // required for design types
    }
  ],
  "ai_collaboration": {
    "body_md": "Markdown. How to think and work with an AI assistant on THIS problem.",
    "prompts": [ { "title": "...", "prompt": "A literal prompt the learner can paste to an AI assistant.", "why": "Why this prompt works." } ],
    "pitfalls": [ "Where AI-assisted work on this problem goes wrong." ]
  },
  "key_takeaways": [ "3-5 one-sentence takeaways." ]
}

Diagram specs (use the one that fits; never include x/y coordinates — layout is computed by the renderer):

- flow_steps: { "kind": "flow_steps", "title"?, "steps": [{ "label": "<=80 chars", "detail"?: "<=200 chars", "emphasis"?: true }] }  // 2-7 steps
- architecture: { "kind": "architecture", "title"?, "lanes": ["Client", "Services", "Data"], "nodes": [{ "id": "api", "label": "API Gateway", "sublabel"?, "lane": 1, "role"?: "client|service|store|queue|external" }], "edges": [{ "from": "api", "to": "db", "label"?, "animated"?: true }] }  // <=4 lanes, <=10 nodes, <=14 edges. Every node's lane index must exist; every edge endpoint must be a node id.
- comparison_bars: { "kind": "comparison_bars", "title"?, "unit"?, "bars": [{ "label", "value": 0-100, "color"?: "primary|secondary|tertiary", "annotation"? }] }  // 2-6 bars; values are relative, pick a sensible scale
- complexity_curves: { "kind": "complexity_curves", "title"?, "xLabel"?, "yLabel"?, "curves": [{ "label": "Brute force O(n²)", "shape": "constant|log|linear|linearithmic|quadratic|exponential", "color"? }] }  // 1-4 curves
- schema_tables: { "kind": "schema_tables", "title"?, "tables": [{ "name", "columns": [{ "name", "badges"?: ["PK"|"FK"|"UQ"|"IDX"] }] }], "relations": [{ "from": "orders", "to": "users", "cardinality"?: "1:1|1:N|N:M" }] }  // <=6 tables, <=12 columns each`

const TYPE_RULES: Record<SolutionChallengeType, string> = {
  algorithm: `Structure for an algorithm challenge:
- 2-3 approaches, ordered from the honest starting point to the optimal one (e.g. brute force -> hash map -> two pointers). Each approach needs working code in the challenge's primary language and a complexity block.
- The first approach's body_md must explain WHY a reasonable person starts there and what observation unlocks the next approach. The progression is the lesson, not the final code.
- Include one complexity_curves diagram contrasting the approaches, and optionally a flow_steps diagram for the optimal approach's phases.
- Code must be complete and runnable, matching the function signature from the starter code.`,
  sql: `Structure for a SQL challenge:
- 2-3 approaches where genuinely distinct strategies exist (e.g. correlated subquery -> window function -> self-join). If only one idiomatic solution exists, write 1 approach plus a "variations" section inside its body_md.
- Each approach needs the full SQL in a code block. complexity is optional; when used, describe it in plain terms ("one scan", "scan per row").
- Use a schema_tables diagram when the join structure is the hard part; comparison_bars when contrasting query strategies.`,
  system_design: `Structure for a system design challenge:
- 2-3 architecture alternatives that make DIFFERENT bets (e.g. push vs pull, monolith-first vs event-driven). Not variations of one design.
- Each approach needs an architecture diagram and 2-4 tradeoffs ({gain, cost} pairs). No code blocks.
- body_md should walk the data flow through the diagram, name the bottleneck, and state when this alternative wins.
- The overview must anchor on requirements and scale numbers from the problem statement.`,
  data_modeling: `Structure for a data modeling challenge:
- 2-3 modeling alternatives that make different normalization/access-pattern bets.
- Each approach needs a schema_tables diagram (or architecture diagram if the question is about pipelines) and tradeoffs. No application code; inline SQL DDL snippets inside body_md are fine.
- Call out cardinality decisions and the query patterns each model makes cheap or expensive.`,
  flow: `Structure for a FLOW (product reasoning) challenge:
- Exactly 1 approach: the reasoning walkthrough. Its body_md uses these ## sections: Frame, List, Optimize, Win.
- Each section demonstrates the reasoning move, grounded in the actual scenario and the strongest answer options:
  Frame = find the friction behind the symptom and whose goal is served. List = simulate every stakeholder's success metric and generate structurally distinct options. Optimize = name the criterion and the sacrifice (a real tradeoff, not a preference). Win = a falsifiable bet: metric, threshold, timeline, counter-signal.
- Include a flow_steps diagram of the reasoning chain. Optionally comparison_bars contrasting the option qualities.
- Never name the thinkers behind these patterns. Present reasoning moves, not frameworks with authors.`,
  freeform: `Structure for a freeform challenge:
- Exactly 1 approach: a model answer walkthrough. body_md uses ## sections mapping to Frame, List, Optimize, Win reasoning moves applied to the scenario, ending with a "What separates a strong answer" section.
- Include a flow_steps diagram of the reasoning chain.
- Never name the thinkers behind these patterns.`,
  quick_take: `Structure for a quick-take challenge:
- Exactly 1 approach, short: what a Sharp (top-grade) answer does in 2-3 sentences and why, with 2-3 example sharp answers in body_md, each followed by one line on what makes it sharp.
- Include a flow_steps diagram only if the reasoning has real stages; otherwise omit diagrams.`,
}

const AI_COLLABORATION_RULES = `The ai_collaboration section teaches how to work WITH an AI assistant on this specific problem. This platform trains tech workers to be AI-native, so this section is a first-class part of the solution, not an afterthought.

- body_md: how to decompose THIS problem for an AI pair. Where the human must own the thinking (framing, the decision, the tradeoff call) and where an AI accelerates (enumeration, boilerplate, test cases, devil's advocate). Be concrete to this problem, not generic advice.
- prompts: 2-4 literal prompts the learner can paste into any AI assistant. Each prompt must reference specifics of this problem. Quoted prompts MAY use second person ("Review my schema...") because they are instructions to an AI, not platform copy. Include at least one prompt that uses the AI as a critic of the learner's own answer rather than as an answer machine.
- pitfalls: 2-5 ways AI-assisted work fails on this problem specifically (e.g. the AI proposes the textbook answer that ignores this scenario's constraint; the AI's complexity claim is wrong in this edge case; asking for the answer up front destroys the practice value).
- Stay tool-agnostic: say "an AI assistant", never name specific products or models.`

const STYLE_RULES = `Writing style (hard rules, violations fail validation):
- Direct, confident, slightly opinionated. An experienced staff engineer thinking out loud. Never academic, never corporate.
- NO em dashes (the — character or " -- "). Use a comma, a period, or restructure.
- NO AI slop. Banned: delve, leverage, utilize, holistic, robust, seamlessly, it's worth noting, in order to, as well as, embark on, navigate, unlock, landscape, tapestry, ensure, tailored, cutting-edge, revolutionary, game-changing.
- NO second-person role framing in editorial copy: no "you are a tech lead", "as a senior engineer", "imagine you work at". (Quoted AI prompts inside ai_collaboration.prompts are exempt.)
- Full flowing sentences, not fragments. Explanations read like insight, not instruction.
- Never attribute reasoning patterns to named authors or frameworks-with-authors.
- Markdown: use ## headings to structure long bodies, code fences with language tags, tables where they genuinely compress information. Solutions are read in a narrow pane; prefer short paragraphs.`

export function buildSolutionSystemPrompt(
  challengeType: SolutionChallengeType,
  opts: { hasVerifiedTrace?: boolean } = {},
): string {
  const steppedNote = opts.hasVerifiedTrace ? `\n\n${steppedTraceNote(challengeType)}` : ''
  return `You write the official solution document for a practice challenge on an AI-native education platform for tech workers (engineers practicing product thinking, system design, SQL, and algorithms). The solution appears in a "Solutions" tab after a learner has attempted the challenge. It must teach the reasoning, not just present the answer.

${TYPE_RULES[challengeType]}${steppedNote}

${AI_COLLABORATION_RULES}

${STYLE_RULES}

${JSON_CONTRACT}`
}

/** The full per-type prompt map, exported for the backfill INSTRUCTIONS.md. */
export function buildAllSolutionPromptSections(): Record<SolutionChallengeType, string> {
  const result = {} as Record<SolutionChallengeType, string>
  for (const type of Object.keys(TYPE_RULES) as SolutionChallengeType[]) {
    result[type] = buildSolutionSystemPrompt(type)
  }
  return result
}
