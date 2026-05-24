'use client'
import dynamic from 'next/dynamic'
import type { FlowWorkspaceShellProps } from '@/components/v2/FlowWorkspaceShell'

const FlowWorkspaceShell = dynamic(
  () => import('@/components/v2/FlowWorkspaceShell').then(m => ({ default: m.FlowWorkspaceShell })),
  {
    ssr: false,
    loading: () => <div className="flex-1 bg-surface-container animate-pulse rounded-xl" />,
  }
)

export function FlowWorkspaceShellClient(props: FlowWorkspaceShellProps) {
  return <FlowWorkspaceShell {...props} />
}
