'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/shell/TopNav'
import { BottomTabs } from '@/components/shell/BottomTabs'
import { FloatingHatch } from '@/components/shell/FloatingHatch'
import { HatchDirector } from '@/components/shell/HatchDirector'
import { IntroTourController } from '@/components/shell/IntroTourController'
import { PaywallModal } from '@/components/paywalls/PaywallModal'
import { IdleTimer } from '@/components/auth/IdleTimer'
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget'
import { HatchProvider } from '@/context/HatchContext'
import { SessionProvider } from '@/context/SessionContext'
import { OnboardingModalProvider } from '@/context/OnboardingModalContext'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'

function AppShell({ children }: { children: React.ReactNode }) {
  const [upgradeOpen, setUpgradeOpen] = useState(false)

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
        <IntroTourController />
        <FloatingHatch />
        <FeedbackWidget />
        <IdleTimer />
        <PaywallModal
          open={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
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
