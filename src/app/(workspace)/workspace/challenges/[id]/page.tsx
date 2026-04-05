import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FlowWorkspaceShell } from '@/components/v2/FlowWorkspaceShell'
import type { UserRoleV2 } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'

export default async function ChallengeWorkspacePage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ role?: string }>
}) {
  const { id } = await params
  const { role } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !IS_MOCK) redirect('/login')

  // Resolve slug → id: look up by slug first, fall back to raw param
  let challengeId = id
  if (!IS_MOCK) {
    const admin = createAdminClient()
    const { data: ch } = await admin.from('challenges').select('id').eq('slug', id).maybeSingle()
    if (ch?.id) challengeId = ch.id
  }

  const roleId = (role as UserRoleV2) ?? 'swe'
  return <FlowWorkspaceShell challengeId={challengeId} initialRoleId={roleId} />
}
