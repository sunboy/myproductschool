'use client'

import { TopNav } from '@/components/shell/TopNav'
import { BottomTabs } from '@/components/shell/BottomTabs'
import { FloatingHatch } from '@/components/shell/FloatingHatch'
import { HatchDirector } from '@/components/shell/HatchDirector'
import { IntroTourController } from '@/components/shell/IntroTourController'
import { UpgradeModalHost } from '@/components/paywalls/UpgradeModalHost'
import { IdleTimer } from '@/components/auth/IdleTimer'
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget'
import { HatchProvider } from '@/context/HatchContext'
import { SessionProvider } from '@/context/SessionContext'
import { OnboardingModalProvider } from '@/context/OnboardingModalContext'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'

function AppShell({ children }: { children: React.ReactNode }) {
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
        <UpgradeModalHost />
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
