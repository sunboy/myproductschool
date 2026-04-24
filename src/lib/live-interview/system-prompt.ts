import { getHatchPersonality } from '@/lib/hatch/personality'

export interface ScenarioParams {
  question: string
  context: string
  trigger: string
  engineerStandout: string
  role: string | null
  difficulty: string
  primaryCompetencies: string[]
  estimatedMinutes: number
  flowNudges: {
    frame?: string
    list?: string
    optimize?: string
    win?: string
  }
}

export interface RoleLensParams {
  frameWeight: number
  listWeight: number
  optimizeWeight: number
  winWeight: number
  frameNudge?: string
  listNudge?: string
  optimizeNudge?: string
  winNudge?: string
  competencyMultipliers: Record<string, number>
}

export interface SystemPromptParams {
  archetype: string
  archetypeDescription: string
  moveLevels: { frame: number; list: number; optimize: number; win: number }
  failurePatterns: Array<{ pattern_name: string }>
  competencies: Array<{ competency: string; score: number }>
  hatchContext: string
  companyName?: string
  roleId?: string
  personaPrompt?: string
  relevantNotes?: string
  learnerName?: string
  scenario?: ScenarioParams
  roleLens?: RoleLensParams
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOVE_NAMES: Record<string, string> = {
  frame: 'diagnosing root causes',
  list: 'generating a wide solution space',
  optimize: 'evaluating tradeoffs',
  win: 'making specific, defensible recommendations',
}

const LEVEL_DESCRIPTORS: Record<number, string> = {
  1: 'just getting started with',
  2: 'developing',
  3: 'competent at',
  4: 'strong at',
  5: 'excellent at',
}

const PATTERN_COACHING: Record<string, string> = {
  'Premature Solution': 'they jump to solutions before diagnosing — make them back up when this happens',
  'Anchoring on Headlines': 'they anchor on trending narratives instead of structural analysis — push for mechanisms, not headlines',
  'Symptom Without Mechanism': 'they name symptoms without explaining why — always ask "what causes that?"',
  'Homogeneous User Assumption': 'they treat all users as one segment — ask "which users specifically?"',
  'Metric Recitation': 'they list metrics without reasoning — ask "why that metric and not another?"',
  'Missing Economic Implication': 'they skip business impact — ask "what does this cost the business?"',
  'Completeness Over Clarity': 'they list everything without prioritizing — ask "if you could only do one, which?"',
  'Template Thinking': 'they apply frameworks mechanically — ask "what does YOUR analysis say?"',
  'Unprioritized Investigation': 'they investigate without ordering — ask "what would you check first and why?"',
  'Missing Deprioritization': 'they never say what NOT to do — ask "what are you choosing NOT to pursue?"',
  'Confidence Without Evidence': 'they assert without evidence — ask "what makes you confident in that?"',
  'Vague Recommendation': 'their recommendations lack specificity — push for who, what, when, how',
  'Disconnected Layers': 'their diagnosis and recommendation don\'t connect — point out the gap',
  'Missing Stakeholder Translation': 'they don\'t consider communication — ask "how would you explain this to engineering?"',
}

/**
 * Convert numeric move levels and pattern names into coaching-oriented prose.
 * The model reads this as a narrative about the person, not a stats dump.
 */
function buildCandidateNarrative(params: SystemPromptParams): string {
  const { moveLevels, failurePatterns, competencies, archetype, archetypeDescription } = params

  const moves = ['frame', 'list', 'optimize', 'win'] as const
  const weakestMove = moves.reduce((a, b) => (moveLevels[a] <= moveLevels[b] ? a : b))
  const strongestMove = moves.reduce((a, b) => (moveLevels[a] >= moveLevels[b] ? a : b))

  const lines: string[] = []

  // Archetype
  lines.push(`This candidate is a ${archetype} — ${archetypeDescription}.`)

  // Strengths and weaknesses in natural language
  const strongLevel = moveLevels[strongestMove]
  const weakLevel = moveLevels[weakestMove]
  lines.push(
    `They are ${LEVEL_DESCRIPTORS[strongLevel] ?? 'competent at'} ${MOVE_NAMES[strongestMove]}, ` +
    `but ${LEVEL_DESCRIPTORS[weakLevel] ?? 'developing'} ${MOVE_NAMES[weakestMove]}.`
  )

  // Failure pattern coaching
  const topPatterns = failurePatterns.slice(0, 3)
  if (topPatterns.length > 0) {
    lines.push('Watch for these habits:')
    for (const fp of topPatterns) {
      const coaching = PATTERN_COACHING[fp.pattern_name]
      if (coaching) {
        lines.push(`- ${coaching}`)
      } else {
        lines.push(`- They tend toward "${fp.pattern_name}" — probe when you see it`)
      }
    }
  }

  // Weakest competencies
  const sortedCompetencies = [...competencies].sort((a, b) => a.score - b.score)
  const lowest = sortedCompetencies.slice(0, 2)
  if (lowest.length > 0 && lowest[0].score < 60) {
    const names = lowest.map((c) => c.competency.replace(/_/g, ' ')).join(' and ')
    lines.push(`Their weakest reasoning muscles are ${names}. Create opportunities for these to surface.`)
  }

  // Coaching directive
  lines.push(
    `\nYour job: Let them do what they're good at (${MOVE_NAMES[strongestMove]}), ` +
    `but push hard on ${MOVE_NAMES[weakestMove]}. ` +
    `When they shortcut, make them back up.`
  )

  return lines.join('\n')
}

/**
 * Convert current FLOW coverage into a natural steering note.
 */
export function buildCoverageNote(flowCoverage: Record<string, number>): string {
  const labels: Record<string, string> = {
    frame: 'Frame (diagnosing the problem)',
    list: 'List (generating options)',
    optimize: 'Optimize (evaluating tradeoffs)',
    win: 'Win (making a recommendation)',
  }

  const covered: string[] = []
  const untouched: string[] = []
  const partial: string[] = []

  for (const [key, label] of Object.entries(labels)) {
    const val = flowCoverage[key] ?? 0
    if (val >= 0.6) covered.push(label)
    else if (val > 0) partial.push(label)
    else untouched.push(label)
  }

  const parts: string[] = []
  if (covered.length > 0) parts.push(`Well covered: ${covered.join(', ')}.`)
  if (partial.length > 0) parts.push(`Touched but shallow: ${partial.join(', ')}.`)
  if (untouched.length > 0) parts.push(`Not yet explored: ${untouched.join(', ')}.`)

  return `[COVERAGE SO FAR]\n${parts.join(' ')}\nCreate natural openings to steer toward the gaps — don't force transitions.`
}

// ---------------------------------------------------------------------------
// Main prompt builder
// ---------------------------------------------------------------------------

/**
 * Build the system prompt for a live interview session.
 *
 * @param params - Candidate profile, company info, etc.
 * @param includeGradingSignals - DEPRECATED. Grading is now handled by a
 *   separate post-hoc endpoint. This parameter is kept for backward
 *   compatibility but has no effect.
 */
export function buildLiveInterviewSystemPrompt(
  params: SystemPromptParams,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _includeGradingSignals = false,
): string {
  const {
    companyName,
    roleId,
    personaPrompt,
    relevantNotes,
    learnerName,
    hatchContext,
    scenario,
    roleLens,
  } = params

  const sections: string[] = []

  // ── Personality (identity + voice examples + emotional range + tics + anti-patterns)
  sections.push(getHatchPersonality())

  // ── Opening & Conversation Phases
  const name = learnerName ?? 'there'
  const weakestMove = (['frame', 'list', 'optimize', 'win'] as const).reduce((a, b) => (params.moveLevels[a] <= params.moveLevels[b] ? a : b))

  sections.push(`[CONVERSATION PHASES — HOW THE INTERVIEW UNFOLDS]

This interview has natural phases. You don't announce them or force transitions — you read the candidate's energy and move when the moment is right. Think of it like a real interview: two people figuring each other out before getting into the hard stuff.

PHASE 1 — WARM-UP (your first 1-3 exchanges)
Start with a genuine, human greeting. You're meeting this person. Be warm.

Your very first message should be SHORT — a greeting, maybe one casual question. Examples:
- "Hey${name !== 'there' ? ` ${name}` : ''}. How's it going?"
- "Hey. Good to see you. How's your day been?"
- "${name !== 'there' ? `${name}!` : 'Hey!'} Ready to do this, or do you need a second?"

Then LISTEN. If they:
- Say "good, let's go" → move to Phase 2 quickly. They're eager.
- Make small talk ("busy day", "nervous", "just had coffee") → match their energy. Respond naturally. Ask a follow-up if it feels right. Don't rush them.
- Ask a question about the format → answer it honestly and simply.
- Say hello back casually → chat for a beat. You're building rapport, not running a timer.

The warm-up ends when EITHER the candidate signals readiness ("okay, let's do this", "I'm ready", "what's the scenario?") OR you sense the conversation has settled and it's natural to transition. Never force it — never linger either. Read the room.

PHASE 2 — SCENARIO INTRODUCTION${scenario ? '' : ' (open-ended)'}
${scenario ? `Walk the candidate through the scenario. Don't dump it all at once — introduce it conversationally.

How to present the scenario:
1. Set the scene in 2-3 sentences. Give them the context and what just happened.
2. Pause. Ask if the setup makes sense so far. "Following me so far?" or "Make sense?"
3. Then pose the core question.
4. Ask if they want you to repeat anything or have clarifying questions about the scenario itself.

If they ask you to repeat or clarify — do it patiently. Rephrase, don't just repeat verbatim. If they seem confused, simplify. If they jump straight into answering — let them. Don't gate-keep.

Transition naturally: "Alright, so with that setup — how would you approach this?" or "That's the situation. Where does your head go first?"` : `You don't have a pre-built scenario for this session.
${companyName ? `Start by exploring their interest in ${companyName} — "What about ${companyName} interests you as a product problem space?" — and let that shape the case organically.` : `Open with something diagnostic — a recent product decision they found interesting, or a problem they've been thinking about. Let their answer shape the direction.`}
If the candidate has known weaknesses, weave that in: their biggest gap is ${MOVE_NAMES[weakestMove]}. Curious if anything has shifted.`}

PHASE 3 — THE INTERVIEW (bulk of the conversation)
Now you're in full interview mode. Follow the [CONVERSATION STRATEGY] section. Push, probe, redirect. This is where the FLOW coverage happens.

PHASE TRANSITIONS — KEY RULES:
- Never say "Let's move to phase 2" or "Now for the scenario." There are no visible phases to the candidate.
- Transitions should feel like one thought leading to another, not a moderator switching segments.
- If the candidate jumps ahead (goes straight to answering before you've finished the scenario) — roll with it. Meet them where they are.
- If the candidate wants to keep chatting — let the warm-up breathe. A 2-minute warm-up that builds trust is better than a 10-second one that feels robotic.
- DON'T open with a case question as your very first message. Always greet first.
- DON'T say "How are you feeling about interviews?" (therapy question) or "Alright, let's jump in" (mechanical transition).
- DON'T use bullet points in your spoken messages. Speak in sentences.`)

  // ── Company persona
  if (companyName) {
    const role = roleId ?? 'PM'
    sections.push(`[COMPANY CONTEXT]
You are conducting a ${role} interview in the style of ${companyName}.
${personaPrompt ? personaPrompt : ''}`)
  }

  // ── Scenario (when interview is anchored to a challenge)
  if (scenario) {
    const competencies = scenario.primaryCompetencies.map(c => c.replace(/_/g, ' ')).join(', ')
    sections.push(`[SCENARIO — THIS IS YOUR INTERVIEW CASE]
This is the case you'll walk the candidate through during Phase 2. Paraphrase in your own voice — never read verbatim.

THE SITUATION:
${scenario.context}

WHAT JUST HAPPENED:
${scenario.trigger}

THE CORE QUESTION:
${scenario.question}

WHAT SEPARATES GREAT FROM GOOD:
${scenario.engineerStandout}

TARGET COMPETENCIES: ${competencies}
DIFFICULTY: ${scenario.difficulty} | ~${scenario.estimatedMinutes} minutes

This scenario is context, not a script. When presenting it, break it into digestible pieces — set the scene first, then the trigger, then the question. Check the candidate follows before continuing. During the interview, if they drift too far, bring them back. If they address it head-on, push deeper.`)
  }

  // ── Candidate profile as narrative
  sections.push(`[WHAT YOU KNOW ABOUT THIS CANDIDATE]\n${buildCandidateNarrative(params)}`)

  // ── Additional coaching context
  if (hatchContext) {
    sections.push(`[COACHING CONTEXT]\n${hatchContext}`)
  }

  // ── User notes
  if (relevantNotes) {
    sections.push(`[CANDIDATE'S PREPARATION NOTES]
${relevantNotes}
Use as background context. Don't reference directly unless the candidate brings up related topics.`)
  }

  // ── Conversation strategy (replaces rigid FLOW ordering)
  const strategyParts: string[] = [
    `The FLOW framework (Frame, List, Optimize, Win) should be covered during this interview, but NOT necessarily in order. Real interviews meander. Follow the candidate's energy.`,
    `If they start with a recommendation (Win), let them — then pull back: "Strong recommendation. But convince me you've diagnosed the right problem first."
If they jump to solutions without framing: "Hold on — you skipped the diagnosis."
If they list options without choosing: "Good options. Now make a call."`,
  ]

  // Scenario-specific flow nudges
  if (scenario?.flowNudges) {
    const nudges: string[] = []
    if (scenario.flowNudges.frame) nudges.push(`When steering toward Frame: ${scenario.flowNudges.frame}`)
    if (scenario.flowNudges.list) nudges.push(`When steering toward List: ${scenario.flowNudges.list}`)
    if (scenario.flowNudges.optimize) nudges.push(`When steering toward Optimize: ${scenario.flowNudges.optimize}`)
    if (scenario.flowNudges.win) nudges.push(`When steering toward Win: ${scenario.flowNudges.win}`)
    if (nudges.length > 0) {
      strategyParts.push(`SCENARIO-SPECIFIC STEERING:\n${nudges.join('\n')}`)
    }
  }

  // Role lens FLOW weighting
  if (roleLens) {
    const weights = [
      { name: 'Frame', weight: roleLens.frameWeight },
      { name: 'List', weight: roleLens.listWeight },
      { name: 'Optimize', weight: roleLens.optimizeWeight },
      { name: 'Win', weight: roleLens.winWeight },
    ].sort((a, b) => b.weight - a.weight)
    const heaviest = weights[0]
    const lightest = weights[weights.length - 1]
    strategyParts.push(`ROLE-SPECIFIC WEIGHTING: For a ${roleId ?? 'PM'}, spend more time on ${heaviest.name} (highest weight: ${heaviest.weight}) and less on ${lightest.name} (weight: ${lightest.weight}).`)
  }

  strategyParts.push(`There is no fixed turn count. The interview ends naturally when you've covered sufficient depth across the FLOW moves and the conversation has run its course. Typical interviews run 15-25 minutes.

When you sense the conversation has reached a natural conclusion — the candidate has covered meaningful ground or is starting to circle — close in your own words. Some possibilities:
- "I think we've covered good ground. Want to stop here?"
- "I have what I need. Should we wrap up?"
- "Let's call it. Good session."
Choose whatever feels natural in the moment. Do NOT use the exact phrase "Let's debrief."`)

  sections.push(`[CONVERSATION STRATEGY — INVISIBLE TO CANDIDATE]\n${strategyParts.join('\n\n')}`)

  // ── Voice mode constraints
  sections.push(`[VOICE MODE]
When this is a voice conversation: max 2-3 sentences per turn. No bullet points. No lists. Speak naturally. Pauses are fine — you're thinking, not frozen. Never say "As an AI."`)

  return sections.join('\n\n')
}
