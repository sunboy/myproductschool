'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/shell/TopNav'
import { BottomTabs } from '@/components/shell/BottomTabs'
import { FloatingHatch } from '@/components/shell/FloatingHatch'
import { HatchDirector } from '@/components/shell/HatchDirector'
import { UpgradeModal } from '@/components/shell/UpgradeModal'
import { IdleTimer } from '@/components/auth/IdleTimer'
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget'
import { HatchProvider } from '@/context/HatchContext'
import { SessionProvider, useSession } from '@/context/SessionContext'
import { OnboardingModalProvider } from '@/context/OnboardingModalContext'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'

function AppShell({ children }: { children: React.ReactNode }) {
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  // userId comes from the session fetched once by SessionProvider — no extra
  // client-side getUser() round-trip on every navigation.
  const { userId } = useSession()

  useEffect(() => {
    const upgradeHandler = () => setUpgradeOpen(true)
    window.addEventListener('open-upgrade-modal', upgradeHandler)
    return () => {
      window.removeEventListener('open-upgrade-modal', upgradeHandler)
    }
  }, [])

  return (
    <OnboardingModalProvider>
      <div className="min-h-screen min-w-0 bg-background">
        <TopNav />
        <main className="min-w-0 pb-20 md:pb-8">
          {children}
        </main>
        <BottomTabs />
        <HatchDirector />
        <FloatingHatch />
        <FeedbackWidget />
        <IdleTimer />
        <UpgradeModal
          open={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
          userId={userId}
        />
        <OnboardingModal />
      </div>
    </OnboardingModalProvider>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <HatchProvider>
      <SessionProvider>
        <AppShell>{children}</AppShell>
      </SessionProvider>
    </HatchProvider>
  )
}
