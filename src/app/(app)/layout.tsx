'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/shell/TopNav'
import { BottomTabs } from '@/components/shell/BottomTabs'
import { FloatingLuma } from '@/components/shell/FloatingLuma'
import { AskLumaDrawer } from '@/components/shell/AskLumaDrawer'
import { UpgradeModal } from '@/components/shell/UpgradeModal'
import { createClient } from '@/lib/supabase/client'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })

    // Allow any page to open the upgrade modal via custom event
    const upgradeHandler = () => setUpgradeOpen(true)
    window.addEventListener('open-upgrade-modal', upgradeHandler)

    // Allow any page to open the Luma drawer via custom event
    const lumaHandler = () => setDrawerOpen(true)
    window.addEventListener('open-ask-luma', lumaHandler)

    return () => {
      window.removeEventListener('open-upgrade-modal', upgradeHandler)
      window.removeEventListener('open-ask-luma', lumaHandler)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="pb-20 md:pb-8">
        {children}
      </main>
      <BottomTabs />
      <FloatingLuma />
      <AskLumaDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        userId={userId}
      />
    </div>
  )
}
