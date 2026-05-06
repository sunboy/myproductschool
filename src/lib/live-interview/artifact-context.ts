export interface LiveInterviewArtifactSnapshot {
  type: 'canvas' | 'editor'
  discipline?: string
  capturedAt?: number
  elementCount?: number
  elementTypes?: Record<string, number>
  textLabels?: string[]
  code?: string
  language?: string
  cursorLine?: number
  pasteEvents?: Array<{
    length: number
    percentOfBuffer: number
    timestamp: number
  }>
  runResult?: unknown
}

function summarizeRunResult(runResult: unknown): string {
  if (!runResult) return 'not run yet'

  if (typeof runResult === 'string') return runResult.slice(0, 300)

  try {
    return JSON.stringify(runResult).slice(0, 300)
  } catch {
    return 'available but could not be serialized'
  }
}

function summarizeCode(code: string | undefined): { lineCount: number; preview: string } {
  const source = code ?? ''
  const lineCount = source.trim() ? source.split(/\r?\n/).length : 0
  const preview = source.slice(0, 1200)
  return {
    lineCount,
    preview: `${preview}${source.length > preview.length ? '\n...(truncated)' : ''}`,
  }
}

export function buildArtifactContextNote(snapshot?: LiveInterviewArtifactSnapshot | null): string {
  if (!snapshot) return ''
  if (snapshot.type !== 'canvas' && snapshot.type !== 'editor') return ''

  const discipline = typeof snapshot.discipline === 'string'
    ? snapshot.discipline.replace(/_/g, ' ')
    : 'this'

  if (snapshot.type === 'canvas') {
    const elementTypes = snapshot.elementTypes && typeof snapshot.elementTypes === 'object'
      ? snapshot.elementTypes
      : {}
    const typeSummary = Object.entries(elementTypes)
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]))
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ')
    const labels = Array.isArray(snapshot.textLabels)
      ? snapshot.textLabels.filter((label): label is string => typeof label === 'string' && Boolean(label)).slice(0, 10)
      : []
    const elementCount = typeof snapshot.elementCount === 'number' ? snapshot.elementCount : 0

    return `[WORKSPACE SNAPSHOT - WHITEBOARD]
The candidate is using the canvas for a ${discipline} interview.
Canvas elements: ${elementCount}${typeSummary ? ` (${typeSummary})` : ''}.
Visible labels / notes: ${labels.length ? labels.join(' | ') : 'none captured yet'}.`
  }

  const code = summarizeCode(typeof snapshot.code === 'string' ? snapshot.code : undefined)
  const pasteEvents = Array.isArray(snapshot.pasteEvents)
    ? snapshot.pasteEvents.filter((event) => (
        typeof event?.length === 'number' &&
        typeof event.percentOfBuffer === 'number'
      ))
    : []
  const pasteNote = pasteEvents.length
    ? `Recent paste events: ${pasteEvents
        .slice(-3)
        .map((event) => `${event.length} chars (${Math.round(event.percentOfBuffer * 100)}% of buffer)`)
        .join(', ')}.`
    : 'Recent paste events: none captured.'
  const language = typeof snapshot.language === 'string' ? snapshot.language : 'unknown'

  return `[WORKSPACE SNAPSHOT - EDITOR]
The candidate is using the ${language} editor for a ${discipline} interview.
Current code: ${code.lineCount} lines.
${pasteNote}
Last run result: ${summarizeRunResult(snapshot.runResult)}.
Code preview:
${code.preview || '(empty editor)'}
`
}
