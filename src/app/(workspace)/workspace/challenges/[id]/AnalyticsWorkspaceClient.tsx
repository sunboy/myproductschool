'use client'

import { useRouter } from 'next/navigation'
import { MediumRenderer } from '@/components/v2/mediums/MediumRenderer'
import { PaywallModal } from '@/components/paywalls/PaywallModal'
import type { ChallengePrompt } from '@/lib/types'

export interface AnalyticsScenario {
  context: string
  trigger: string
  question: string
}

interface Props {
  challenge: ChallengePrompt
  scenario?: AnalyticsScenario
  returnTo?: string
  /** The feature is launched but this user lacks the Analytics tier. Show the
   *  upgrade modal over a blurred preview instead of starting a live session. */
  locked?: boolean
}

// Minimal workspace shell for Claude Code Analytics challenges: a top bar +
// the guided analytics medium (live terminal + sub-problem stepper + Hatch).
// The medium owns its own session lifecycle (it creates the attempt via
// /api/claude-code/session/start), so no attemptId needs to be passed in.
export function AnalyticsWorkspaceClient({ challenge, scenario, returnTo, locked }: Props) {
  const router = useRouter()
  const exitHref = returnTo ?? '/challenges'
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <header className="h-12 w-full bg-background border-b border-outline-variant flex items-center gap-4 px-6 z-30 flex-shrink-0">
        <button
          onClick={() => (returnTo ? router.push(returnTo) : router.back())}
          className="p-1 hover:bg-surface-container-high rounded-full transition-colors"
          aria-label="Back"
        >
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </button>
        <span className="font-headline text-on-surface truncate">{challenge.title}</span>
      </header>
      <div className="flex-1 min-h-0">
        {locked ? (
          // Blurred, non-interactive preview behind the upgrade modal. No
          // MediumRenderer here, so no sandbox session is provisioned for a user
          // who cannot use it.
          <div className="h-full w-full select-none pointer-events-none blur-sm opacity-40 p-6">
            {scenario?.context && (
              <p className="font-body text-sm text-on-surface max-w-xl">{scenario.context}</p>
            )}
            <div className="mt-4 rounded-xl bg-surface-container h-64 border border-outline-variant" />
          </div>
        ) : (
          <MediumRenderer challenge={challenge} attemptId="" scenario={scenario} />
        )}
      </div>
      <PaywallModal
        open={!!locked}
        feature="claude_code_analytics"
        dismissible
        onClose={() => router.push(exitHref)}
      />
    </div>
  )
}
