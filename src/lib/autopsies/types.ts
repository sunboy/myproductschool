export type AutopsyStatus = 'draft' | 'researching' | 'proofreading' | 'approved' | 'published' | 'archived'

export type ProofreadStatus = 'not_started' | 'needs_edits' | 'approved'

export type MetricConfidence =
  | 'confirmed'
  | 'high_confidence'
  | 'medium_confidence'
  | 'low_confidence'
  | 'directional_only'
  | 'unverified'

export type SourceTier = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export type AutopsyStoryType = 'company_teardown' | 'feature_autopsy'

export type AutopsyImageRole =
  | 'hero'
  | 'hatch-narrator'
  | 'failure-mechanism'
  | 'evidence-card'
  | 'lesson-frame'
  | 'thumbnail'
  | 'social-cover'

export interface AutopsySource {
  id: string
  title: string
  publisher: string
  url: string
  archiveUrl?: string
  tier: SourceTier
  accessedAt: string
  supports: string
}

export interface AutopsyMetric {
  label: string
  value: string
  confidence: MetricConfidence
  sourceIds: string[]
}

export interface AutopsyImage {
  role: AutopsyImageRole
  src: string
  alt: string
  caption: string
  width: number
  height: number
  watermark: boolean
  qaStatus: 'missing' | 'draft' | 'approved'
  bucket?: string
  storagePath?: string
  storageVersion?: string
  sha256?: string
  publicUrl?: string
}

export interface FlowSection {
  move: 'Frame' | 'List' | 'Optimize' | 'Win'
  title: string
  body: string[]
  sourceIds: string[]
}

export interface AutopsyTimelineEvent {
  date: string
  label: string
  description: string
  type: 'launch' | 'milestone' | 'pivot' | 'today' | string
}

export interface AutopsyComparison {
  title: string
  before: {
    label: string
    items: string[]
    summary: string
  }
  after: {
    label: string
    items: string[]
    summary: string
  }
}

export interface AutopsyQuote {
  quote: string
  attribution: string
  context?: string
  sourceIds: string[]
}

export interface AutopsyPrinciple {
  principle: string
  attribution: string
  sourceIds: string[]
}

export interface QuickReadCard {
  id: 'setup' | 'decision' | 'wrong-obvious-answer' | 'mechanism' | 'evidence' | 'lesson'
  title: string
  body: string
  sourceIds: string[]
  imageRole: AutopsyImageRole
  confidence: MetricConfidence
}

export interface FeatureAutopsy {
  slug: string
  companySlug: string
  storyType: AutopsyStoryType
  title: string
  dek: string
  queueRank: number
  status: AutopsyStatus
  proofreadStatus: ProofreadStatus
  canonicalPath: string
  estimatedReadTime: string
  tags: string[]
  sourceSummary: string
  replacementPolicy: string
  featured?: boolean
  sources: AutopsySource[]
  metrics: AutopsyMetric[]
  images: AutopsyImage[]
  quickRead: QuickReadCard[]
  flow: FlowSection[]
  backdropWord?: string
  timeline?: AutopsyTimelineEvent[]
  comparison?: AutopsyComparison
  quote?: AutopsyQuote
  principle?: AutopsyPrinciple
  sourcePackSummary?: string
}

export interface CompanyHub {
  slug: string
  name: string
  dek: string
  industry: string
  accent: string
  thesis: string
  timeline: Array<{
    date: string
    label: string
  }>
}

export interface AutopsyValidationIssue {
  level: 'error' | 'warning'
  path: string
  message: string
}

export interface AutopsyCompanyWithStories extends CompanyHub {
  stories: FeatureAutopsy[]
}
