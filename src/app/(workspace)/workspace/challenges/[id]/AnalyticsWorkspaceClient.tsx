'use client'

import { useRouter } from 'next/navigation'
import { MediumRenderer } from '@/components/v2/mediums/MediumRenderer'
import type { ChallengePrompt } from '@/lib/types'

interface Props {
  challenge: ChallengePrompt
  returnTo?: string
}

// Minimal workspace shell for Claude Code Analytics challenges: a top bar +
// the guided analytics medium (live terminal + sub-problem stepper + Hatch).
// The medium owns its own session lifecycle (it creates the attempt via
// /api/claude-code/session/start), so no attemptId needs to be passed in.
export function AnalyticsWorkspaceClient({ challenge, returnTo }: Props) {
  const router = useRouter()
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
        <MediumRenderer challenge={challenge} attemptId="" />
      </div>
    </div>
  )
}
