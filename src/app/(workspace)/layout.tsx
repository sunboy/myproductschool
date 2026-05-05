'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { TopNav } from '@/components/shell/TopNav'
import { BottomTabs } from '@/components/shell/BottomTabs'
import { StudyPlanIndexPanel } from '@/components/shell/StudyPlanIndexPanel'
import { FloatingHatch } from '@/components/shell/FloatingHatch'
import { HatchProvider } from '@/context/HatchContext'

function WorkspaceLayoutInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const fromPlan = searchParams.get('from_plan')
  const cid = searchParams.get('cid') ?? undefined

  return (
    <HatchProvider>
      <div className="flex flex-col h-screen bg-background">
        <TopNav />
        <div className="flex flex-1 overflow-hidden">
          {fromPlan && (
            <StudyPlanIndexPanel planSlug={fromPlan} activeChallengeId={cid} />
          )}
          <main className="flex-1 overflow-hidden relative">
            {children}
          </main>
        </div>
        <BottomTabs />
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
