'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/shell/TopNav'
import { BottomTabs } from '@/components/shell/BottomTabs'
import { FloatingHatch } from '@/components/shell/FloatingHatch'
import { UpgradeModal } from '@/components/shell/UpgradeModal'
import { HatchProvider } from '@/context/HatchContext'
import { createClient } from '@/lib/supabase/client'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })

    const upgradeHandler = () => setUpgradeOpen(true)
    window.addEventListener('open-upgrade-modal', upgradeHandler)

    return () => {
      window.removeEventListener('open-upgrade-modal', upgradeHandler)
    }
  }, [])

  return (
    <HatchProvider>
      <div className="min-h-screen bg-background">
        <TopNav />
        <main className="pb-20 md:pb-8">
          {children}
        </main>
        <BottomTabs />
        <FloatingHatch />
        <UpgradeModal
          open={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
          userId={userId}
        />
      </div>
    </HatchProvider>
  )
}
