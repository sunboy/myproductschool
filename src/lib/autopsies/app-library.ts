import type { AutopsyCompanyWithStories, FeatureAutopsy } from './types'
import type { AutopsyProduct } from '@/lib/types'

export function hasLegacyCompanyTeardown(story: FeatureAutopsy) {
  return story.storyType === 'company_teardown' && story.status === 'published'
}

export function isReadableAppAutopsyStory(story: FeatureAutopsy) {
  return story.status === 'published' || hasLegacyCompanyTeardown(story)
}

export function sortReadableAppStories(a: FeatureAutopsy, b: FeatureAutopsy) {
  if (a.storyType !== b.storyType) {
    return a.storyType === 'company_teardown' ? -1 : 1
  }

  if (a.status !== b.status) {
    return a.status === 'published' ? -1 : 1
  }

  return a.queueRank - b.queueRank
}

export function getReadableAppStories(stories: FeatureAutopsy[]) {
  return stories
    .filter(isReadableAppAutopsyStory)
    .sort(sortReadableAppStories)
}

export function scoreReadableAppHub(company: AutopsyCompanyWithStories) {
  const published = company.stories.filter(story => story.status === 'published').length
  const teardowns = company.stories.filter(hasLegacyCompanyTeardown).length
  const featured = company.stories.some(story => story.featured) ? 1 : 0

  return published * 100 + teardowns * 50 + featured * 10 + company.stories.length
}

export function getReadableAppCompanies(companies: AutopsyCompanyWithStories[]) {
  return companies
    .map(company => ({
      ...company,
      stories: getReadableAppStories(company.stories),
    }))
    .filter(company => company.stories.length > 0)
    .sort((a, b) => scoreReadableAppHub(b) - scoreReadableAppHub(a) || a.name.localeCompare(b.name))
}

export function getReadableLegacyShowcaseProducts(products: AutopsyProduct[]) {
  return products
    .filter(product => product.is_published && (product.story_count ?? 0) > 0)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
}

export function getReadableLegacyOnlyShowcaseProducts(
  products: AutopsyProduct[],
  existingCompanySlugs: Iterable<string>
) {
  const existingSlugs = new Set(existingCompanySlugs)
  return getReadableLegacyShowcaseProducts(products)
    .filter(product => !existingSlugs.has(product.slug))
}

export function getFeaturedAppStory(stories: FeatureAutopsy[]) {
  const readableStories = getReadableAppStories(stories)

  return readableStories.find(story => story.slug === 'buffer-fake-landing-page-mvp')
    ?? readableStories.find(story => story.slug === 'gmail-undo-send')
    ?? readableStories.find(story => story.status === 'published')
    ?? readableStories[0]
}
