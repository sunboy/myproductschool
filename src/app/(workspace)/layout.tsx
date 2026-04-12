'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { NavRail } from '@/components/shell/NavRail'
import { BottomTabs } from '@/components/shell/BottomTabs'
import { TopBar } from '@/components/shell/TopBar'
import { AskLumaDrawer } from '@/components/shell/AskLumaDrawer'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { StudyPlanIndexPanel } from '@/components/shell/StudyPlanIndexPanel'

function WorkspaceLayoutInner({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const searchParams = useSearchParams()
  const fromPlan = searchParams.get('from_plan')
  const cid = searchParams.get('cid') ?? undefined

  return (
    <div className="flex min-h-screen bg-background">
      <NavRail onAskLuma={() => setDrawerOpen(true)} compact={!!fromPlan} />
      {fromPlan && (
        <StudyPlanIndexPanel planSlug={fromPlan} activeChallengeId={cid} />
      )}
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
      <BottomTabs />

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg"
        aria-label="Ask Luma"
      >
        <LumaGlyph size={24} state="idle" className="text-white" />
      </button>

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
