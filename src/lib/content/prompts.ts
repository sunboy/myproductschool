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
4. Source richness score: how much distinct, usable PM decision content is in this source?

Return ONLY valid JSON:
{
  "situation_summary": "...",
  "data_points": ["..."],   // empty array if none found
  "has_table_content": false,
  "source_richness": "thin" | "normal" | "rich"
}

source_richness guide:
- "thin": short question prompt, brief paragraph, single topic — 1 question per step is right
- "normal": article or scenario with one clear throughline — 1 question per step, maybe 2 for the most complex step
- "rich": long article, multi-part scenario, multiple distinct sub-problems worth testing — 2-3 questions per step is appropriate

CONTENT:
${inputText.slice(0, 6000)}`
}

export function buildScenarioPrompt(inputText: string, situationSummary: string): string {
  return `You are writing a scenario for a product thinking challenge. The voice is Shreyas Doshi: direct, grounded, slightly opinionated, no corporate filler.

Context: ${situationSummary}

Source material:
${inputText.slice(0, 4000)}

Create the scenario with these exact fields. Return ONLY valid JSON:
{
  "role": "...",            // specific: company type, stage, domain. e.g. "PM at a Series B fintech, owns the payments product"
  "context": "...",         // 2-3 sentences. Drop straight into the situation. No "the VP wants" or "stakeholders need". Write it like the person is already in it.
  "trigger": "...",         // 1 sentence: the concrete thing that just happened. Specific, not generic.
  "question": "...",        // The exact decision that needs to be made. Not a restatement of the trigger.
  "explanation": "...",     // 2-3 sentences. Why this problem is interesting — as insight, not instruction. No "this tests your ability to..."
  "engineer_standout": "..." // 1-2 sentences. What an engineer sees here that a pure PM might not. Be specific.
}

Voice rules:
- No em dashes
- No "leverage", "utilize", "holistic", "robust", "seamlessly", "in order to", or similar AI slop
- Context should read like something that actually happened, not a case study prompt
- Explanation should sound like a smart person sharing a real observation, not a rubric description`
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

  return `You are writing a question and MCQ options for a product thinking challenge. The voice is Shreyas Doshi: direct, specific, no corporate filler, no case-study framing.

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
  "question_nudge": "...",   // ≤40 words, ends with "?". Sounds like a smart colleague pointing at the interesting part. Not a hint that gives away the answer.
  "target_competencies": ["motivation_theory"],   // 2-3 from: motivation_theory, cognitive_empathy, taste, strategic_thinking, creative_execution, domain_expertise
  "options": [
    {
      "label": "A",
      "quality": "best",
      "text": "...",
      "explanation": "...",   // 1 sentence: why this is the best reasoning, not why it scores highest
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
- Option text sounds like a real person's reasoning, not a textbook category
- plausible_wrong sounds confident but is solving the wrong problem
- surface is the answer someone gives when they haven't thought hard enough
- good_but_incomplete gets the direction right but misses the key distinction
- best applies the primary intellectual theme, compressed and precise

VOICE RULES:
- No em dashes
- No "leverage", "utilize", "holistic", "robust", "seamlessly", "in order to", or similar
- Question text should be a real question someone would ask, not a prompt scaffold
- Nudge should make the reader stop and think, not nudge them toward the answer`
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

export function buildStepQuestionPlanPrompt(
  scenario: { role: string; context: string; trigger: string; question: string },
  step: string,
  sourceRichness: 'thin' | 'normal' | 'rich',
  rawText: string
): string {
  const maxQuestions = sourceRichness === 'rich' ? 3 : sourceRichness === 'normal' ? 2 : 1

  const stepPurposes: Record<string, string> = {
    frame: 'Identify the root problem: what is really going on and why does it matter?',
    list: 'Generate structurally distinct options: what are the meaningfully different paths forward?',
    optimize: 'Evaluate tradeoffs: which option wins given explicit criteria, and what are you giving up?',
    win: 'Make a crisp recommendation: what exactly should be done and why will it work?',
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

Decide how many questions this step needs (1 to ${maxQuestions}) and what each should focus on.

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
      "focus": "...",           // 1 sentence: what specific reasoning this question tests
      "grading_weight": 1.0    // weights across questions in this step must sum to 1.0
    }
  ]
}`
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
