'use client'

import type { UserRoleV2 } from '@/lib/types'
import { FlowWorkspace } from './FlowWorkspace'
import { useRouter } from 'next/navigation'

interface FlowWorkspaceShellProps {
  challengeId: string
  initialRoleId: UserRoleV2
  fromPlan?: string
  nextChallengeSlug?: string
}

export function FlowWorkspaceShell({ challengeId, initialRoleId, fromPlan, nextChallengeSlug }: FlowWorkspaceShellProps) {
  const router = useRouter()
  return (
    <FlowWorkspace
      mode="api"
      challengeId={challengeId}
      initialRoleId={initialRoleId}
      fromPlan={fromPlan}
      nextChallengeSlug={nextChallengeSlug}
      onExit={() => router.push('/challenges')}
    />
  )
}
