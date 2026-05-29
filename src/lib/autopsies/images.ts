import type { AutopsyImage, AutopsyImageRole, FeatureAutopsy } from './types'

export function getAutopsyImage(
  story: Pick<FeatureAutopsy, 'images'>,
  role: AutopsyImageRole
) {
  return story.images.find(image => image.role === role && image.qaStatus === 'approved')
    ?? story.images.find(image => image.role === role)
}

export function getFirstAutopsyImage(
  story: Pick<FeatureAutopsy, 'images'>,
  roles: AutopsyImageRole[]
): AutopsyImage | undefined {
  for (const role of roles) {
    const image = getAutopsyImage(story, role)
    if (image) return image
  }
  return undefined
}

export function getProminentStoryImage(story: Pick<FeatureAutopsy, 'images'>) {
  return getFirstAutopsyImage(story, ['social-cover', 'thumbnail', 'hero'])
}

export function getReaderHeroImage(story: Pick<FeatureAutopsy, 'images'>) {
  return getAutopsyImage(story, 'hero')
}
