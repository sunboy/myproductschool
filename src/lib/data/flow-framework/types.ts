export type DisciplineId = 'product_sense' | 'system_design' | 'data_modeling' | 'coding'
export type FlowStepId = 'F' | 'L' | 'O' | 'W'
export type AnimationMode = 'subtle' | 'cinematic' | 'maximalist'

export interface Tradition {
  id: string
  glyph: number
  label: string
  contribution: string
  body: string
  absorbed: string[]
  leftBehind: string[]
  reasoningMove: string
}

export interface Competency {
  id: string
  label: string
  what: string
  body: string
  measuredIn: string[]
  coaching: string
  failureMode: string
  reasoningMove: string
}

export interface FlowStep {
  id: FlowStepId
  label: FlowStepId
  name: string
  criteria: string
  body: string
  criteriaList: Array<{
    code: string
    title: string
    desc: string
  }>
  antiPatterns: string[]
  reasoningMove: string
}

export type DisciplineEdges = Record<string, string[]>

export interface LearnerExplanation {
  plainPurpose: string
  examplePrompt: string
  stepMeanings: Record<FlowStepId, string>
  practiceOutcome: string
}

export interface Discipline {
  id: DisciplineId
  name: string
  tagline: string
  tabLabel: string
  learnerExplanation: LearnerExplanation
  traditions: Tradition[]
  competencies: Competency[]
  steps: FlowStep[]
  edges: DisciplineEdges
}
