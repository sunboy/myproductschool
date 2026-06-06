'use client'

import { pickMedium } from './types'
import type { MediumProps } from './types'
import { ClaudeCodeAnalyticsMedium } from './ClaudeCodeAnalyticsMedium'

export function MediumRenderer({ challenge, attemptId, scenario }: MediumProps) {
  const kind = pickMedium(challenge.challenge_type ?? 'flow')

  switch (kind) {
    case 'claude_code_analytics':
      return <ClaudeCodeAnalyticsMedium challenge={challenge} attemptId={attemptId} scenario={scenario} />

    case 'flow_stepper':
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: 'var(--color-on-surface-variant)', fontSize: 13,
        }}>
          FLOW medium — rendered by FlowWorkspace
        </div>
      )

    case 'excalidraw':
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: 'var(--color-on-surface-variant)', fontSize: 13,
        }}>
          Excalidraw medium — out of scope for this track
        </div>
      )

    case 'monaco_coding':
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: 'var(--color-on-surface-variant)', fontSize: 13,
        }}>
          Monaco coding medium — out of scope for this track
        </div>
      )

    default:
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: 'var(--color-on-surface-variant)', fontSize: 13,
        }}>
          Unknown medium kind
        </div>
      )
  }
}
