'use client'

import { useState, useRef, useCallback } from 'react'
import type { UserInterview } from '@/lib/data/dashboard'
import { DismissibleCard } from '@/components/dashboard/DismissibleCard'
import { CardPicker } from '@/components/dashboard/CardPicker'
import { DEFAULT_SIZES, COL_SPAN_CLASS } from '@/lib/dashboard-cards'
import { saveCardSizes } from '@/app/actions/dashboard'
import { QuickTakeCard } from '@/components/dashboard/cards/QuickTakeCard'
import { NextChallengeCard } from '@/components/dashboard/cards/NextChallengeCard'
import { MoveLevelsCard } from '@/components/dashboard/cards/MoveLevelsCard'
import { ProductIQCard } from '@/components/dashboard/cards/ProductIQCard'
import { InterviewCountdownCard } from '@/components/dashboard/cards/InterviewCountdownCard'
import { HotChallengesCard } from '@/components/dashboard/cards/HotChallengesCard'
import { DiscussionsCard } from '@/components/dashboard/cards/DiscussionsCard'
import { LeaderboardPeekCard } from '@/components/dashboard/cards/LeaderboardPeekCard'
import { RecentActivityCard } from '@/components/dashboard/cards/RecentActivityCard'
import { NotesCard } from '@/components/dashboard/cards/NotesCard'

// ---- Data interfaces ----

interface MoveLevel {
  move: string
  icon: string
  level: number
  pct: number
}

interface Dimension {
  label: string
  score: number
}

interface HotChallenge {
  title: string
  attempts: number
  avgScore: number
  domain: string
}

interface Discussion {
  challenge: string
  author: string
  preview: string
  time: string
}

interface LeaderboardEntry {
  rank: number
  name: string
  xp: number
  isCurrentUser?: boolean
}

interface Note {
  id: string
  content: string
  color: string
  pinned: boolean
  created_at: string
}

interface RecentActivity {
  name: string
  domain: string
  score: number
  date: string
}

export interface DashboardCardData {
  notes: Note[]
  hotChallenges: HotChallenge[]
  discussions: Discussion[]
  leaderboard: LeaderboardEntry[]
  userRank: number
  moveLevels: MoveLevel[]
  productiqScore: number
  productiqDelta: number
  weeklyActivity: number[]
  dimensions: Dimension[]
  featuredChallengeId: string
  featuredChallengeTitle: string
  featuredChallengeDomain: string
  featuredChallengeDifficulty: string
  interviewDate: string | null
  interviewMeta: { company?: string; round?: string }
  interviews: UserInterview[]
  recentActivity: RecentActivity[]
  quickTakePrompt: string
  lumaInsight: string | null
}

interface DashboardGridProps {
  visibleCards: string[]
  dismissedCards: string[]
  cardData: DashboardCardData
  initialCardSizes?: Record<string, number>
}

function ResizeHandle({ onResize }: { onResize: (delta: number) => void }) {
  const startX = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    startX.current = e.clientX
    const handleMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX.current
      if (Math.abs(delta) > 80) {
        onResize(delta > 0 ? 1 : -1)
        startX.current = ev.clientX
      }
    }
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      className="absolute bottom-1 left-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-ew-resize w-6 h-6 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container-highest"
    >
      <span className="material-symbols-outlined text-sm">drag_indicator</span>
    </div>
  )
}

export function DashboardGrid({ visibleCards, dismissedCards, cardData, initialCardSizes }: DashboardGridProps) {
  const [sizes, setSizes] = useState<Record<string, number>>(initialCardSizes ?? DEFAULT_SIZES)
  const [pickerOpen, setPickerOpen] = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncedSave = useCallback((newSizes: Record<string, number>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { saveCardSizes(newSizes) }, 500)
  }, [])

  const handleResize = (cardId: string, delta: number) => {
    const current = sizes[cardId] ?? DEFAULT_SIZES[cardId] ?? 1
    const next = Math.max(1, Math.min(3, current + delta)) as 1 | 2 | 3
    if (next === (current as 1 | 2 | 3)) return
    const newSizes = { ...sizes, [cardId]: next }
    setSizes(newSizes)
    debouncedSave(newSizes)
  }

  function renderCardContent(cardId: string) {
    switch (cardId) {
      case 'quick_take':
        return (
          <QuickTakeCard
            prompt={cardData.quickTakePrompt}
            challengeId={cardData.featuredChallengeId || 'orientation'}
            lumaContext={cardData.lumaInsight}
          />
        )
      case 'next_challenge':
        return (
          <NextChallengeCard
            title={cardData.featuredChallengeTitle}
            domain={cardData.featuredChallengeDomain}
            difficulty={cardData.featuredChallengeDifficulty}
            challengeId={cardData.featuredChallengeId || 'orientation'}
            lumaInsight={cardData.lumaInsight}
          />
        )
      case 'move_levels':
        return <MoveLevelsCard levels={cardData.moveLevels} />
      case 'productiq':
        return (
          <ProductIQCard
            score={cardData.productiqScore}
            delta={cardData.productiqDelta}
            weeklyActivity={cardData.weeklyActivity}
            dimensions={cardData.dimensions}
          />
        )
      case 'interview_countdown':
        return <InterviewCountdownCard interviews={cardData.interviews} />
      case 'hot_challenges':
        return <HotChallengesCard challenges={cardData.hotChallenges} />
      case 'discussions':
        return <DiscussionsCard discussions={cardData.discussions} />
      case 'leaderboard':
        return <LeaderboardPeekCard entries={cardData.leaderboard} userRank={cardData.userRank} />
      case 'notes':
        return <NotesCard notes={cardData.notes} />
      case 'recent_activity':
        return <RecentActivityCard activities={cardData.recentActivity} />
      default:
        return null
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCards.map((cardId) => {
          const content = renderCardContent(cardId)
          if (!content) return null
          const size = sizes[cardId] ?? DEFAULT_SIZES[cardId] ?? 1
          const spanClass = COL_SPAN_CLASS[size as 1 | 2 | 3]

          return (
            <div key={cardId} className={`relative group ${spanClass}`}>
              <DismissibleCard cardId={cardId}>
                {content}
              </DismissibleCard>

              <ResizeHandle onResize={(delta) => handleResize(cardId, delta)} />
            </div>
          )
        })}

        {/* Add card button — always last, full width */}
        <div className="lg:col-span-3">
          <button
            onClick={() => setPickerOpen(true)}
            className="w-full h-16 border-2 border-dashed border-outline-variant/50 rounded-xl text-on-surface-variant text-sm font-label hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Add card
          </button>
        </div>
      </div>

      {pickerOpen && (
        <CardPicker
          dismissedCards={dismissedCards}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  )
}
