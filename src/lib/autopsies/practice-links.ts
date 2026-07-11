import 'server-only'
import type { AutopsyProductDetail, Challenge } from '@/lib/types'
import type { PracticeLinkCard } from '@/app/(app)/explore/autopsies/[slug]/AutopsyReaderClient'
import { getChallengeById } from '@/lib/data/challenges'
import { challengePath } from '@/lib/challenges/challengeNumber'
import { disciplineLabelFor } from '@/components/redesign/dashboard/discipline'
import { difficultyLabel } from '@/lib/utils'

// Resolves a story's related_challenge_ids into "Practice what you read" cards.
// Server-side so the reader (a client component) never imports server loaders.
export async function resolvePracticeCards(
  product: AutopsyProductDetail,
): Promise<PracticeLinkCard[]> {
  const ids = (product.stories?.[0]?.related_challenge_ids ?? []).slice(0, 3)
  if (ids.length === 0) return []
  try {
    const results = await Promise.all(ids.map(id => getChallengeById(id)))
    return results
      .filter((c): c is Challenge => c !== null)
      .map(c => ({
        id: c.id,
        title: c.title,
        href: challengePath(c),
        disciplineLabel: disciplineLabelFor(c.challenge_type),
        difficultyLabel: c.difficulty ? difficultyLabel(c.difficulty) : null,
      }))
  } catch {
    return []
  }
}
