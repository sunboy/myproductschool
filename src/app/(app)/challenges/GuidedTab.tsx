'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface CohortData {
  total_participants: number
  user_rank: number | null
  user_percentile: number | null
  rankings: Array<{ rank: number; user_id: string; display_name: string; score: number }>
}

interface Company {
  id: string
  name: string
  slug: string
  challenge_count: number
}

interface ChapterItem {
  id: string
  slug?: string
  title: string
  difficulty: string
  best_score: number | null
  is_completed: boolean
}

interface Chapter {
  key: string
  title: string
  icon: string
  items: ChapterItem[]
}

const COMPANIES_MOCK: Company[] = [
  { id: '1', name: 'Google', slug: 'google', challenge_count: 0 },
  { id: '2', name: 'Meta', slug: 'meta', challenge_count: 0 },
  { id: '3', name: 'Stripe', slug: 'stripe', challenge_count: 0 },
  { id: '4', name: 'Amazon', slug: 'amazon', challenge_count: 0 },
  { id: '5', name: 'Apple', slug: 'apple', challenge_count: 0 },
  { id: '6', name: 'Uber', slug: 'uber', challenge_count: 0 },
  { id: '7', name: 'Airbnb', slug: 'airbnb', challenge_count: 0 },
  { id: '8', name: 'DoorDash', slug: 'doordash', challenge_count: 0 },
]

const COMPANY_COLORS: Record<string, string> = {
  google: 'text-primary', meta: 'text-blue-600', stripe: 'text-indigo-500',
  amazon: 'text-orange-500', apple: 'text-gray-800', uber: 'text-black',
  airbnb: 'text-red-500', doordash: 'text-red-600',
}

export function GuidedTab() {
  const [companies, setCompanies] = useState<Company[]>(COMPANIES_MOCK)
  const [selectedCompany, setSelectedCompany] = useState<Company>(COMPANIES_MOCK[0])
  const [coachingDismissed, setCoachingDismissed] = useState(false)
  const [expandedChapter, setExpandedChapter] = useState<number | null>(1)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [cohort, setCohort] = useState<CohortData | null>(null)

  useEffect(() => {
    fetch('/api/prep/companies')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.length) {
          setCompanies(data)
          setSelectedCompany(data[0])
        }
      })
      .catch(() => {})

    fetch('/api/prep/challenges')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.chapters?.length) setChapters(data.chapters) })
      .catch(() => {})

    fetch('/api/cohort/leaderboard')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCohort(data) })
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      {/* Company Selector */}
      <section className="relative">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {companies.map(company => {
            const isSelected = selectedCompany.id === company.id
            const initial = company.name[0].toUpperCase()
            const colorClass = COMPANY_COLORS[company.slug] ?? 'text-on-surface'
            return (
              <button
                key={company.id}
                onClick={() => {
                  setSelectedCompany(company)
                  localStorage.setItem('hackproduct_prep_company', company.name)
                }}
                className={`flex-shrink-0 w-[120px] rounded-xl p-3 text-center transition-all hover:scale-105 ${isSelected ? 'bg-primary-fixed border-2 border-primary' : 'bg-surface-container hover:bg-surface-container-high border border-transparent'}`}
              >
                <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center mx-auto mb-2 font-bold shadow-sm ${colorClass}`}>{initial}</div>
                <div className="text-sm font-bold text-on-surface truncate">{company.name}</div>
                {company.challenge_count > 0 && (
                  <div className={`text-[10px] font-bold ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}>{company.challenge_count} challenges</div>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* Selected Company Detail */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Study Plan */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="bg-surface-container rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-headline flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-white flex items-center justify-center text-[10px] text-primary border border-outline-variant">{selectedCompany.name[0]}</span>
                {selectedCompany.name} Study Plan
              </h2>
              <span className="bg-primary-fixed text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">Recommended</span>
            </div>

            {/* Chapters */}
            <div className="space-y-3">
              {chapters.map((chapter, chIdx) => {
                const isExpanded = expandedChapter === chIdx + 1
                const completedCount = chapter.items.filter(i => i.is_completed).length
                return (
                  <div key={chapter.key} className="border border-outline-variant rounded-xl overflow-hidden bg-white">
                    <button
                      onClick={() => setExpandedChapter(isExpanded ? null : chIdx + 1)}
                      className="w-full flex items-center justify-between p-4 bg-surface-container-high/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{chapter.icon}</span>
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-sm">{chapter.title}</div>
                          <div className="text-[10px] text-on-surface-variant">{completedCount}/{chapter.items.length} completed</div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                    </button>
                    {isExpanded && (
                      <div className="p-2 space-y-1">
                        {chapter.items.map(item => (
                          <Link
                            key={item.id}
                            href={`/workspace/challenges/${item.slug ?? item.id}`}
                            className="flex items-center justify-between p-2.5 hover:bg-surface-container rounded-lg group transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`material-symbols-outlined text-lg ${item.is_completed ? 'text-primary' : 'text-outline'}`} style={item.is_completed ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                {item.is_completed ? 'check_circle' : 'radio_button_unchecked'}
                              </span>
                              <span className={`text-sm font-medium ${item.is_completed ? 'text-on-surface' : 'text-on-surface-variant'}`}>{item.title}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {item.best_score != null ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.best_score >= 70 ? 'text-primary bg-primary-fixed' : 'text-amber-700 bg-tertiary-container'}`}>
                                  {item.best_score}/100
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Start</span>
                              )}
                              <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {chapters.length === 0 && (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border border-outline-variant rounded-xl p-4 h-14 bg-surface-container/50" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Community */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/30">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
              <h3 className="font-bold text-sm">This Week&apos;s Cohort</h3>
            </div>

            {cohort === null ? (
              /* Loading */
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-surface-container-highest rounded w-3/4" />
                <div className="h-4 bg-surface-container-highest rounded w-1/2" />
                <div className="h-4 bg-surface-container-highest rounded w-2/3" />
              </div>
            ) : cohort.total_participants === 0 ? (
              /* No active cohort */
              <div className="flex flex-col items-center py-4 gap-2 text-center">
                <LumaGlyph size={36} state="idle" className="text-primary" />
                <p className="text-xs text-on-surface-variant">No active cohort challenge this week.</p>
                <Link href="/cohort" className="text-xs font-bold text-primary hover:underline">Check back soon →</Link>
              </div>
            ) : (
              <>
                {/* Participant count */}
                <p className="text-xs text-on-surface-variant mb-4">
                  <span className="font-bold text-on-surface">{cohort.total_participants}</span> engineers competing this week
                </p>

                {/* Top 3 */}
                <div className="space-y-2 mb-4">
                  {cohort.rankings.slice(0, 3).map((r) => {
                    const isYou = r.user_id !== 'u1' && r.user_id !== 'u2' && r.user_id !== 'u4' && cohort.user_rank === r.rank
                    const medals = ['🥇', '🥈', '🥉']
                    return (
                      <div key={r.user_id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${isYou ? 'bg-primary/10 border border-primary/20' : 'bg-surface-container-low'}`}>
                        <div className="flex items-center gap-2">
                          <span>{medals[r.rank - 1] ?? `#${r.rank}`}</span>
                          <span className={`font-medium ${isYou ? 'text-primary font-bold' : 'text-on-surface'}`}>
                            {isYou ? 'You' : r.display_name}
                          </span>
                        </div>
                        <span className="font-bold text-on-surface-variant">{r.score}</span>
                      </div>
                    )
                  })}
                </div>

                {/* User's own rank if outside top 3 */}
                {cohort.user_rank !== null && cohort.user_rank > 3 && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg text-xs bg-primary/10 border border-primary/20 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-on-surface-variant">#{cohort.user_rank}</span>
                      <span className="font-bold text-primary">You</span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant">Top {100 - (cohort.user_percentile ?? 0)}%</span>
                  </div>
                )}

                <Link
                  href="/cohort"
                  className="flex items-center justify-center gap-1 w-full py-2 rounded-full border border-primary/30 text-xs font-bold text-primary hover:bg-primary/5 transition-colors"
                >
                  View full leaderboard
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer Coaching Strip */}
      {!coachingDismissed && (
        <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl flex items-center gap-4">
          <LumaGlyph size={28} state="speaking" className="text-primary shrink-0" />
          <p className="text-sm text-on-surface-variant leading-tight flex-1">
            <span className="font-bold text-on-surface">Luma&apos;s Tip:</span> Strong <span className="text-primary font-bold italic">Problem Framing</span> is the most common differentiator at Staff-level interviews. Before listing solutions, make sure you&apos;ve defined the core tension clearly.
          </p>
          <button
            onClick={() => setCoachingDismissed(true)}
            className="text-xs font-bold text-primary px-4 py-2 hover:bg-primary-fixed rounded-full transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
