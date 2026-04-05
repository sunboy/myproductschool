export type {
  AutopsyStory,
  AutopsyProductDetail,
  StorySection,
  IllustrationConfig,
  IllustrationVariant,
  AutopsyProduct,
  AutopsyDecision,
  AutopsyChallenge,
} from '@/lib/types'

export function isSplitPanel(
  s: import('@/lib/types').StorySection
): s is Extract<import('@/lib/types').StorySection, { layout: 'split_panel' }> {
  return s.layout === 'split_panel'
}
