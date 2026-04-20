'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { TopNav } from '@/components/shell/TopNav'
import { BottomTabs } from '@/components/shell/BottomTabs'
import { AskLumaDrawer } from '@/components/shell/AskLumaDrawer'
import { StudyPlanIndexPanel } from '@/components/shell/StudyPlanIndexPanel'

function WorkspaceLayoutInner({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const searchParams = useSearchParams()
  const fromPlan = searchParams.get('from_plan')
  const cid = searchParams.get('cid') ?? undefined

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopNav />
      {fromPlan && (
        <StudyPlanIndexPanel planSlug={fromPlan} activeChallengeId={cid} />
      )}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      <BottomTabs />
      <AskLumaDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <WorkspaceLayoutInner>{children}</WorkspaceLayoutInner>
    </Suspense>
  )
}
