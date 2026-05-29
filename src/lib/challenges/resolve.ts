import { createAdminClient } from '@/lib/supabase/admin'

interface ChallengeIdentityRow {
  id: string
  slug: string | null
}

export interface ChallengeIdentity {
  id: string
  slug: string | null
}

export async function resolveChallengeIdentity(
  rawId: string,
  adminClient: ReturnType<typeof createAdminClient> = createAdminClient()
): Promise<ChallengeIdentity | null> {
  const id = rawId.trim()
  if (!id) return null

  const { data: byId, error: idError } = await adminClient
    .from('challenges')
    .select('id, slug')
    .eq('id', id)
    .maybeSingle()

  if (idError) throw idError
  if (byId) return byId as ChallengeIdentityRow

  const { data: bySlug, error: slugError } = await adminClient
    .from('challenges')
    .select('id, slug')
    .eq('slug', id)
    .maybeSingle()

  if (slugError) throw slugError
  return (bySlug as ChallengeIdentityRow | null) ?? null
}
