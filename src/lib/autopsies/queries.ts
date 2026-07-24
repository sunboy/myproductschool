import { cache } from 'react'
import { autopsyStories, companyHubs } from './data'
import { getSupabaseAutopsyLibrary } from './db'
import type { FeatureAutopsy } from './types'
import { IS_MOCK } from '@/lib/mock'

function sortStoriesForHub(a: FeatureAutopsy, b: FeatureAutopsy) {
  // Feature autopsies lead: they carry specific hooks ("Gmail Undo Send",
  // "Spotify Wrapped"). The legacy "X, Decoded" company teardowns sort last —
  // ten near-identical titles at the top read as template filler.
  if (a.storyType !== b.storyType) {
    return a.storyType === 'company_teardown' ? 1 : -1
  }
  return a.queueRank - b.queueRank
}

function shouldUseLocalFallback() {
  return process.env.AUTOPSY_LOCAL_FALLBACK === 'true'
    || IS_MOCK
}

function getLocalAutopsyLibrary() {
  return {
    companies: companyHubs
      .map(company => ({
        ...company,
        stories: autopsyStories
          .filter(story => story.companySlug === company.slug)
          .sort(sortStoriesForHub),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    stories: [...autopsyStories].sort(sortStoriesForHub),
  }
}

// React cache() dedupes within a single render pass only. During `next build`,
// every static autopsy page renders separately, so the heavy library fetch
// (companies + stories + versions + images + the legacy showcase fan-out) would
// re-run once per page and hammer Supabase until a statement hits the 8s 57014
// timeout. A module-level promise memoizes it across renders within each build
// worker, so the chain runs once per process instead of once per page.
type AutopsyLibraryResult = Awaited<ReturnType<typeof getSupabaseAutopsyLibrary>>
let autopsyLibraryPromise: Promise<AutopsyLibraryResult> | null = null

// Static export should degrade, not crash the whole build, if a single library
// fetch times out transiently. Enabled automatically during production build.
function shouldDegradeOnBuildTimeout() {
  return process.env.NEXT_PHASE === 'phase-production-build'
}

async function loadAutopsyLibrary(): Promise<AutopsyLibraryResult> {
  try {
    const library = await getSupabaseAutopsyLibrary()
    if (library.companies.length > 0 || library.stories.length > 0) {
      return library
    }
  } catch (error) {
    if (shouldUseLocalFallback() || shouldDegradeOnBuildTimeout()) {
      console.warn('[autopsies] Falling back to local autopsy data after Supabase query failed.', error)
      return getLocalAutopsyLibrary()
    }
    // A memoized rejection would poison every later caller for the process, so
    // clear the cache before rethrowing to allow a fresh attempt.
    autopsyLibraryPromise = null
    throw error
  }

  if (shouldUseLocalFallback()) {
    return getLocalAutopsyLibrary()
  }

  autopsyLibraryPromise = null
  throw new Error('Supabase autopsy content is empty. Run scripts/sync-autopsy-content-supabase.ts before release.')
}

const getAutopsyLibrary = cache(async () => {
  if (!autopsyLibraryPromise) {
    autopsyLibraryPromise = loadAutopsyLibrary()
  }
  return autopsyLibraryPromise
})

export const getAutopsyCompanies = cache(async () => {
  const library = await getAutopsyLibrary()
  return library.companies
})

export const getAutopsyCompany = cache(async (companySlug: string) => {
  const library = await getAutopsyLibrary()
  return library.companies.find(item => item.slug === companySlug) ?? null
})

export const getAutopsyStory = cache(async (companySlug: string, storySlug: string) => {
  const library = await getAutopsyLibrary()
  const company = library.companies.find(item => item.slug === companySlug)
  const story = library.stories.find(item => item.companySlug === companySlug && item.slug === storySlug)
  if (!company || !story) return null
  return { company, story }
})

export const getAutopsyCompanyParams = cache(async () => {
  const library = await getAutopsyLibrary()
  return library.companies.map(company => ({ companySlug: company.slug }))
})

export const getAutopsyStoryParams = cache(async () => {
  const library = await getAutopsyLibrary()
  return library.stories.map(story => ({
    companySlug: story.companySlug,
    storySlug: story.slug,
  }))
})

export const getPublishedAutopsyStories = cache(async () => {
  const library = await getAutopsyLibrary()
  return library.stories
    .filter(story => story.status === 'published')
    .sort(sortStoriesForHub)
})

export const getQueuedAutopsyStories = cache(async () => {
  const library = await getAutopsyLibrary()
  return [...library.stories].sort(sortStoriesForHub)
})

export const getFeaturedAutopsyStory = cache(async () => {
  const library = await getAutopsyLibrary()
  return library.stories.find(story => story.featured)
    ?? library.stories.find(story => story.status === 'published')
    ?? library.stories[0]
})

export const getFeaturedAutopsyForDashboard = cache(async () => {
  const story = await getFeaturedAutopsyStory()
  if (!story) return null
  const library = await getAutopsyLibrary()
  const company = library.companies.find(item => item.slug === story.companySlug)
  return { story, company }
})
