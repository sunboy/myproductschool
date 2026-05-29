'use client'
import dynamic from 'next/dynamic'
import type { LiveInterviewPersona } from '@/lib/mock-live-interviews'
import type { ScenarioBrief } from './page'

const LiveInterviewsShell = dynamic(
  () => import('./LiveInterviewsShell').then(m => ({ default: m.LiveInterviewsShell })),
  {
    ssr: false,
    loading: () => <div className="flex-1 bg-surface-container animate-pulse rounded-xl" />,
  }
)

interface Props {
  personas: LiveInterviewPersona[]
  scenarios: ScenarioBrief[]
}

export function LiveInterviewsShellClient(props: Props) {
  return <LiveInterviewsShell {...props} />
}
