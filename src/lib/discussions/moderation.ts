import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api/error'
import { moderateUserContent } from '@/lib/ai/moderation'

export async function discussionModerationError(content: string): Promise<NextResponse | null> {
  const moderation = await moderateUserContent(content)

  if (moderation.status === 'flagged') {
    return apiError(400, 'content_not_allowed', 'That post needs a rewrite before it can be published.', {
      categories: moderation.categories,
    })
  }

  if (moderation.status === 'unavailable') {
    console.warn('Discussion moderation unavailable:', moderation.reason)
    return apiError(503, 'moderation_unavailable', 'Could not review discussion safety. Try again.')
  }

  if (moderation.status === 'skipped') {
    console.warn('Discussion moderation skipped:', moderation.reason)
  }

  return null
}
