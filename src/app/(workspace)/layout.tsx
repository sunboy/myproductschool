'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { TopNav } from '@/components/shell/TopNav'
import { BottomTabs } from '@/components/shell/BottomTabs'
import { StudyPlanIndexPanel } from '@/components/shell/StudyPlanIndexPanel'
import { FloatingHatch } from '@/components/shell/FloatingHatch'
import { HatchDirector } from '@/components/shell/HatchDirector'
import { HatchProvider } from '@/context/HatchContext'

function WorkspaceLayoutInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const fromPlan = searchParams.get('from_plan')
  const cid = searchParams.get('cid') ?? undefined

  return (
    <HatchProvider>
      <div className="flex h-screen min-w-0 flex-col bg-background">
        <TopNav />
        <div className="flex min-w-0 flex-1 overflow-hidden">
          {fromPlan && (
            <StudyPlanIndexPanel planSlug={fromPlan} activeChallengeId={cid} />
          )}
          <main className="relative min-w-0 flex-1 overflow-hidden">
            {children}
          </main>
        </div>
        <BottomTabs />
        <HatchDirector />
        <FloatingHatch />
      </div>
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
