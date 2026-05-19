import { cache } from 'react'
import { autopsyStories, companyHubs } from './data'
import { getSupabaseAutopsyLibrary } from './db'
import type { FeatureAutopsy } from './types'

function sortStoriesForHub(a: FeatureAutopsy, b: FeatureAutopsy) {
  if (a.storyType !== b.storyType) {
    return a.storyType === 'company_teardown' ? -1 : 1
  }
  return a.queueRank - b.queueRank
}

function shouldUseLocalFallback() {
  return process.env.AUTOPSY_LOCAL_FALLBACK === 'true'
    || process.env.USE_MOCK_DATA === 'true'
    || process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'
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

const getAutopsyLibrary = cache(async () => {
  try {
    const library = await getSupabaseAutopsyLibrary()
    if (library.companies.length > 0 || library.stories.length > 0) {
      return library
    }
  } catch (error) {
    if (!shouldUseLocalFallback()) {
      throw error
    }
    console.warn('[autopsies] Falling back to local autopsy data after Supabase query failed.', error)
  }

  if (shouldUseLocalFallback()) {
    return getLocalAutopsyLibrary()
  }

  throw new Error('Supabase autopsy content is empty. Run scripts/sync-autopsy-content-supabase.ts before release.')
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
