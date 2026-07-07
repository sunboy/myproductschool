'use client'

import { useEffect, useState } from 'react'
import { PaywallModal } from '@/components/paywalls/PaywallModal'

// Single host for the window-event-driven upgrade modal. Both the (app) and
// (workspace) layouts mount this; TopNav and other surfaces open it by
// dispatching `open-upgrade-modal`. Keeping the listener + modal here prevents
// the two layouts from drifting (the workspace layout previously had no
// listener, so the Upgrade button silently did nothing there).
export function UpgradeModalHost() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('open-upgrade-modal', handler)
    return () => window.removeEventListener('open-upgrade-modal', handler)
  }, [])

  return <PaywallModal open={open} onClose={() => setOpen(false)} />
}
