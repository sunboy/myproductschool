'use client'

import type { RefObject } from 'react'
import type { HatchAvatarState } from '@/components/live-interview/HatchAvatar'
import type { FlowPhase } from '@/lib/live-interview/flow-phase'
import { RoomBar } from '@/components/density/interviews/room/RoomBar'
import { HatchColumn } from '@/components/density/interviews/room/HatchColumn'
import { TranscriptComposer } from '@/components/density/interviews/room/TranscriptComposer'
import { TurnBubble, type CoachingSignal, type TranscriptTurn } from '@/app/(app)/live-interviews/[id]/page'

interface RoomLayoutV2Props {
  companyName: string
  roleName: string
  disciplineLabel: string
  isActive: boolean
  timerDisplay: string
  isWarning: boolean
  flowPhase: FlowPhase
  hatchState: HatchAvatarState
  currentCaption: string
  isCaptionsOn: boolean
  recentSignals: Array<CoachingSignal & { id: string; time: number }>
  turns: TranscriptTurn[]
  quickReplies: string[]
  chatInput: string
  setChatInput: (value: string) => void
  isChatSending: boolean
  chatInputRef?: RefObject<HTMLInputElement | null>
  onSendChatMessage: (text: string) => Promise<void> | void
  onQuickReply: (text: string) => void
  onBack: () => void
  onEnd: () => void
  onReplayTour: () => void
  /** Center stage: notes pad, canvas, or code editor depending on discipline. */
  centerContent: React.ReactNode
}

/**
 * Three-column density interview room (design spec §4.12): 300px HatchColumn,
 * flexible center stage, transcript column. Composed from legacy handlers and
 * exported legacy pieces (TurnBubble) rather than reimplementing behavior.
 */
export function RoomLayoutV2({
  companyName,
  roleName,
  disciplineLabel,
  isActive,
  timerDisplay,
  isWarning,
  flowPhase,
  hatchState,
  currentCaption,
  isCaptionsOn,
  recentSignals,
  turns,
  quickReplies,
  chatInput,
  setChatInput,
  isChatSending,
  chatInputRef,
  onSendChatMessage,
  onQuickReply,
  onBack,
  onEnd,
  onReplayTour,
  centerContent,
}: RoomLayoutV2Props) {
  return (
    <div className="flex h-screen flex-col" style={{ background: '#1c1f1d' }} data-testid="room-layout-v2">
      <RoomBar
        companyName={companyName}
        roleName={roleName}
        disciplineLabel={disciplineLabel}
        isActive={isActive}
        timerDisplay={timerDisplay}
        isWarning={isWarning}
        flowPhase={flowPhase}
        onBack={onBack}
        onEnd={onEnd}
        onReplayTour={onReplayTour}
      />

      <div className="flex min-h-0 flex-1">
        <HatchColumn
          hatchState={hatchState}
          currentCaption={currentCaption}
          isCaptionsOn={isCaptionsOn}
          recentSignals={recentSignals}
          totalTurns={turns.length}
          quickReplies={quickReplies}
          onQuickReply={onQuickReply}
          isSending={isChatSending}
        />

        <div className="flex min-w-0 flex-1 flex-col border-x" style={{ borderColor: 'rgba(255,255,255,0.07)' }} data-tour-target="interview-stage">
          {centerContent}
        </div>

        <div className="flex h-full w-[340px] shrink-0 flex-col" data-tour-target="interview-transcript" data-testid="interview-transcript-column">
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {turns.length === 0 ? (
              <p className="mt-6 text-center font-body text-[12.5px]" style={{ color: 'rgba(243,237,224,0.35)' }}>
                Your conversation will appear here.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {turns.map((turn) => (
                  <TurnBubble key={turn.id} turn={turn} />
                ))}
              </div>
            )}
          </div>
          <TranscriptComposer
            value={chatInput}
            onChange={setChatInput}
            sending={isChatSending}
            inputRef={chatInputRef}
            onSubmit={onSendChatMessage}
          />
        </div>
      </div>
    </div>
  )
}
