import type { ReactNode } from 'react'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3AuthGate } from '@/components/landing-v3/V3AuthGate'
import { BreadthStrip } from '@/components/landing-v3/lead-magnet/BreadthStrip'

interface LeadMagnetShellProps {
  children: ReactNode
}

/**
 * Page scaffold for every /go/* lead-magnet page.
 *
 * Wraps the standard marketing `.v3` shell (nav + footer), mounts V3AuthGate so
 * signup-mode CTAs and the post-unlock secondary CTA can open the in-page auth
 * modal, and appends the shared "one connected gym" breadth strip above the
 * footer. Individual pages render their hero + interactive mechanic + gate as
 * `children`.
 */
export function LeadMagnetShell({ children }: LeadMagnetShellProps) {
  return (
    <V3PageShell>
      <div className="lm-page">
        {children}
        <BreadthStrip />
      </div>
      <V3AuthGate />
    </V3PageShell>
  )
}
