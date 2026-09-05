'use client'
import dynamic from 'next/dynamic'
import type { LiveInterviewPersona } from '@/lib/mock-live-interviews'
import type { ScenarioBrief } from './page'

const LiveInterviewsShell = dynamic(
  () => import('./LiveInterviewsShell').then(m => ({ default: m.LiveInterviewsShell })),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-72 animate-pulse rounded-2xl border border-hairline bg-surface-container"
        role="status"
        aria-label="Loading interview setup"
      />
    ),
  }
)

interface Props {
  personas: LiveInterviewPersona[]
  scenarios: ScenarioBrief[]
}

export function LiveInterviewsShellClient(props: Props) {
  return <LiveInterviewsShell {...props} />
}
