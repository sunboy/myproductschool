import type { AutopsyImageRole } from './types'

export const AUTOPSY_FREE_STORY_LIMIT = 3

export const AUTOPSY_REQUIRED_IMAGE_ROLES: AutopsyImageRole[] = [
  'hero',
  'hatch-narrator',
  'failure-mechanism',
  'evidence-card',
  'lesson-frame',
  'thumbnail',
  'social-cover',
]

export const AUTOPSY_BANNED_COPY = [
  'game-changer',
  'game changing',
  'seamless',
  'revolutionary',
  'deep dive',
  'robust',
  'leverage',
  'unlock',
  'changed everything',
  'industry observers say',
]

export const AUTOPSY_WATERMARK_OPTIONS = [
  'Told by Hatch · HackProduct',
  'HackProduct Autopsy',
]
