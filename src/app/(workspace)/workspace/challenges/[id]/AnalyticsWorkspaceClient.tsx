'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MediumRenderer } from '@/components/v2/mediums/MediumRenderer'
import { PaywallModal } from '@/components/paywalls/PaywallModal'
import { AppBreadcrumbs } from '@/components/navigation/AppBreadcrumbs'
import { workspaceBreadcrumbs, workspaceExitHref, type WorkspaceOrigin } from '@/lib/workspace/breadcrumbs'
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
  /** Origin context so the workspace header trail starts at the right hub. */
  origin?: WorkspaceOrigin
  /** The feature is launched but this user lacks the Analytics tier. Show the
   *  upgrade modal over a blurred preview instead of starting a live session. */
  locked?: boolean
}

// Minimal workspace shell for Claude Code Analytics challenges: a top bar +
// the guided analytics medium (live terminal + sub-problem stepper + Hatch).
// The medium owns its own session lifecycle (it creates the attempt via
// /api/claude-code/session/start), so no attemptId needs to be passed in.
export function AnalyticsWorkspaceClient({ challenge, scenario, returnTo, origin, locked }: Props) {
  const router = useRouter()
  const exitHref = workspaceExitHref(origin, returnTo)
  const crumbs = workspaceBreadcrumbs(challenge.title, origin)
  return (
    // h-full (not h-screen): the (workspace) layout already roots at h-screen
    // minus TopNav; a nested h-screen pushed this shell's bottom edge past the
    // viewport where overflow-hidden clipped it silently. The mobile bottom
    // padding keeps the fixed BottomTabs (56px, md:hidden) from covering the
    // workspace's last rows.
    <div className="flex flex-col h-full bg-background overflow-hidden pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* Merged chrome: the medium's 48px spine bar carries the back
          affordance, so no separate breadcrumb band (screen-estate parity
          with the other challenge workspaces). Locked users still get a
          header since the medium never mounts. */}
      {locked && (
        <header className="h-12 w-full bg-background border-b border-outline-variant flex items-center gap-3 px-4 sm:px-6 z-30 flex-shrink-0">
          <Link
            href={exitHref}
            className="p-1 hover:bg-surface-container-high rounded-full transition-colors shrink-0"
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </Link>
          <AppBreadcrumbs items={crumbs} className="min-w-0" />
        </header>
      )}
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
          <MediumRenderer challenge={challenge} attemptId="" scenario={scenario} exitHref={exitHref} />
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
