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
import { UiShellProvider } from '@/components/shell-v2/UiShellContext'
import { ShellV2 } from '@/components/shell-v2/ShellV2'
import type { UiPrefs } from '@/lib/shell/ui-prefs'

function AppShell({ children }: { children: React.ReactNode }) {
  return (
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
    </div>
  )
}

export function AppLayoutClient({
  children,
  initialProfile,
  uiDensity,
  initialPrefs,
}: {
  children: React.ReactNode
  initialProfile: SessionProfile | null
  uiDensity: boolean
  initialPrefs: UiPrefs | null
}) {
  return (
    <HatchProvider>
      <SessionProvider initialProfile={initialProfile}>
        <UiShellProvider density={uiDensity} initialPrefs={initialPrefs}>
          <OnboardingModalProvider>
            {uiDensity ? <ShellV2>{children}</ShellV2> : <AppShell>{children}</AppShell>}
            <IntroTourController />
            <FloatingHatch />
            <FeedbackModalHost />
            <IdleTimer />
            <UpgradeModalHost />
            <OnboardingModal />
          </OnboardingModalProvider>
        </UiShellProvider>
      </SessionProvider>
    </HatchProvider>
  )
}
