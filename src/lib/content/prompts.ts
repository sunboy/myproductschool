// src/lib/content/prompts.ts

export const INTELLECTUAL_THEMES = {
  T1: { name: 'Upstream Before Downstream', step: 'frame', focus: 'Identify the root cause upstream of the stated problem. Ask: what systemic condition makes this problem inevitable? Exclude downstream symptoms.' },
  T2: { name: 'The Job Behind the Feature', step: 'list', focus: 'Surface the underlying job users are hiring the product to do. Options should differ in which job they address, not just how.' },
  T3: { name: 'Simulate the Other Side', step: 'win', focus: 'The recommendation must anticipate stakeholder objections and address the most hostile reading of the situation.' },
  T4: { name: 'Width Before Depth', step: 'list', focus: 'Options must be structurally distinct — different paradigms, not variations of the same approach. Avoid "option A but also B" framing.' },
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

export function buildScrapePrompt(inputText: string): string {
  return `You are a research assistant preparing raw material for a product management challenge.

Given the following article or content, extract:
1. The core business/product situation in 2-3 sentences
2. Up to 3 specific quantitative data points (numbers, percentages, growth rates) — only if genuinely present in the text
3. Whether any tables or structured comparisons exist that would be clearer as a markdown table

Return ONLY valid JSON:
{
  "situation_summary": "...",
  "data_points": ["..."],   // empty array if none found
  "has_table_content": false
}

CONTENT:
${inputText.slice(0, 6000)}`
}

export function buildScenarioPrompt(inputText: string, situationSummary: string): string {
  return `You are an expert PM interviewer creating a scenario for HackProduct, a product thinking practice platform.

Context: ${situationSummary}

Source material:
${inputText.slice(0, 4000)}

Create a realistic PM interview scenario with these exact fields. Return ONLY valid JSON:
{
  "role": "...",            // e.g. "Senior PM at a fintech startup"
  "context": "...",         // 2-3 sentences: company, product, current situation
  "trigger": "...",         // 1 sentence: the specific event forcing a decision
  "question": "...",        // The core PM question being explored (what strategic question does this scenario test?)
  "explanation": "...",     // 2-3 sentences: why this question matters to product thinking
  "engineer_standout": "..." // 1-2 sentences: what makes an engineer's perspective valuable here
}

Rules:
- role is specific (company type, stage, domain)
- context gives enough detail to answer intelligently
- trigger is a concrete event (board meeting, metric drop, competitor launch, etc.)
- question names the PM decision being tested, not just restates the trigger
- explanation connects to a broader product principle`
}

export function buildMcqPrompt(
  scenario: { role: string; context: string; trigger: string },
  step: string,
  themeKey: string,
  referenceAnswer?: string
): string {
  const themes = STEP_THEMES[step]
  const primaryTheme = INTELLECTUAL_THEMES[themes.primary as keyof typeof INTELLECTUAL_THEMES]
  const secondaryTheme = themes.secondary
    ? INTELLECTUAL_THEMES[themes.secondary as keyof typeof INTELLECTUAL_THEMES]
    : null

  const stepPurposes: Record<string, string> = {
    frame: 'Identify the root problem — what is really going on and why does it matter?',
    list: 'Generate structurally distinct options — what are the meaningfully different paths forward?',
    optimize: 'Evaluate tradeoffs — which option wins given explicit criteria, and what are you sacrificing?',
    win: 'Make a crisp recommendation — what exactly should be done and why will it work?',
  }

  return `You are writing MCQ options for a product thinking challenge on HackProduct.

SCENARIO:
Role: ${scenario.role}
Context: ${scenario.context}
Trigger: ${scenario.trigger}

FLOW STEP: ${step.toUpperCase()} — ${stepPurposes[step]}

PRIMARY INTELLECTUAL THEME: ${primaryTheme.name}
Theme instruction: ${primaryTheme.focus}
${secondaryTheme ? `\nSECONDARY THEME: ${secondaryTheme.name}\n${secondaryTheme.focus}` : ''}
${referenceAnswer ? `\nREFERENCE ANSWER (use as basis for BEST option):\n${referenceAnswer}` : ''}

Generate a question and exactly 4 MCQ options. Return ONLY valid JSON:
{
  "question_text": "...",
  "question_nudge": "...",   // hint for the user, ≤40 words, ends with "?"
  "target_competencies": ["motivation_theory"],   // 2-3 from: motivation_theory, cognitive_empathy, taste, strategic_thinking, creative_execution, domain_expertise
  "options": [
    {
      "label": "A",
      "quality": "best",
      "text": "...",
      "explanation": "...",   // why this quality label — 1 sentence
      "competencies": ["motivation_theory"]
    },
    { "label": "B", "quality": "good_but_incomplete", "text": "...", "explanation": "...", "competencies": [...] },
    { "label": "C", "quality": "surface", "text": "...", "explanation": "...", "competencies": [...] },
    { "label": "D", "quality": "plausible_wrong", "text": "...", "explanation": "...", "competencies": [...] }
  ]
}

OPTION RULES:
- All 4 options must be within 20% word count of each other
- The BEST option must NOT be the longest
- No option may reference another option
- Each option must work as a standalone answer
- plausible_wrong sounds smart but misreads the situation
- surface restates the problem without insight
- good_but_incomplete is correct but misses one key dimension that best captures
- best applies the primary intellectual theme correctly`
}

export function buildNudgePrompt(
  scenario: { role: string; context: string; trigger: string },
  step: string,
  questionText: string
): string {
  return `Write a hint/nudge for a PM practice question. The nudge should guide the learner toward the right thinking without giving away the answer.

Scenario: ${scenario.role} — ${scenario.trigger}
Step: ${step}
Question: ${questionText}

Return ONLY valid JSON:
{ "nudge": "..." }

Rules: ≤40 words, ends with "?", references the specific scenario context, surfaces the right thinking dimension without naming the answer.`
}

export function buildTaxonomyPrompt(
  scenario: { role: string; context: string; trigger: string },
  flowStepsSummary: string
): string {
  return `Classify a HackProduct challenge for discovery and filtering.

Scenario: ${scenario.role} — ${scenario.context} — ${scenario.trigger}
Challenge content summary: ${flowStepsSummary}

Return ONLY valid JSON:
{
  "paradigm": "...",             // one of: traditional, ai_assisted, agentic, ai_native — describes the PM paradigm tested (traditional=classic PM tradeoffs, ai_assisted=using AI tools, agentic=autonomous agents, ai_native=AI-first products)
  "industry": "...",             // e.g. Fintech, HealthTech, EdTech, SaaS, E-commerce, Gaming, Media
  "sub_vertical": "...",        // more specific, e.g. "Payments", "EHR", "LMS"
  "difficulty": "standard",     // one of: warmup, standard, advanced, staff_plus
  "estimated_minutes": 20,
  "primary_competencies": ["strategic_thinking"],   // 2-3 from the 6 axes
  "secondary_competencies": ["taste"],              // 1-2
  "frameworks": [],              // e.g. ["Jobs-to-be-Done", "RICE", "Kano"]
  "relevant_roles": ["swe", "em"],    // from: swe, data_eng, ml_eng, devops, founding_eng, em, tech_lead, pm, designer, data_scientist
  "company_tags": [],            // e.g. ["stripe", "netflix"] if clearly about those companies
  "tags": []                     // freeform tags
}`
}
