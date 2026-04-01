import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FlowWorkspaceShell } from '@/components/v2/FlowWorkspaceShell'
import type { UserRoleV2 } from '@/lib/types'

export default async function ChallengeWorkspacePage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ role?: string }>
}) {
  const { id } = await params
  const { role } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'true') redirect('/auth/login')

  const roleId = (role as UserRoleV2) ?? 'swe'
  return <FlowWorkspaceShell challengeId={id} initialRoleId={roleId} />
}
