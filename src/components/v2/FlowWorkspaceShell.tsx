'use client'

import { useState } from 'react'
import type { UserRoleV2 } from '@/lib/types'
import { FlowWorkspace } from './FlowWorkspace'
import { useRouter } from 'next/navigation'
import { ChallengePaywallGate } from '@/components/paywalls/ChallengePaywallGate'
import { useUpgrade } from '@/hooks/useUpgrade'

interface FlowWorkspaceShellProps {
  challengeId: string
  challengeSlug?: string
  initialRoleId: UserRoleV2
  fromPlan?: string
  nextChallengeSlug?: string
}

export function FlowWorkspaceShell({ challengeId, challengeSlug, initialRoleId, fromPlan, nextChallengeSlug }: FlowWorkspaceShellProps) {
  const router = useRouter()
  const [paywallData, setPaywallData] = useState<{ used: number; limit: number } | null>(null)
  const { startUpgrade } = useUpgrade()

  return (
    <div className="relative h-full">
      <FlowWorkspace
        mode="api"
        challengeId={challengeId}
        challengeSlug={challengeSlug}
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
          onUpgrade={startUpgrade}
          onDismiss={() => router.push('/challenges')}
        />
      )}
    </div>
  )
}
