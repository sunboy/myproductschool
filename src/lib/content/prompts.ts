// src/lib/content/prompts.ts

import type { ScenarioExcerpt } from '@/lib/types'

export const INTELLECTUAL_THEMES = {
  T1: { name: 'Upstream Before Downstream', step: 'frame', focus: 'Identify the root cause upstream of the stated problem. Ask: what systemic condition makes this problem inevitable? Exclude downstream symptoms.' },
  T2: { name: 'The Job Behind the Feature', step: 'list', focus: 'Surface the underlying job users are hiring the product to do. Options should differ in which job they address, not just how.' },
  T3: { name: 'Simulate the Other Side', step: 'win', focus: 'The recommendation must anticipate stakeholder objections and address the most hostile reading of the situation.' },
  T4: { name: 'Width Before Depth', step: 'list', focus: 'Options must be structurally distinct. Different paradigms, not variations of the same approach. Avoid "option A but also B" framing.' },
  T5: { name: 'Name the Criterion, Name the Sacrifice', step: 'optimize', focus: 'Explicit tradeoff criterion must be named. The best answer states what it is optimizing FOR and what it is explicitly giving up.' },
  T6: { name: 'Exclusion Is Precision', step: 'frame', focus: 'The framing must state what is out of scope. Precision comes from what you exclude, not just what you include.' },
  T7: { name: 'A Recommendation Is a Falsifiable Hypothesis', step: 'win', focus: 'The winning answer makes a crisp recommendation that could be proven wrong. Vague consensus answers score lower.' },
} as const

const STEP_THEMES: Record<string, { primary: string; secondary?: string }> = {
  frame:    { primary: 'T1', secondary: 'T6' },
  list:     { primary: 'T4', secondary: 'T2' },
  optimize: { primary: 'T5' },
  win:      { primary: 'T7', secondary: 'T3' },
}

const VOICE_RULES = `VOICE RULES (strict):
- Never address the reader directly with their role. No "You are a tech lead", "As a senior engineer", "Imagine you work at". Drop into the situation as if the reader is already inside it.
- No em dashes. Use commas, periods, or restructure the sentence.
- No AI slop: never use "delve", "leverage", "utilize", "holistic", "robust", "seamlessly", "it's worth noting", "in order to", "as well as".
- Write like Shreyas Doshi or an opinionated staff engineer thinking out loud. Direct, specific, grounded.`

export function buildExpandOpenEndedPrompt(inputRaw: string): string {
  return `You are preparing source material for a grounded product thinking challenge about:

"${inputRaw}"

This prompt is open-ended. Identify 2-3 specific, current tensions or decision moments in this product or company that would make a concrete challenge. For each:
- Name the specific product surface or decision (not "improve X" but something like "X's retrieval latency vs Perplexity")
- Cite a real public data point, metric, or stated position (if you're unsure, mark it [unverified])
- Identify the contrarian or non-obvious angle

Then write source-like material for the most interesting tension, as if it were a short analysis article.

Return ONLY valid JSON:
{
  "expanded_source": "...",        // 600-1000 words written as if it were an article about one specific tension
  "chosen_angle": "...",           // 1 sentence: which tension this challenge will build around
  "grounding_claims": [             // every factual claim you made, one per entry, for verification
    { "claim": "...", "confidence": "high" | "medium" | "low" }
  ]
}

${VOICE_RULES}`
}

export function buildVerifierPrompt(expandedSource: string, groundingClaims: Array<{ claim: string; confidence: string }>): string {
  const claimsList = groundingClaims.map(c => `- [${c.confidence}] ${c.claim}`).join('\n')
  return `You are a factual verifier for product thinking challenge source material. The following expanded source was generated from a short open-ended prompt. Some claims may be fabricated or outdated.

EXPANDED SOURCE:
${expandedSource}

GROUNDING CLAIMS (self-reported):
${claimsList}

Your job:
1. Flag any claim that is likely fabricated, outdated, or cannot be substantiated
2. Rewrite those claims as verified generalizations ("users have reported X" not "X has Y% churn")
3. If a specific metric can't be substantiated, strip it and replace with qualitative framing
4. Preserve contrarian angles that are reasoning-based, even if specific metrics get stripped
5. Return the corrected source material

Rules:
- Prefer "users have reported" / "the company has publicly stated" / "analysts have noted" over invented numbers
- If the whole source is unreliable, return { "verified_source": null, "reason": "..." }

Return ONLY valid JSON:
{
  "verified_source": "..." | null,
  "claims_stripped": ["..."],
  "claims_preserved": ["..."],
  "reason": "..."
}`
}

export function buildScrapePrompt(inputText: string): string {
  return `You are a research assistant preparing raw material for a product thinking challenge used by engineers to sharpen product sense.

From the source below, extract:
1. situation_summary: The core situation in 2-3 sentences. Lead with what's surprising or specific, not the generic framing.
2. data_points: Up to 4 specific quantitative facts (numbers, percentages, growth rates, latencies, prices). Only if genuinely present in the source.
3. insights: 2-4 non-obvious observations. What does this source argue or reveal that a generic product thinker wouldn't already know? Contrarian takes, unusual stakeholder positions, counterintuitive metrics, surprising causal claims. Exclude standard product advice.
4. excerpts: 4-8 verbatim passages from the source (each ≤40 words), tagged by FLOW-step topic.
5. has_table_content: whether structured comparisons exist.
6. source_richness: how much distinct, usable decision content is in this source?

Return ONLY valid JSON:
{
  "situation_summary": "...",
  "data_points": ["..."],
  "insights": ["..."],
  "excerpts": [
    { "id": "e1", "quote": "...", "topic": "framing" | "options" | "tradeoff" | "recommendation" | "context" }
  ],
  "has_table_content": false,
  "source_richness": "thin" | "normal" | "rich"
}

source_richness guide:
- "thin": short prompt or brief paragraph, single topic. 1 question per step is right.
- "normal": article or scenario with one clear throughline. 1 question per step, maybe 2 for the most complex step.
- "rich": long article, multi-part scenario, multiple distinct sub-problems worth testing. 2-3 questions per step appropriate.

CONTENT:
${inputText.slice(0, 6000)}`
}

export function buildScenarioPrompt(inputText: string, situationSummary: string): string {
  return `You are writing a scenario for a product thinking challenge used by engineers (staff engineers, tech leads, founding engineers, EMs, SWEs). The voice is Shreyas Doshi: direct, grounded, slightly opinionated, no corporate filler.

Context: ${situationSummary}

Source material:
${inputText.slice(0, 4000)}

Write the scenario. The reader is already inside the situation. Do not address them. Do not say "you are" or "as a". Write the scene.

Return ONLY valid JSON:
{
  "role": "...",               // METADATA only, not shown as copy. Specific and technical-leaning. Examples: "Tech lead owning the growth surface at a Series B SaaS", "Staff engineer on the platform team at a fintech", "Founding engineer at a 20-person startup", "EM who inherited a struggling product area after a reorg". Use PM-framed roles only if the source is genuinely PM-specific.
  "context": "...",            // 2-3 sentences. Drop straight into the situation. The specific thing that is happening. NO "you are", NO "as a [role]", NO "imagine". Example: "Notifications went from 3 a day to 18. DAU dropped 14% the same week. Engineering says the activity digest quadrupled notification volume."
  "trigger": "...",            // 1 sentence: the concrete thing that just happened. Specific, not generic.
  "question": "...",           // The decision that needs to be made. Not a restatement of the trigger. Not "how should [role] respond", just the decision itself.
  "explanation": "...",        // 2-3 sentences. Why this problem is interesting, as insight not instruction. No "this tests your ability to". No mention of the reader.
  "engineer_standout": "...",  // 1-2 sentences: what an engineer sees in this situation that a pure PM might miss. System-level or technical-angle observation.
  "specific_detail": "..."     // A verbatim or near-verbatim phrase from the source: a company name, a metric, a stakeholder quote, or a contrarian claim. context or trigger MUST incorporate this.
}

${VOICE_RULES}`
}

export function buildMcqPrompt(
  scenario: { role: string; context: string; trigger: string },
  step: string,
  themeKey: string,
  grounding: {
    focus: string
    sourceExcerpts: string[]
    dataPoints: string[]
    insights: string[]
    engineerStandout: string
    siblingFocuses: string[]
  },
  referenceAnswer?: string
): string {
  const themes = STEP_THEMES[step]
  const primaryTheme = INTELLECTUAL_THEMES[themes.primary as keyof typeof INTELLECTUAL_THEMES]
  const secondaryTheme = themes.secondary
    ? INTELLECTUAL_THEMES[themes.secondary as keyof typeof INTELLECTUAL_THEMES]
    : null

  const stepPurposes: Record<string, string> = {
    frame: 'Identify the root problem. What is really going on and why does it matter?',
    list: 'Generate structurally distinct options. What are the meaningfully different paths forward?',
    optimize: 'Evaluate tradeoffs. Which option wins given explicit criteria, and what are you giving up?',
    win: 'Make a crisp recommendation. What exactly should be done and why will it work?',
  }

  const excerptsBlock = grounding.sourceExcerpts.length
    ? `SOURCE EXCERPTS (ground here. Reference specifics verbatim or near-verbatim in options):\n${grounding.sourceExcerpts.map(q => `- "${q}"`).join('\n')}`
    : `SOURCE EXCERPTS: (none available for this step)`

  const dataPointsBlock = grounding.dataPoints.length
    ? `DATA POINTS AVAILABLE:\n${grounding.dataPoints.map(d => `- ${d}`).join('\n')}`
    : `DATA POINTS AVAILABLE: (none)`

  const insightsBlock = grounding.insights.length
    ? `NON-OBVIOUS INSIGHTS FROM SOURCE (best option explanation MUST paraphrase or cite one of these):\n${grounding.insights.map(i => `- ${i}`).join('\n')}`
    : `NON-OBVIOUS INSIGHTS: (none extracted)`

  const siblingBlock = grounding.siblingFocuses.length
    ? `AVOID OVERLAP WITH SIBLING QUESTIONS IN THIS STEP (different angle, different reasoning):\n${grounding.siblingFocuses.map(s => `- ${s}`).join('\n')}`
    : ''

  return `You are writing a question and MCQ options for a product thinking challenge for engineers. The voice is Shreyas Doshi: direct, specific, grounded. Challenge content is consumed by engineers sharpening product sense.

SCENARIO (for context, not for copy):
Role metadata: ${scenario.role}
Context: ${scenario.context}
Trigger: ${scenario.trigger}

FLOW STEP: ${step.toUpperCase()} — ${stepPurposes[step]}

PRIMARY INTELLECTUAL THEME: ${primaryTheme.name}
Theme instruction: ${primaryTheme.focus}
${secondaryTheme ? `\nSECONDARY THEME: ${secondaryTheme.name}\n${secondaryTheme.focus}` : ''}

${excerptsBlock}

${dataPointsBlock}

${insightsBlock}

ENGINEER ANGLE (what makes the engineer's take valuable here): ${grounding.engineerStandout}

THIS QUESTION'S FOCUS: ${grounding.focus}
${siblingBlock}
${referenceAnswer ? `\nREFERENCE ANSWER (basis for BEST option):\n${referenceAnswer}` : ''}

Generate a question and exactly 4 MCQ options. Return ONLY valid JSON:
{
  "question_text": "...",
  "question_nudge": "...",
  "target_competencies": ["..."],
  "options": [
    { "label": "A", "quality": "best", "text": "...", "explanation": "...", "competencies": ["..."] },
    { "label": "B", "quality": "good_but_incomplete", "text": "...", "explanation": "...", "competencies": ["..."] },
    { "label": "C", "quality": "surface", "text": "...", "explanation": "...", "competencies": ["..."] },
    { "label": "D", "quality": "plausible_wrong", "text": "...", "explanation": "...", "competencies": ["..."] }
  ]
}

target_competencies: 2-3 from motivation_theory, cognitive_empathy, taste, strategic_thinking, creative_execution, domain_expertise.

question_nudge: ≤40 words, ends with "?". Sounds like a smart colleague pointing at the interesting part. Not a hint that telegraphs the answer. Does NOT address the reader.

OPTION RULES:
- All 4 options within 20% word count of each other
- BEST option must NOT be the longest
- No option references another option
- Each option is a standalone answer that reads like real reasoning, not a textbook category
- No option starts with "As a [role]" or "I would". Just state the reasoning.
- The BEST option must reference at least one source-specific element (named entity, metric, or insight). Generic product truisms disqualify an option from being BEST.
- plausible_wrong sounds confident but is solving the wrong problem
- surface is the answer someone gives when they haven't thought hard enough
- good_but_incomplete gets the direction right but misses the key distinction
- best applies the primary intellectual theme, compressed and precise, grounded in the source

${VOICE_RULES}`
}

export function buildNudgePrompt(
  scenario: { role: string; context: string; trigger: string },
  step: string,
  questionText: string
): string {
  return `Write a hint for a product thinking question. The hint should point at the interesting part without giving away the answer. The reader is already in the situation. Do not address them.

Scenario context: ${scenario.context}
Trigger: ${scenario.trigger}
Step: ${step}
Question: ${questionText}

Return ONLY valid JSON:
{ "nudge": "..." }

Rules: ≤40 words, ends with "?", references the specific scenario, surfaces the right dimension without naming the answer. No "you are" / "as a [role]" framing.`
}

export function buildStepQuestionPlanPrompt(
  scenario: { role: string; context: string; trigger: string; question: string },
  step: string,
  sourceRichness: 'thin' | 'normal' | 'rich',
  rawText: string
): string {
  const maxQuestions = sourceRichness === 'rich' ? 3 : sourceRichness === 'normal' ? 2 : 1

  const stepPurposes: Record<string, string> = {
    frame: 'Identify the root problem.',
    list: 'Generate structurally distinct options.',
    optimize: 'Evaluate tradeoffs. Name the criterion and the sacrifice.',
    win: 'Make a crisp, falsifiable recommendation.',
  }

  return `You are planning the questions for one FLOW step in a product thinking challenge.

SCENARIO:
Role: ${scenario.role}
Context: ${scenario.context}
Trigger: ${scenario.trigger}
Core question: ${scenario.question}

STEP: ${step.toUpperCase()} — ${stepPurposes[step]}
SOURCE RICHNESS: ${sourceRichness} (max ${maxQuestions} question${maxQuestions > 1 ? 's' : ''} for this step)

SOURCE MATERIAL (excerpt):
${rawText.slice(0, 3000)}

Decide how many questions this step needs (1 to ${maxQuestions}) and what each should focus on. The focus strings you produce WILL be threaded into downstream MCQ generation, so they must be specific and non-overlapping.

Rules for adding a second or third question:
- The source contains a genuinely distinct sub-problem that tests a different aspect of the same step theme
- The questions do not overlap in what reasoning they require
- Do not add questions to seem thorough. Default to 1.

Return ONLY valid JSON:
{
  "question_count": 1,
  "questions": [
    {
      "sequence": 1,
      "focus": "...",           // 1-2 sentences: the specific decision, tension, or reasoning move this question tests. Must be distinct from siblings.
      "grading_weight": 1.0     // weights across questions in this step must sum to 1.0
    }
  ]
}`
}

export function buildTaxonomyPrompt(
  scenario: { role: string; context: string; trigger: string },
  flowStepsSummary: string
): string {
  return `Classify a HackProduct challenge for discovery and filtering. Audience skews engineers: staff engineers, tech leads, founding engineers, EMs, SWEs. Bias relevant_roles toward engineering roles unless the source is genuinely PM-specific.

Scenario: ${scenario.role} — ${scenario.context} — ${scenario.trigger}
Challenge content summary: ${flowStepsSummary}

Return ONLY valid JSON:
{
  "paradigm": "...",             // one of: traditional, ai_assisted, agentic, ai_native
  "industry": "...",             // e.g. Fintech, HealthTech, EdTech, SaaS, E-commerce, Gaming, Media
  "sub_vertical": "...",
  "difficulty": "standard",     // one of: warmup, standard, advanced, staff_plus
  "estimated_minutes": 20,
  "primary_competencies": ["..."],
  "secondary_competencies": ["..."],
  "frameworks": [],
  "relevant_roles": ["swe", "tech_lead", "em"],    // prefer engineering roles by default
  "company_tags": [],
  "tags": []
}

relevant_roles options: swe, data_eng, ml_eng, devops, founding_eng, em, tech_lead, pm, designer, data_scientist.
competencies options: motivation_theory, cognitive_empathy, taste, strategic_thinking, creative_execution, domain_expertise.`
}

// Helper for job-server.ts to decide whether to run the expansion + verifier path
export function isOpenEndedPrompt(inputType: string, inputRaw: string): boolean {
  if (inputType !== 'question') return false
  if (inputRaw.length > 200) return false
  const trimmed = inputRaw.trim().toLowerCase()
  // Heuristics: short + starts with open-ended verbs, or lacks concrete anchors
  const openEndedStarters = /^(how (do|would|could) (you|i|we)|what (would|could|should) you|how to|what's? the best way|why)/
  const hasCompanyOrMetric = /[A-Z][a-z]+[A-Z]|[0-9]+%|\$[0-9]|v[0-9]|\b(build|fix|ship|deprecate)\b.+\b(or|vs|versus)\b/
  return openEndedStarters.test(trimmed) || !hasCompanyOrMetric.test(inputRaw)
}

export type ScrapeResult = {
  situation_summary: string
  data_points: string[]
  insights: string[]
  excerpts: ScenarioExcerpt[]
  has_table_content: boolean
  source_richness: 'thin' | 'normal' | 'rich'
}
