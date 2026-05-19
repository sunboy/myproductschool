import { cache } from 'react'
import { IS_MOCK } from '@/lib/mock'
import { createClient } from '@/lib/supabase/server'
import { AUTOPSY_FREE_STORY_LIMIT } from './constants'
import type { FeatureAutopsy } from './types'

export interface AutopsyAccess {
  isSignedIn: boolean
  freeStoryLimit: number
}

export const getAutopsyAccess = cache(async (): Promise<AutopsyAccess> => {
  if (IS_MOCK) {
    return { isSignedIn: true, freeStoryLimit: AUTOPSY_FREE_STORY_LIMIT }
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return { isSignedIn: Boolean(user), freeStoryLimit: AUTOPSY_FREE_STORY_LIMIT }
  } catch {
    return { isSignedIn: false, freeStoryLimit: AUTOPSY_FREE_STORY_LIMIT }
  }
})

export function canReadAutopsyStory(story: FeatureAutopsy, access: AutopsyAccess) {
  return access.isSignedIn || story.queueRank <= access.freeStoryLimit
}

export function getAutopsyGateLabel(story: FeatureAutopsy, access: AutopsyAccess) {
  if (canReadAutopsyStory(story, access)) return story.status === 'published' ? 'Readable' : 'Production brief'
  return 'Signup required'
}
