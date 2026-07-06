import { cardSummary, cleanDisplayCopy } from '@/lib/copy/display'
import { isClaudeCodeLab } from '@/lib/labs/types'

export type ChallengeBriefTone = 'context' | 'change' | 'task' | 'support'

export interface ChallengeBriefSection {
  id: string
  title: string
  body: string
  tone: ChallengeBriefTone
}

export interface ChallengePresentationInput {
  challenge_type?: string | null
  title?: string | null
  scenario_context?: string | null
  scenario_trigger?: string | null
  scenario_question?: string | null
  prompt_text?: string | null
  metadata?: Record<string, unknown> | null
}

const GENERIC_TASK_PATTERNS = [
  /design your solution on the canvas/i,
  /use hatch for coaching/i,
  /^you have \d+\s*minutes\.?$/i,
]

function normalizeForCompare(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/^\s*#\s+[^\n]+\n+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function stripLeadingH1(value: string): string {
  return value.replace(/^\s*#\s+[^\n]+\n+/, '').trim()
}

function cleanBody(value: string | null | undefined): string {
  return stripLeadingH1(value ?? '').trim()
}

function isGenericTask(value: string | null | undefined): boolean {
  const text = cleanDisplayCopy(value)
  if (!text) return true
  return GENERIC_TASK_PATTERNS.some((pattern) => pattern.test(text))
}

function isDuplicate(value: string, existing: ChallengeBriefSection[]) {
  const normalized = normalizeForCompare(value)
  return existing.some((section) => normalizeForCompare(section.body) === normalized)
}

function addSection(
  sections: ChallengeBriefSection[],
  section: ChallengeBriefSection,
  options: { allowGeneric?: boolean } = {},
) {
  const body = cleanBody(section.body)
  if (!body) return
  if (!options.allowGeneric && isGenericTask(body)) return
  if (isDuplicate(body, sections)) return
  sections.push({ ...section, body })
}

function hasArrayItems(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0
}

function metadataObject(input: ChallengePresentationInput): Record<string, unknown> {
  return input.metadata && typeof input.metadata === 'object' ? input.metadata : {}
}

function longerProblemText(input: ChallengePresentationInput): string {
  const prompt = cleanBody(input.prompt_text)
  const context = cleanBody(input.scenario_context)
  return prompt.length > context.length + 80 ? prompt : context
}

function buildSupportText(input: ChallengePresentationInput): string {
  const metadata = metadataObject(input)
  const hasTests = hasArrayItems(metadata.test_cases)
  if (input.challenge_type === 'sql') {
    const hasSchema = Boolean(metadata.sql_schema)
    if (hasSchema && hasTests) {
      return 'Use the schema and sample data below. Run visible tests while you work; private grader tests run on submit without showing their expected answers.'
    }
    if (hasSchema) return 'Use the schema and sample data below to write the query.'
    if (hasTests) return 'Run visible tests while you work; private grader tests run on submit without showing their expected answers.'
  }

  if (input.challenge_type === 'algorithm') {
    if (hasTests) {
      return 'Use the starter code for your selected language. Run visible tests while you work; private grader tests check edge cases on submit.'
    }
    return 'Use the starter code for your selected language and explain the complexity of your approach.'
  }

  return ''
}

export function buildChallengeBrief(input: ChallengePresentationInput): ChallengeBriefSection[] {
  const type = input.challenge_type ?? 'flow'
  const sections: ChallengeBriefSection[] = []
  const context = cleanBody(input.scenario_context)
  const trigger = cleanBody(input.scenario_trigger)
  const question = cleanBody(input.scenario_question)

  if (type === 'quick_take') {
    addSection(sections, { id: 'setup', title: 'Setup', body: context || input.prompt_text || '', tone: 'context' })
    addSection(sections, { id: 'catch', title: 'The catch', body: trigger, tone: 'change' })
    addSection(sections, { id: 'answer', title: 'Answer this', body: question, tone: 'task' })
    return sections
  }

  if (type === 'system_design') {
    addSection(sections, { id: 'building', title: "What you're building", body: context || input.prompt_text || input.title || '', tone: 'context' }, { allowGeneric: true })
    addSection(sections, { id: 'handle', title: 'What it must handle', body: trigger, tone: 'change' })
    addSection(sections, {
      id: 'draw',
      title: 'What to draw',
      body: question || 'Draw the core components, APIs, data stores, request flows, failure handling, and monitoring signals.',
      tone: 'task',
    }, { allowGeneric: true })
    if (!sections.some((section) => section.id === 'draw')) {
      addSection(sections, {
        id: 'draw',
        title: 'What to draw',
        body: 'Draw the core components, APIs, data stores, request flows, failure handling, and monitoring signals.',
        tone: 'task',
      }, { allowGeneric: true })
    }
    return sections
  }

  if (type === 'data_modeling') {
    addSection(sections, { id: 'data', title: 'What the data is about', body: context || input.prompt_text || input.title || '', tone: 'context' }, { allowGeneric: true })
    addSection(sections, { id: 'rules', title: 'Rules to capture', body: trigger, tone: 'change' })
    addSection(sections, {
      id: 'model',
      title: 'What to model',
      body: question || 'Model the entities or tables, keys, relationships, cardinality, indexes, and the rules your schema must enforce.',
      tone: 'task',
    }, { allowGeneric: true })
    if (!sections.some((section) => section.id === 'model')) {
      addSection(sections, {
        id: 'model',
        title: 'What to model',
        body: 'Model the entities or tables, keys, relationships, cardinality, indexes, and the rules your schema must enforce.',
        tone: 'task',
      }, { allowGeneric: true })
    }
    return sections
  }

  if (type === 'sql') {
    addSection(sections, { id: 'question', title: 'Question to answer', body: context || input.prompt_text || question, tone: 'context' }, { allowGeneric: true })
    addSection(sections, { id: 'return', title: 'What to return', body: question, tone: 'task' })
    addSection(sections, { id: 'data-tests', title: 'Data and tests', body: buildSupportText(input), tone: 'support' }, { allowGeneric: true })
    return sections
  }

  if (type === 'algorithm') {
    addSection(sections, { id: 'problem', title: 'Problem', body: longerProblemText(input) || question, tone: 'context' }, { allowGeneric: true })
    addSection(sections, { id: 'rules', title: 'Rules and limits', body: buildSupportText(input), tone: 'support' }, { allowGeneric: true })
    return sections
  }

  if (isClaudeCodeLab(type)) {
    addSection(sections, { id: 'question', title: 'Question to answer', body: context || input.prompt_text || '', tone: 'context' }, { allowGeneric: true })
    addSection(sections, { id: 'data', title: 'Data available', body: trigger, tone: 'change' })
    addSection(sections, { id: 'deliver', title: 'What to deliver', body: question, tone: 'task' })
    return sections
  }

  addSection(sections, { id: 'context', title: "What's going on", body: context || input.prompt_text || '', tone: 'context' }, { allowGeneric: true })
  addSection(sections, { id: 'changed', title: 'What changed', body: trigger, tone: 'change' })
  addSection(sections, { id: 'answer', title: 'What you need to answer', body: question, tone: 'task' })
  return sections
}

export function challengeTaskSummary(input: ChallengePresentationInput, maxChars = 140): string {
  const promptSummary = cardSummary(stripLeadingH1(input.prompt_text ?? ''), maxChars)
  if (promptSummary) return promptSummary

  const sections = buildChallengeBrief(input)
  const preferred = sections.find((section) => section.tone === 'task') ?? sections[0]
  return cardSummary(preferred?.body, maxChars)
}
