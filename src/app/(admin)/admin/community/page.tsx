import { createAdminClient } from '@/lib/supabase/admin'
import { CommunityCurationTable, type CommunityCurationRow } from './CommunityCurationTable'
import type { CommunityLensTag, CommunitySubmissionStatus } from '@/lib/types'

type SubmissionRow = {
  id: string
  display_mode: 'anonymous' | 'named'
  status: CommunitySubmissionStatus
  lens_tag: CommunityLensTag
  excerpt: string
  score: number | null
  created_at: string
  profiles?: { display_name?: string | null } | { display_name?: string | null }[] | null
  challenges?: { title?: string | null } | { title?: string | null }[] | null
}

function firstJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export default async function AdminCommunityPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('community_submissions')
    .select('id, display_mode, status, lens_tag, excerpt, score, created_at, profiles(display_name), challenges(title)')
    .neq('status', 'hidden')
    .order('created_at', { ascending: false })
    .limit(40)

  const rows: CommunityCurationRow[] = ((data ?? []) as SubmissionRow[]).map(row => ({
    id: row.id,
    display_mode: row.display_mode,
    status: row.status,
    lens_tag: row.lens_tag,
    excerpt: row.excerpt,
    score: row.score,
    challenge_title: firstJoin(row.challenges)?.title ?? 'Challenge',
    display_name: firstJoin(row.profiles)?.display_name ?? null,
    created_at: row.created_at,
  }))

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Community</p>
        <h1 className="mt-1 font-headline text-2xl font-bold text-on-surface sm:text-3xl">Answer curation</h1>
        <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
          Feature sharp approaches, hide unsafe shares, and keep the answer gallery useful without opening a moderation queue.
        </p>
      </div>
      <CommunityCurationTable rows={rows} />
    </div>
  )
}
