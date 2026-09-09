'use client'

import type { FlowPhase } from '@/lib/live-interview/flow-phase'
import { FLOW_ORDER } from '@/lib/live-interview/flow-phase'

interface RoomBarProps {
  companyName: string
  roleName: string
  disciplineLabel: string
  isActive: boolean
  timerDisplay: string
  isWarning: boolean
  flowPhase: FlowPhase
  onBack: () => void
  onEnd: () => void
  onReplayTour: () => void
}

/** 44px dark room top bar (design spec §4.12): back, company/role/discipline,
 *  LIVE indicator, timer, FLOW phase tracker (4 segments), end. */
export function RoomBar({ companyName, roleName, disciplineLabel, isActive, timerDisplay, isWarning, flowPhase, onBack, onEnd, onReplayTour }: RoomBarProps) {
  return (
    <div
      className="shrink-0 flex items-center justify-between px-3"
      style={{
        height: 44,
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
      data-testid="room-bar-v2"
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to interviews"
          className="flex items-center justify-center rounded-full"
          style={{ width: 28, height: 28, color: 'rgba(243,237,224,0.75)' }}
        >
          <span className="material-symbols-outlined text-h4">arrow_back</span>
        </button>
        <span className="truncate font-label text-meta font-semibold" style={{ color: 'rgba(243,237,224,0.9)' }}>
          {companyName || 'Interview'} <span style={{ color: 'rgba(243,237,224,0.4)' }}>·</span> {roleName} <span style={{ color: 'rgba(243,237,224,0.4)' }}>·</span> {disciplineLabel}
        </span>
        {isActive && (
          <span
            className="ml-1 hidden shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-label text-caption font-bold uppercase tracking-wider sm:inline-flex"
            style={{ background: 'rgba(178,58,42,0.2)', color: '#ff8a7a' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#ff8a7a', animation: 'pulseSoft 1.5s ease-in-out infinite' }} />
            LIVE
          </span>
        )}
        <button
          type="button"
          onClick={onReplayTour}
          className="hidden lg:inline-flex font-label text-caption"
          style={{ color: 'rgba(243,237,224,0.4)' }}
        >
          Replay tour
        </button>
      </div>

      <div className="hidden shrink-0 font-label text-ui font-bold tabular-nums sm:block" style={{ color: isWarning ? '#e37d4a' : 'rgba(243,237,224,0.85)' }}>
        {timerDisplay}
      </div>

      <div className="hidden shrink-0 items-center gap-1 sm:flex" data-tour-target="interview-flow" data-testid="room-bar-flow-tracker">
        {FLOW_ORDER.map((move, i) => (
          <span
            key={move}
            className="h-1.5 w-6 rounded-full"
            style={{ background: flowPhase.covered[move] || i < flowPhase.index ? '#4a7c59' : 'rgba(255,255,255,0.12)' }}
            title={move}
          />
        ))}
        <button
          type="button"
          onClick={onEnd}
          data-testid="live-interview-end"
          className="ml-2 rounded-full px-3 py-1 font-label text-caption font-bold"
          style={{ background: 'rgba(178,58,42,0.18)', color: '#ff8a7a' }}
        >
          End interview
        </button>
      </div>
      <button
        type="button"
        onClick={onEnd}
        data-testid="live-interview-end-mobile"
        className="rounded-full px-3 py-1 font-label text-caption font-bold sm:hidden"
        style={{ background: 'rgba(178,58,42,0.18)', color: '#ff8a7a' }}
      >
        End
      </button>
    </div>
  )
}
