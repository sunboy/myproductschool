'use client'

import { useState, useEffect } from 'react'
import { DismissibleCard } from '@/components/dashboard/DismissibleCard'
import { CardPicker } from '@/components/dashboard/CardPicker'
import { DEFAULT_SIZES, COL_SPAN_CLASS } from '@/lib/dashboard-cards'
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
  recentActivity: RecentActivity[]
  quickTakePrompt: string
  lumaInsight: string | null
}

interface DashboardGridProps {
  visibleCards: string[]
  dismissedCards: string[]
  cardData: DashboardCardData
}

const STORAGE_KEY = 'dashboard-card-sizes'

export function DashboardGrid({ visibleCards, dismissedCards, cardData }: DashboardGridProps) {
  const [sizes, setSizes] = useState<Record<string, 1 | 2 | 3>>(DEFAULT_SIZES)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Load persisted sizes from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, number>
        const valid: Record<string, 1 | 2 | 3> = { ...DEFAULT_SIZES }
        for (const [k, v] of Object.entries(parsed)) {
          if (v === 1 || v === 2 || v === 3) valid[k] = v
        }
        setSizes(valid)
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  function resize(cardId: string, delta: 1 | -1) {
    setSizes(prev => {
      const current = prev[cardId] ?? DEFAULT_SIZES[cardId] ?? 1
      const next = Math.max(1, Math.min(3, current + delta)) as 1 | 2 | 3
      const updated = { ...prev, [cardId]: next }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // ignore storage errors
      }
      return updated
    })
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
        return <InterviewCountdownCard interviewDate={cardData.interviewDate} interviewMeta={cardData.interviewMeta} />
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

              {/* Resize buttons — bottom-right, visible on group hover */}
              <div className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={() => resize(cardId, -1)}
                  disabled={size <= 1}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-surface-container-highest text-on-surface-variant hover:bg-outline-variant disabled:opacity-30 transition-colors"
                  aria-label="Shrink card"
                >
                  <span className="material-symbols-outlined text-sm">remove</span>
                </button>
                <button
                  onClick={() => resize(cardId, 1)}
                  disabled={size >= 3}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-surface-container-highest text-on-surface-variant hover:bg-outline-variant disabled:opacity-30 transition-colors"
                  aria-label="Expand card"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
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
