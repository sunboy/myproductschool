'use client'

import { HatchImage, type HatchImageState } from '@/components/redesign/HatchImage'
import type { HatchAvatarState } from '@/components/live-interview/HatchAvatar'
import { COMPETENCY_LABELS, FLOW_COLORS, FLOW_NAMES, type CoachingSignal } from '@/app/(app)/live-interviews/[id]/page'

const HATCH_STATE_TO_IMAGE: Record<HatchAvatarState, HatchImageState> = {
  idle: 'idle',
  listening: 'listening',
  speaking: 'speaking',
  thinking: 'thinking',
  intrigued: 'listening',
  challenging: 'speaking',
  delighted: 'speaking',
}

interface HatchColumnProps {
  hatchState: HatchAvatarState
  currentCaption: string
  isCaptionsOn: boolean
  recentSignals: Array<CoachingSignal & { id: string; time: number }>
  totalTurns: number
  quickReplies: string[]
  onQuickReply: (text: string) => void
  isSending: boolean
}

/** 300px left column (design spec §4.12): Hatch avatar, prompt/caption card,
 *  a "Hatch is scoring" recent-signals checklist, and quick replies. */
export function HatchColumn({ hatchState, currentCaption, isCaptionsOn, recentSignals, totalTurns, quickReplies, onQuickReply, isSending }: HatchColumnProps) {
  return (
    <div className="flex h-full w-[300px] shrink-0 flex-col gap-3 overflow-y-auto px-3 py-3" data-testid="hatch-column">
      <div className="flex flex-col items-center gap-2 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <HatchImage state={HATCH_STATE_TO_IMAGE[hatchState] ?? 'idle'} size={72} />
        {isCaptionsOn && currentCaption && (
          <p className="text-center font-body text-meta leading-[1.5]" style={{ color: 'rgba(243,237,224,0.8)' }}>
            {currentCaption}
          </p>
        )}
      </div>

      <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="font-label text-caption font-bold uppercase tracking-wider" style={{ color: 'rgba(243,237,224,0.4)' }}>
          Hatch is scoring
        </p>
        {recentSignals.length === 0 ? (
          <p className="mt-2 font-body text-meta" style={{ color: 'rgba(243,237,224,0.4)' }}>
            Signals will appear here as you talk through the problem.
          </p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {recentSignals.slice(0, 4).map((s) => (
              <div key={s.id} className="rounded-[10px] p-2" style={{ background: `${FLOW_COLORS[s.flowMove] ?? '#4a7c59'}12`, border: `1px solid ${FLOW_COLORS[s.flowMove] ?? '#4a7c59'}25` }}>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: FLOW_COLORS[s.flowMove] ?? '#4a7c59' }} />
                  <span className="font-label text-caption font-semibold uppercase tracking-wider" style={{ color: FLOW_COLORS[s.flowMove] ?? '#4a7c59' }}>
                    {FLOW_NAMES[s.flowMove] ?? s.flowMove}
                  </span>
                  {s.competency && (
                    <span className="font-label text-caption" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      · {COMPETENCY_LABELS[s.competency] ?? s.competency}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 font-label text-caption" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {totalTurns} exchanges
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {quickReplies.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={isSending}
            onClick={() => onQuickReply(chip)}
            className="rounded-full px-2.5 py-1 font-label text-caption transition-colors disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(243,237,224,0.6)' }}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  )
}
