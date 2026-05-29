import { createClient } from '@supabase/supabase-js'
import { getShowcaseProduct, getShowcaseProducts } from '@/lib/data/showcase'
import { getSupabaseStoragePublicUrl } from './storage'
import type {
  AutopsyCompanyWithStories,
  AutopsyImage,
  AutopsyImageRole,
  AutopsyStoryType,
  AutopsyStatus,
  CompanyHub,
  FeatureAutopsy,
  ProofreadStatus,
} from './types'

type CompanyRow = {
  slug: string
  name: string
  dek: string
  industry: string
  accent: string
  thesis: string
  timeline: CompanyHub['timeline']
}

type StoryRow = {
  id: string
  company_slug: string
  slug: string
  story_type: AutopsyStoryType
  title: string
  dek: string
  queue_rank: number
  status: AutopsyStatus
  proofread_status: ProofreadStatus
  canonical_path: string
  estimated_read_time: string
  tags: string[]
  source_summary: string
  replacement_policy: string
  featured: boolean
  sources: FeatureAutopsy['sources']
  metrics: FeatureAutopsy['metrics']
  quick_read: FeatureAutopsy['quickRead']
  flow: FeatureAutopsy['flow']
  backdrop_word: string | null
  timeline: FeatureAutopsy['timeline'] | null
  comparison: FeatureAutopsy['comparison'] | null
  quote: FeatureAutopsy['quote'] | null
  principle: FeatureAutopsy['principle'] | null
  source_pack_summary: string | null
}

type StoryVersionRow = {
  id: string
  company_slug: string
  story_slug: string
  version: number
  status: 'draft' | 'approved' | 'published' | 'archived'
}

type ImageRow = {
  story_version_id: string
  role: AutopsyImageRole
  bucket: string
  storage_path: string
  public_url: string | null
  width: number
  height: number
  alt: string
  caption: string
  sha256: string
  watermark: boolean
  qa_status: AutopsyImage['qaStatus']
}

interface SupabaseAutopsyLibrary {
  companies: AutopsyCompanyWithStories[]
  stories: FeatureAutopsy[]
}

function storyKey(companySlug: string, storySlug: string) {
  return `${companySlug}/${storySlug}`
}

function sortStories(a: FeatureAutopsy, b: FeatureAutopsy) {
  if (a.storyType !== b.storyType) {
    return a.storyType === 'company_teardown' ? -1 : 1
  }
  return a.queueRank - b.queueRank || a.title.localeCompare(b.title)
}

function sortCompanies(a: AutopsyCompanyWithStories, b: AutopsyCompanyWithStories) {
  return a.name.localeCompare(b.name)
}

function rowToCompany(row: CompanyRow): CompanyHub {
  return {
    slug: row.slug,
    name: row.name,
    dek: row.dek,
    industry: row.industry,
    accent: row.accent,
    thesis: row.thesis,
    timeline: row.timeline ?? [],
  }
}

function rowToImage(row: ImageRow, version: StoryVersionRow): AutopsyImage {
  return {
    role: row.role,
    src: row.public_url ?? getSupabaseStoragePublicUrl(row.bucket, row.storage_path) ?? '',
    alt: row.alt,
    caption: row.caption,
    width: row.width,
    height: row.height,
    watermark: row.watermark,
    qaStatus: row.qa_status,
    bucket: row.bucket,
    storagePath: row.storage_path,
    storageVersion: `v${version.version}`,
    sha256: row.sha256,
    ...(row.public_url ? { publicUrl: row.public_url } : {}),
  }
}

function rowToStory(row: StoryRow, images: AutopsyImage[]): FeatureAutopsy {
  return {
    slug: row.slug,
    companySlug: row.company_slug,
    storyType: row.story_type,
    title: row.title,
    dek: row.dek,
    queueRank: row.queue_rank,
    status: row.status,
    proofreadStatus: row.proofread_status,
    canonicalPath: row.canonical_path,
    estimatedReadTime: row.estimated_read_time,
    tags: row.tags ?? [],
    sourceSummary: row.source_summary,
    replacementPolicy: row.replacement_policy,
    featured: row.featured,
    sources: row.sources ?? [],
    metrics: row.metrics ?? [],
    images,
    quickRead: row.quick_read ?? [],
    flow: row.flow ?? [],
    ...(row.backdrop_word ? { backdropWord: row.backdrop_word } : {}),
    ...(row.timeline ? { timeline: row.timeline } : {}),
    ...(row.comparison ? { comparison: row.comparison } : {}),
    ...(row.quote ? { quote: row.quote } : {}),
    ...(row.principle ? { principle: row.principle } : {}),
    ...(row.source_pack_summary ? { sourcePackSummary: row.source_pack_summary } : {}),
  }
}

function legacyCompanyFromProduct(product: {
  slug: string
  name: string
  tagline: string | null
  industry: string | null
  cover_color: string | null
}): CompanyHub {
  return {
    slug: product.slug,
    name: product.name,
    dek: product.tagline ?? `${product.name} company teardown.`,
    industry: product.industry ?? 'Company teardown',
    accent: product.cover_color || '#2c7a52',
    thesis: product.tagline ?? `${product.name} chapter-style autopsy from the original showcase library.`,
    timeline: [
      { date: 'Company teardown', label: 'Readable chapter-style autopsy from the original showcase library.' },
    ],
  }
}

function legacyStoryStub(product: {
  slug: string
  name: string
  tagline: string | null
  industry: string | null
  sort_order?: number
}, story: {
  slug: string
  title: string
  read_time?: string | null
  sort_order?: number | null
}): FeatureAutopsy {
  return {
    slug: story.slug,
    companySlug: product.slug,
    storyType: 'company_teardown',
    title: story.title,
    dek: product.tagline ?? `${product.name} chapter-style company teardown.`,
    queueRank: story.sort_order ?? product.sort_order ?? 999,
    status: 'published',
    proofreadStatus: 'approved',
    canonicalPath: `/autopsies/${product.slug}/${story.slug}`,
    estimatedReadTime: story.read_time ?? '12 min read',
    tags: ['company-teardown', product.industry ?? 'Company teardown'],
    sourceSummary: 'Legacy chapter-style company teardown.',
    replacementPolicy: 'Rendered through the legacy company teardown reader.',
    sources: [],
    metrics: [],
    images: [],
    quickRead: [],
    flow: [],
  }
}

async function getLegacyTeardownStubs() {
  const products = await getShowcaseProducts().catch(() => [])
  const companies = new Map<string, CompanyHub>()
  const stories: FeatureAutopsy[] = []

  await Promise.all(products.map(async product => {
    const detail = await getShowcaseProduct(product.slug).catch(() => null)
    if (!detail?.stories?.length) return

    companies.set(product.slug, legacyCompanyFromProduct(product))
    for (const story of detail.stories) {
      stories.push(legacyStoryStub(product, story))
    }
  }))

  return {
    companies: [...companies.values()],
    stories,
  }
}

export async function getSupabaseAutopsyLibrary(): Promise<SupabaseAutopsyLibrary> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: fetch.bind(globalThis),
      },
    }
  )

  const [{ data: companyRows, error: companyError }, { data: storyRows, error: storyError }] = await Promise.all([
    supabase
      .from('autopsy_companies')
      .select('slug,name,dek,industry,accent,thesis,timeline')
      .order('name', { ascending: true }),
    supabase
      .from('autopsy_content_stories')
      .select([
        'id',
        'company_slug',
        'slug',
        'story_type',
        'title',
        'dek',
        'queue_rank',
        'status',
        'proofread_status',
        'canonical_path',
        'estimated_read_time',
        'tags',
        'source_summary',
        'replacement_policy',
        'featured',
        'sources',
        'metrics',
        'quick_read',
        'flow',
        'backdrop_word',
        'timeline',
        'comparison',
        'quote',
        'principle',
        'source_pack_summary',
      ].join(','))
      .order('queue_rank', { ascending: true }),
  ])

  if (companyError) throw companyError
  if (storyError) throw storyError

  const versionsById = new Map<string, StoryVersionRow>()
  const latestVersionByStory = new Map<string, StoryVersionRow>()
  const imagesByStory = new Map<string, AutopsyImage[]>()
  const typedCompanyRows = (companyRows ?? []) as unknown as CompanyRow[]
  const typedStoryRows = (storyRows ?? []) as unknown as StoryRow[]
  const storySlugs = [...new Set(typedStoryRows.map(row => row.slug))]

  if (storySlugs.length > 0) {
    const { data: versionRows, error: versionError } = await supabase
      .from('autopsy_story_versions')
      .select('id,company_slug,story_slug,version,status')
      .eq('status', 'published')
      .in('story_slug', storySlugs)
      .order('version', { ascending: false })

    if (versionError) throw versionError

    for (const version of (versionRows ?? []) as StoryVersionRow[]) {
      versionsById.set(version.id, version)
      const key = storyKey(version.company_slug, version.story_slug)
      if (!latestVersionByStory.has(key)) {
        latestVersionByStory.set(key, version)
      }
    }

    const versionIds = [...versionsById.keys()]
    if (versionIds.length > 0) {
      const { data: imageRows, error: imageError } = await supabase
        .from('autopsy_story_images')
        .select('story_version_id,role,bucket,storage_path,public_url,width,height,alt,caption,sha256,watermark,qa_status')
        .eq('qa_status', 'approved')
        .in('story_version_id', versionIds)

      if (imageError) throw imageError

      for (const image of (imageRows ?? []) as ImageRow[]) {
        const version = versionsById.get(image.story_version_id)
        if (!version) continue
        const key = storyKey(version.company_slug, version.story_slug)
        const collection = imagesByStory.get(key) ?? []
        collection.push(rowToImage(image, version))
        imagesByStory.set(key, collection)
      }
    }
  }

  const companiesBySlug = new Map<string, CompanyHub>()
  for (const company of typedCompanyRows) {
    companiesBySlug.set(company.slug, rowToCompany(company))
  }

  const stories = typedStoryRows.map(row => {
    const key = storyKey(row.company_slug, row.slug)
    return rowToStory(row, imagesByStory.get(key) ?? [])
  })

  const legacy = await getLegacyTeardownStubs()
  for (const company of legacy.companies) {
    if (!companiesBySlug.has(company.slug)) {
      companiesBySlug.set(company.slug, company)
    }
  }

  const storyMap = new Map<string, FeatureAutopsy>()
  for (const story of [...legacy.stories, ...stories]) {
    storyMap.set(storyKey(story.companySlug, story.slug), story)
  }

  const allStories = [...storyMap.values()].sort(sortStories)
  const companies = [...companiesBySlug.values()]
    .map(company => ({
      ...company,
      stories: allStories
        .filter(story => story.companySlug === company.slug)
        .sort(sortStories),
    }))
    .filter(company => company.stories.length > 0)
    .sort(sortCompanies)

  return {
    companies,
    stories: allStories,
  }
}
