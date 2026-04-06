/**
 * Parses the grading signal JSON block appended by Claude to each Luma response.
 * The system prompt instructs Claude to append:
 *   {"flow_move":"frame","competency":"motivation_theory","signal":"..."}
 * This function strips it from the visible content and returns both.
 */

const SIGNAL_REGEX = /\n?\{["']?flow_move["']?:[\s\S]*$/

const VALID_FLOW_MOVES = new Set(['frame', 'list', 'optimize', 'win'])
const VALID_COMPETENCIES = new Set([
  'motivation_theory',
  'cognitive_empathy',
  'taste',
  'strategic_thinking',
  'creative_execution',
  'domain_expertise',
])

export interface GradingSignal {
  flowMove: string
  competency: string
  signal: string
}

export interface ParsedResponse {
  cleanContent: string
  signal: GradingSignal | null
}

export function parseGradingSignal(rawContent: string): ParsedResponse {
  const match = rawContent.match(SIGNAL_REGEX)

  if (!match) {
    return { cleanContent: rawContent.trim(), signal: null }
  }

  const stripped = rawContent.replace(SIGNAL_REGEX, '').trim()
  // If stripping produced empty content, the entire response was a signal block
  const cleanContent = stripped.length > 0
    ? stripped
    : rawContent.replace(/^\{["']?flow_move["']?:[\s\S]*\}\s*$/, '').trim()

  let signal: GradingSignal | null = null
  try {
    const parsed = JSON.parse(match[0])
    const flowMove = String(parsed.flow_move ?? parsed.flowMove ?? '').toLowerCase()
    const competency = String(parsed.competency ?? '').toLowerCase()
    const signalText = String(parsed.signal ?? '')

    if (
      (VALID_FLOW_MOVES.has(flowMove) || flowMove === 'null' || flowMove === '') &&
      signalText.length > 0
    ) {
      signal = {
        flowMove: VALID_FLOW_MOVES.has(flowMove) ? flowMove : '',
        competency: VALID_COMPETENCIES.has(competency) ? competency : '',
        signal: signalText,
      }
    }
  } catch {
    // JSON parse failed — signal is malformed, skip it
  }

  return { cleanContent, signal }
}
