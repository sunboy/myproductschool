'use client'

import { HeaderBand } from '@/components/density/HeaderBand'
import { HatchPickCard } from '@/components/density/HatchPickCard'

interface InterviewBandProps {
  mode: 'single' | 'loop'
  onModeChange: (mode: 'single' | 'loop') => void
  loopActive: number
  lastSession: { id: string; scoreLabel: string; disciplineLabel: string | null } | null
}

/** Setup band: format chips (Single / Multi-round · N active) plus a Hatch
 *  card naming the last scored session, mirroring PracticeBand's pattern. */
export function InterviewBand({ mode, onModeChange, loopActive, lastSession }: InterviewBandProps) {
  return (
    <div data-tour-target="interviews-hero">
      <HeaderBand
        title="Interviews"
        subtitle="Practice a realistic conversation, get specific feedback."
        chips={[
          { label: 'Single interview', active: mode === 'single', onClick: () => onModeChange('single'), testId: 'chip-mode-single' },
          { label: `Multi-round${loopActive > 0 ? ` · ${loopActive} active` : ''}`, active: mode === 'loop', onClick: () => onModeChange('loop'), testId: 'chip-mode-loop' },
        ]}
        right={
          lastSession ? (
            <HatchPickCard
              eyebrow="Hatch says"
              title={`Last session: ${lastSession.scoreLabel}${lastSession.disciplineLabel ? ` in ${lastSession.disciplineLabel}` : ''}`}
              reason="Open the debrief when you want to review the details."
              href={`/live-interviews/${lastSession.id}/debrief`}
              ctaLabel="Debrief"
              dismissScope="interviews-last-session"
              testId="interviews-hatch-pick"
            />
          ) : null
        }
      />
    </div>
  )
}
