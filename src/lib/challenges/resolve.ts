import { createAdminClient } from '@/lib/supabase/admin'
import { parseChallengeNumberSlug } from '@/lib/challenges/challengeNumber'
import type { ChallengeType } from '@/lib/types'

interface ChallengeIdentityRow {
  id: string
  slug: string | null
  display_number: number | null
  challenge_type: ChallengeType | null
}

export interface ChallengeIdentity {
  id: string
  slug: string | null
  display_number: number | null
  challenge_type: ChallengeType | null
}

const IDENTITY_COLUMNS = 'id, slug, display_number, challenge_type'

export async function resolveChallengeIdentity(
  rawId: string,
  adminClient: ReturnType<typeof createAdminClient> = createAdminClient()
): Promise<ChallengeIdentity | null> {
  const id = rawId.trim()
  if (!id) return null

  // Number slug (e.g. "sql-2001") -> look up by display_number. Bands are globally
  // unique, so the integer alone is unambiguous; the prefix is ignored on lookup.
  const numberValue = parseChallengeNumberSlug(id)
  if (numberValue != null) {
    const { data: byNumber, error: numberError } = await adminClient
      .from('challenges')
      .select(IDENTITY_COLUMNS)
      .eq('display_number', numberValue)
      .maybeSingle()

    if (numberError) throw numberError
    if (byNumber) return byNumber as ChallengeIdentityRow
  }

  const { data: byId, error: idError } = await adminClient
    .from('challenges')
    .select(IDENTITY_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (idError) throw idError
  if (byId) return byId as ChallengeIdentityRow

  const { data: bySlug, error: slugError } = await adminClient
    .from('challenges')
    .select(IDENTITY_COLUMNS)
    .eq('slug', id)
    .maybeSingle()

  if (slugError) throw slugError
  return (bySlug as ChallengeIdentityRow | null) ?? null
}
