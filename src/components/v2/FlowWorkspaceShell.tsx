'use client'

import { useState } from 'react'
import type { UserRoleV2 } from '@/lib/types'
import { FlowWorkspace } from './FlowWorkspace'
import { useRouter } from 'next/navigation'
import { PaywallModal } from '@/components/paywalls/PaywallModal'
import { workspaceExitHref } from '@/lib/workspace/breadcrumbs'

export interface FlowWorkspaceShellProps {
  challengeId: string
  challengeSlug?: string
  initialRoleId: UserRoleV2
  fromPlan?: string
  fromDomain?: string
  nextChallengeSlug?: string
  returnTo?: string
}

export function FlowWorkspaceShell({ challengeId, challengeSlug, initialRoleId, fromPlan, fromDomain, nextChallengeSlug, returnTo }: FlowWorkspaceShellProps) {
  const router = useRouter()
  const [paywallData, setPaywallData] = useState<{ used: number; limit: number } | null>(null)
  const exitHref = workspaceExitHref({ fromPlan, fromDomain }, returnTo)

  return (
    <div className="relative h-full">
      <FlowWorkspace
        mode="api"
        challengeId={challengeId}
        challengeSlug={challengeSlug}
        initialRoleId={initialRoleId}
        fromPlan={fromPlan}
        fromDomain={fromDomain}
        nextChallengeSlug={nextChallengeSlug}
        returnTo={returnTo}
        onExit={() => router.push(exitHref)}
        onPaywall={(data) => setPaywallData(data)}
      />
      <PaywallModal
        open={!!paywallData}
        feature="challenges"
        used={paywallData?.used}
        limit={paywallData?.limit}
        onClose={() => setPaywallData(null)}
        secondaryAction={{ label: 'Keep reading this challenge', onClick: () => setPaywallData(null) }}
      />
    </div>
  )
}
