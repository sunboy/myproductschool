import { autopsyStories, companyHubs, featureAutopsies } from './data'
import { AUTOPSY_BANNED_COPY, AUTOPSY_REQUIRED_IMAGE_ROLES } from './constants'
import type { AutopsyImageRole, AutopsyValidationIssue, FeatureAutopsy } from './types'

const QUICK_READ_CARD_IDS = [
  'setup',
  'decision',
  'wrong-obvious-answer',
  'mechanism',
  'evidence',
  'lesson',
] as const

export function validateAutopsyContent(): AutopsyValidationIssue[] {
  const issues: AutopsyValidationIssue[] = []
  const companySlugs = new Set(companyHubs.map(company => company.slug))
  const storySlugs = new Set<string>()

  if (featureAutopsies.length < 50) {
    issues.push({
      level: 'error',
      path: 'src/lib/autopsies/data.ts',
      message: 'At least 50 feature autopsy queue items are required.',
    })
  }

  for (const story of autopsyStories) {
    const path = story.canonicalPath
    if (!companySlugs.has(story.companySlug)) {
      issues.push({ level: 'error', path, message: `Unknown company slug: ${story.companySlug}` })
    }

    const slugKey = `${story.companySlug}/${story.slug}`
    if (storySlugs.has(slugKey)) {
      issues.push({ level: 'error', path, message: `Duplicate story slug: ${slugKey}` })
    }
    storySlugs.add(slugKey)

    if (story.canonicalPath !== `/autopsies/${story.companySlug}/${story.slug}`) {
      issues.push({ level: 'error', path, message: 'Canonical path does not match public autopsy route.' })
    }

    checkBannedCopy(story, issues)
    validateQuickReadShape(story, issues)
    validateSourceReferences(story, issues)

    if (story.status === 'published') {
      validatePublishedStory(story, issues)
    }
  }

  return issues
}

function checkBannedCopy(story: FeatureAutopsy, issues: AutopsyValidationIssue[]) {
  const searchable = [
    story.title,
    story.dek,
    story.sourceSummary,
    story.replacementPolicy,
    story.backdropWord ?? '',
    story.sourcePackSummary ?? '',
    story.comparison?.title ?? '',
    story.comparison?.before.label ?? '',
    story.comparison?.before.summary ?? '',
    ...(story.comparison?.before.items ?? []),
    story.comparison?.after.label ?? '',
    story.comparison?.after.summary ?? '',
    ...(story.comparison?.after.items ?? []),
    story.quote?.quote ?? '',
    story.quote?.attribution ?? '',
    story.quote?.context ?? '',
    story.principle?.principle ?? '',
    story.principle?.attribution ?? '',
    ...(story.timeline?.flatMap(event => [event.date, event.label, event.description]) ?? []),
    ...story.quickRead.flatMap(card => [card.title, card.body]),
    ...story.flow.flatMap(section => [section.title, ...section.body]),
  ].join('\n')

  if (searchable.includes('\u2014')) {
    issues.push({ level: 'error', path: story.canonicalPath, message: 'Em dash character is not allowed.' })
  }

  const lower = searchable.toLowerCase()
  for (const phrase of AUTOPSY_BANNED_COPY) {
    if (lower.includes(phrase)) {
      issues.push({
        level: 'error',
        path: story.canonicalPath,
        message: `Banned copy phrase found: ${phrase}`,
      })
    }
  }
}

function validatePublishedStory(story: FeatureAutopsy, issues: AutopsyValidationIssue[]) {
  if (story.proofreadStatus !== 'approved') {
    issues.push({ level: 'error', path: story.canonicalPath, message: 'Published story requires approved proofreading.' })
  }

  if (story.sources.length < 5) {
    issues.push({ level: 'error', path: story.canonicalPath, message: 'Published story requires at least 5 sources.' })
  }

  validatePublishedQuickRead(story, issues)
  for (const section of story.flow) {
    if (section.sourceIds.length === 0) {
      issues.push({ level: 'error', path: story.canonicalPath, message: `${section.move} section requires source IDs.` })
    }
  }

  for (const metric of story.metrics) {
    if (metric.confidence === 'unverified') {
      issues.push({ level: 'error', path: story.canonicalPath, message: `Metric is unverified: ${metric.label}` })
    }
    if (metric.sourceIds.length === 0) {
      issues.push({ level: 'error', path: story.canonicalPath, message: `Metric lacks source IDs: ${metric.label}` })
    }
  }

  for (const role of AUTOPSY_REQUIRED_IMAGE_ROLES) {
    const image = story.images.find(item => item.role === role)
    if (!image) {
      issues.push({ level: 'error', path: story.canonicalPath, message: `Missing required image role: ${role}` })
      continue
    }
    if (!image.alt.trim()) {
      issues.push({ level: 'error', path: story.canonicalPath, message: `Image lacks alt text: ${role}` })
    }
    if (!image.caption.trim()) {
      issues.push({ level: 'error', path: story.canonicalPath, message: `Image lacks caption: ${role}` })
    }
    if (!image.watermark) {
      issues.push({ level: 'error', path: story.canonicalPath, message: `Image lacks watermark flag: ${role}` })
    }
    if (image.qaStatus !== 'approved') {
      issues.push({ level: 'error', path: story.canonicalPath, message: `Image QA is not approved: ${role}` })
    }
    if (image.width < 1 || image.height < 1) {
      issues.push({ level: 'error', path: story.canonicalPath, message: `Image dimensions are invalid: ${role}` })
    }
    if (image.bucket !== 'autopsy-images') {
      issues.push({ level: 'error', path: story.canonicalPath, message: `Image must use autopsy-images bucket: ${role}` })
    }
    if (!image.storagePath?.startsWith(`stories/${story.slug}/`)) {
      issues.push({ level: 'error', path: story.canonicalPath, message: `Image lacks versioned Supabase storage path: ${role}` })
    }
    if (!image.storageVersion?.trim()) {
      issues.push({ level: 'error', path: story.canonicalPath, message: `Image lacks storage version: ${role}` })
    }
    if (!image.sha256 || !/^[0-9a-f]{64}$/.test(image.sha256)) {
      issues.push({ level: 'error', path: story.canonicalPath, message: `Image lacks final SHA-256 hash: ${role}` })
    }
    if (image.src.startsWith('/images/autopsies/')) {
      issues.push({ level: 'error', path: story.canonicalPath, message: `Published image still points at local public asset: ${role}` })
    }
  }
}

function validateSourceReferences(story: FeatureAutopsy, issues: AutopsyValidationIssue[]) {
  const sourceIds = new Set(story.sources.map(source => source.id))
  const references = [
    ...story.quickRead.flatMap(card => card.sourceIds.map(sourceId => ({
      sourceId,
      label: `Quick read ${card.id}`,
    }))),
    ...story.flow.flatMap(section => section.sourceIds.map(sourceId => ({
      sourceId,
      label: `${section.move} section`,
    }))),
    ...story.metrics.flatMap(metric => metric.sourceIds.map(sourceId => ({
      sourceId,
      label: `Metric ${metric.label}`,
    }))),
    ...(story.quote?.sourceIds.map(sourceId => ({
      sourceId,
      label: 'Quote',
    })) ?? []),
    ...(story.principle?.sourceIds.map(sourceId => ({
      sourceId,
      label: 'Principle',
    })) ?? []),
  ]

  for (const reference of references) {
    if (!sourceIds.has(reference.sourceId)) {
      issues.push({
        level: 'error',
        path: story.canonicalPath,
        message: `${reference.label} references unknown source ID: ${reference.sourceId}`,
      })
    }
  }
}

function validateQuickReadShape(story: FeatureAutopsy, issues: AutopsyValidationIssue[]) {
  if (story.quickRead.length !== QUICK_READ_CARD_IDS.length) {
    issues.push({ level: 'error', path: story.canonicalPath, message: 'Quick read requires exactly 6 cards.' })
  }

  const imageRoles = new Set<AutopsyImageRole>(AUTOPSY_REQUIRED_IMAGE_ROLES)
  for (const id of QUICK_READ_CARD_IDS) {
    const card = story.quickRead.find(item => item.id === id)
    if (!card) {
      issues.push({ level: 'error', path: story.canonicalPath, message: `Quick read missing card: ${id}` })
      continue
    }
    if (!card.title.trim()) {
      issues.push({ level: 'error', path: story.canonicalPath, message: `Quick read card lacks title: ${id}` })
    }
    if (!card.body.trim()) {
      issues.push({ level: 'error', path: story.canonicalPath, message: `Quick read card lacks body: ${id}` })
    }
    if (!imageRoles.has(card.imageRole)) {
      issues.push({ level: 'error', path: story.canonicalPath, message: `Quick read card uses unsupported image role: ${id}` })
    }
  }
}

function validatePublishedQuickRead(
  story: FeatureAutopsy,
  issues: AutopsyValidationIssue[]
) {
  for (const card of story.quickRead) {
    if (card.confidence === 'unverified') {
      issues.push({ level: 'error', path: story.canonicalPath, message: `Published quick read card is unverified: ${card.id}` })
    }
    if (card.id === 'evidence' && card.sourceIds.length === 0) {
      issues.push({ level: 'error', path: story.canonicalPath, message: 'Published quick read evidence card requires source IDs.' })
    }
  }
}
