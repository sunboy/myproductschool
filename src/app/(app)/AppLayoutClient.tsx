'use client'

import { BottomTabs } from '@/components/shell/BottomTabs'
import { FloatingHatch } from '@/components/shell/FloatingHatch'
import { IntroTourController } from '@/components/shell/IntroTourController'
import { UpgradeModalHost } from '@/components/paywalls/UpgradeModalHost'
import { IdleTimer } from '@/components/auth/IdleTimer'
import { FeedbackModalHost } from '@/components/feedback/FeedbackWidget'
import { HatchProvider } from '@/context/HatchContext'
import { SessionProvider, type SessionProfile } from '@/context/SessionContext'
import { OnboardingModalProvider } from '@/context/OnboardingModalContext'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'
import { AppSidebarConnected } from '@/components/redesign/AppSidebarConnected'
import { AppTopShell } from '@/components/redesign/AppTopShell'

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingModalProvider>
      <div className="hp-learning-shell min-h-screen min-w-0 bg-background">
        <div className="mx-auto flex min-h-screen w-full max-w-[1400px]">
          {/* Desktop (lg+) fixed left sidebar. Hidden below lg — BottomTabs takes over. */}
          <div className="sticky top-0 hidden h-screen shrink-0 overflow-y-auto lg:block">
            <AppSidebarConnected />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <AppTopShell />
            <main className="min-w-0 flex-1 pb-20 lg:pb-8">
              {children}
            </main>
          </div>
        </div>

        <BottomTabs />
        <IntroTourController />
        <FloatingHatch />
        <FeedbackModalHost />
        <IdleTimer />
        <UpgradeModalHost />
        <OnboardingModal />
      </div>
    </OnboardingModalProvider>
  )
}

export function AppLayoutClient({
  children,
  initialProfile,
}: {
  children: React.ReactNode
  initialProfile: SessionProfile | null
}) {
  return (
    <HatchProvider>
      <SessionProvider initialProfile={initialProfile}>
        <AppShell>{children}</AppShell>
      </SessionProvider>
    </HatchProvider>
  )
}
