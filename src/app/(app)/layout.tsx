'use client'

import { useState, useEffect } from 'react'
import { NavRail } from '@/components/shell/NavRail'
import { BottomTabs } from '@/components/shell/BottomTabs'
import { TopBar } from '@/components/shell/TopBar'
import { AskLumaDrawer } from '@/components/shell/AskLumaDrawer'
import { UpgradeModal } from '@/components/shell/UpgradeModal'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { createClient } from '@/lib/supabase/client'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.plan === 'pro') setIsPro(true) })
      .catch(() => {})

    // Allow any page to open the upgrade modal via custom event
    const handler = () => setUpgradeOpen(true)
    window.addEventListener('open-upgrade-modal', handler)
    return () => window.removeEventListener('open-upgrade-modal', handler)
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <NavRail
        onAskLuma={() => setDrawerOpen(true)}
        onUpgrade={() => setUpgradeOpen(true)}
        isPro={isPro}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <BottomTabs />

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg"
        aria-label="Ask Luma"
      >
        <LumaGlyph size={24} state="idle" className="text-white" />
      </button>

      <AskLumaDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        userId={userId}
      />
    </div>
  )
}
