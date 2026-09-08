'use client'

import { useEffect, useState } from 'react'
import type { LiveInterviewPersona } from '@/lib/mock-live-interviews'
import type { ScenarioBrief } from '@/app/(app)/live-interviews/page'
import { LiveInterviewsShellClient } from '@/app/(app)/live-interviews/LiveInterviewsShellClient'
import { InterviewBand } from '@/components/density/interviews/InterviewBand'
import { RecentSessionsColumn } from '@/components/density/interviews/RecentSessionsColumn'
import { normalizeToTen } from '@/lib/feedback/score'

interface LastSessionBrief {
  id: string
  overallScore: number
  disciplineLabel: string | null
}

interface InterviewSetupV2Props {
  personas: LiveInterviewPersona[]
  scenarios: ScenarioBrief[]
  loopActive: number
  lastSession: LastSessionBrief | null
}

/** Density interview setup: band with format chips + Hatch's last-session
 *  card, bordered setup panel (reuses the existing single/loop pickers via
 *  LiveInterviewsShellClient with hideHeader), and a "Recent sessions"
 *  column that drops below the panel under 1280px (design spec §4.11). */
export function InterviewSetupV2({ personas, scenarios, loopActive, lastSession }: InterviewSetupV2Props) {
  const [mode, setMode] = useState<'single' | 'loop'>('single')

  // Re-mount the shell when mode changes via the band's chips, since
  // LiveInterviewsShell only reads initialMode on first render.
  const [shellKey, setShellKey] = useState(0)
  useEffect(() => { setShellKey((k) => k + 1) }, [mode])

  const lastSessionForBand = lastSession
    ? {
        id: lastSession.id,
        scoreLabel: `${normalizeToTen(lastSession.overallScore, 5).toFixed(1)}/10`,
        disciplineLabel: lastSession.disciplineLabel,
      }
    : null

  return (
    <div className="flex flex-col gap-4">
      <InterviewBand mode={mode} onModeChange={setMode} loopActive={loopActive} lastSession={lastSessionForBand} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <div className="rounded-xl border border-hairline bg-card-bright p-4" data-testid="interview-setup-panel">
          <LiveInterviewsShellClient key={shellKey} personas={personas} scenarios={scenarios} initialMode={mode} hideHeader />
        </div>
        <RecentSessionsColumn />
      </div>
    </div>
  )
}
