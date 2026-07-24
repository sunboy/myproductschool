'use client'

import { Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { TopNav } from '@/components/shell/TopNav'
import { BottomTabs } from '@/components/shell/BottomTabs'
import { StudyPlanIndexPanel } from '@/components/shell/StudyPlanIndexPanel'
import { DomainIndexPanel } from '@/components/shell/DomainIndexPanel'
import { FloatingHatch } from '@/components/shell/FloatingHatch'
import { HatchProvider } from '@/context/HatchContext'
import { SessionProvider } from '@/context/SessionContext'
import { UpgradeModalHost } from '@/components/paywalls/UpgradeModalHost'

function WorkspaceLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const fromPlan = searchParams.get('from_plan')
  const fromDomain = searchParams.get('from_domain')
  const cid = searchParams.get('cid') ?? undefined
  const isShareRoute = /^\/workspace\/challenges\/[^/]+\/share(?:\/[^/]+)?$/.test(pathname)

  if (isShareRoute) return <>{children}</>

  return (
    <HatchProvider>
      <SessionProvider>
      <div className="flex h-screen min-w-0 flex-col bg-background">
        <TopNav />
        <div className="flex min-w-0 flex-1 overflow-hidden">
          {fromPlan && (
            <StudyPlanIndexPanel planSlug={fromPlan} activeChallengeId={cid} />
          )}
          {!fromPlan && fromDomain && (
            <DomainIndexPanel domainSlug={fromDomain} activeChallengeId={cid} />
          )}
          <main className="relative min-w-0 flex-1 overflow-hidden">
            {children}
          </main>
        </div>
        <BottomTabs />
        <FloatingHatch />
        <UpgradeModalHost />
      </div>
      </SessionProvider>
    </HatchProvider>
  )
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <WorkspaceLayoutInner>{children}</WorkspaceLayoutInner>
    </Suspense>
  )
}
