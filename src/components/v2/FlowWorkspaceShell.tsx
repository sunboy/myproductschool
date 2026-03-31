'use client'

import type { UserRoleV2 } from '@/lib/types'
import { FlowWorkspace } from './FlowWorkspace'
import { useRouter } from 'next/navigation'

interface FlowWorkspaceShellProps {
  challengeId: string
  initialRoleId: UserRoleV2
}

export function FlowWorkspaceShell({ challengeId, initialRoleId }: FlowWorkspaceShellProps) {
  const router = useRouter()
  return (
    <FlowWorkspace
      challengeId={challengeId}
      initialRoleId={initialRoleId}
      onExit={() => router.push('/challenges')}
    />
  )
}
