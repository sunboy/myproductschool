import { getMockShowcaseProduct, getShowcaseProduct } from '@/lib/data/showcase'
import type { AutopsyProductDetail, AutopsyStory, StorySection } from '@/lib/types'

export interface LegacyCompanyTeardown {
  product: AutopsyProductDetail
  story: AutopsyStory
  reader: 'aarrr' | 'story'
}

export async function getLegacyCompanyTeardown(
  companySlug: string,
  storySlug: string
): Promise<LegacyCompanyTeardown | null> {
  const product = await getShowcaseProduct(companySlug).catch(() => null)
    ?? getMockShowcaseProduct(companySlug)
  if (!product) return null

  const story = product.stories?.find(item => item.slug === storySlug)
  if (!story) return null

  const cleanStory = stripPracticeSurfaces(story)
  return {
    product: {
      ...product,
      stories: [cleanStory],
      decisions: [],
    },
    story: cleanStory,
    reader: cleanStory.sections.some(section => section.layout === 'aarrr_stage') ? 'aarrr' : 'story',
  }
}

function stripPracticeSurfaces(story: AutopsyStory): AutopsyStory {
  return {
    ...story,
    related_challenge_ids: [],
    sections: story.sections
      .filter(section => section.layout !== 'fullbleed_cta')
      .map(stripPracticeFromSection),
  }
}

function stripPracticeFromSection(section: StorySection): StorySection {
  if (section.layout !== 'aarrr_stage') return section

  const content = { ...section.content }
  delete content.practice_prompts
  return {
    ...section,
    content,
  }
}
