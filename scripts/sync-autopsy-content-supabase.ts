import crypto from 'node:crypto'
import { loadEnvConfig } from '@next/env'
import { createAdminClient } from '@/lib/supabase/admin'
import { autopsyStories, companyHubs } from '@/lib/autopsies/data'
import type { AutopsyImage, CompanyHub, FeatureAutopsy } from '@/lib/autopsies/types'

loadEnvConfig(process.cwd())

interface CliOptions {
  publishedOnly: boolean
  dryRun: boolean
  storySlugs: Set<string>
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2)
  const storySlugs = new Set<string>()

  for (const arg of args) {
    if (arg.startsWith('--stories=')) {
      for (const slug of arg.slice('--stories='.length).split(',')) {
        if (slug.trim()) storySlugs.add(slug.trim())
      }
    }
  }

  return {
    publishedOnly: args.includes('--published-only'),
    dryRun: args.includes('--dry-run'),
    storySlugs,
  }
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function sha256(value: unknown) {
  return crypto.createHash('sha256').update(stableStringify(value)).digest('hex')
}

function storyPayload(story: FeatureAutopsy) {
  return {
    company_slug: story.companySlug,
    slug: story.slug,
    story_type: story.storyType,
    title: story.title,
    dek: story.dek,
    queue_rank: story.queueRank,
    status: story.status,
    proofread_status: story.proofreadStatus,
    canonical_path: story.canonicalPath,
    estimated_read_time: story.estimatedReadTime,
    tags: story.tags,
    source_summary: story.sourceSummary,
    replacement_policy: story.replacementPolicy,
    featured: story.featured ?? false,
    sources: story.sources,
    metrics: story.metrics,
    quick_read: story.quickRead,
    flow: story.flow,
    backdrop_word: story.backdropWord ?? null,
    timeline: story.timeline ?? null,
    comparison: story.comparison ?? null,
    quote: story.quote ?? null,
    principle: story.principle ?? null,
    source_pack_summary: story.sourcePackSummary ?? null,
    content_sha256: sha256({
      ...story,
      images: undefined,
    }),
    published_at: story.status === 'published' ? new Date().toISOString() : null,
  }
}

function companyPayload(company: CompanyHub) {
  return {
    slug: company.slug,
    name: company.name,
    dek: company.dek,
    industry: company.industry,
    accent: company.accent,
    thesis: company.thesis,
    timeline: company.timeline,
  }
}

function imagePayload(image: AutopsyImage, storyVersionId: string) {
  if (!image.storagePath || !image.sha256) return null
  return {
    story_version_id: storyVersionId,
    role: image.role,
    bucket: image.bucket ?? 'autopsy-images',
    storage_path: image.storagePath,
    public_url: image.publicUrl ?? image.src,
    width: image.width,
    height: image.height,
    alt: image.alt,
    caption: image.caption,
    sha256: image.sha256,
    watermark: image.watermark,
    qa_status: image.qaStatus,
  }
}

async function main() {
  const options = parseArgs()
  const selectedStories = autopsyStories.filter(story => {
    if (options.publishedOnly && story.status !== 'published') return false
    if (options.storySlugs.size > 0 && !options.storySlugs.has(story.slug)) return false
    return true
  })
  const selectedCompanySlugs = new Set(selectedStories.map(story => story.companySlug))
  const selectedCompanies = companyHubs.filter(company => selectedCompanySlugs.has(company.slug))

  console.log(`Preparing to sync ${selectedCompanies.length} companies and ${selectedStories.length} stories.`)
  if (options.dryRun) {
    console.log('Dry run only. No Supabase writes performed.')
    return
  }

  const supabase = createAdminClient()

  const { error: companyError } = await supabase
    .from('autopsy_companies')
    .upsert(selectedCompanies.map(companyPayload), { onConflict: 'slug' })

  if (companyError) throw companyError

  let imageCount = 0
  for (const story of selectedStories) {
    const { data: savedStory, error: storyError } = await supabase
      .from('autopsy_content_stories')
      .upsert(storyPayload(story), { onConflict: 'company_slug,slug' })
      .select('id')
      .single()

    if (storyError) throw storyError

    const versionStatus = story.status === 'published'
      ? 'published'
      : story.status === 'approved'
        ? 'approved'
        : 'draft'

    const { data: version, error: versionError } = await supabase
      .from('autopsy_story_versions')
      .upsert({
        company_slug: story.companySlug,
        story_slug: story.slug,
        version: 1,
        status: versionStatus,
        content_sha256: sha256(story),
        published_at: story.status === 'published' ? new Date().toISOString() : null,
      }, { onConflict: 'company_slug,story_slug,version' })
      .select('id')
      .single()

    if (versionError) throw versionError

    const imageRows = story.images
      .map(image => imagePayload(image, version.id as string))
      .filter((image): image is NonNullable<typeof image> => Boolean(image))

    if (imageRows.length > 0) {
      const { error: imageError } = await supabase
        .from('autopsy_story_images')
        .upsert(imageRows, { onConflict: 'story_version_id,role' })

      if (imageError) throw imageError
      imageCount += imageRows.length
    }

    console.log(`Synced ${story.companySlug}/${story.slug} (${savedStory.id})`)
  }

  console.log(`Autopsy content sync complete. Images synced: ${imageCount}.`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
