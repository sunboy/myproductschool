'use client'

import { useState } from 'react'
import type { UserRoleV2 } from '@/lib/types'
import { FlowWorkspace } from './FlowWorkspace'
import { useRouter } from 'next/navigation'
import { ChallengePaywallGate } from '@/components/paywalls/ChallengePaywallGate'

interface FlowWorkspaceShellProps {
  challengeId: string
  initialRoleId: UserRoleV2
  fromPlan?: string
  nextChallengeSlug?: string
}

export function FlowWorkspaceShell({ challengeId, initialRoleId, fromPlan, nextChallengeSlug }: FlowWorkspaceShellProps) {
  const router = useRouter()
  const [paywallData, setPaywallData] = useState<{ used: number; limit: number } | null>(null)

  return (
    <div className="relative">
      <FlowWorkspace
        mode="api"
        challengeId={challengeId}
        initialRoleId={initialRoleId}
        fromPlan={fromPlan}
        nextChallengeSlug={nextChallengeSlug}
        onExit={() => router.push('/challenges')}
        onPaywall={(data) => setPaywallData(data)}
      />
      {paywallData && (
        <ChallengePaywallGate
          used={paywallData.used}
          limit={paywallData.limit}
          challengeTitle="this challenge"
          onUpgrade={() => router.push('/settings/billing')}
        />
      )}
    </div>
  )
}
