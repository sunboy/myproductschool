'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { useStudyPlan } from '@/hooks/useStudyPlan'
import type { StudyPlanChapterChallenge } from '@/lib/types'

const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const schedule = ['done', 'done', 'current', '', '', '', '']

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return 'text-green-600'
    case 'intermediate': return 'text-orange-500'
    case 'advanced': return 'text-error'
    default: return 'text-on-surface-variant'
  }
}

function getDifficultyLabel(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return 'Easy'
    case 'intermediate': return 'Medium'
    case 'advanced': return 'Hard'
    default: return difficulty
  }
}

export default function StudyPlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = typeof params.slug === 'string' ? params.slug : Array.isArray(params.slug) ? params.slug[0] : ''

  const { plan, chapters, userProgress, isLoading, error } = useStudyPlan(slug)
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(userProgress?.is_active ?? false)

  // Once plan loads, expand first chapter by default
  const firstChapterId = chapters[0]?.id ?? null
  const activeExpanded = expandedChapter ?? firstChapterId

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-container-highest rounded w-64" />
          <div className="h-4 bg-surface-container-highest rounded w-96" />
          <div className="h-32 bg-surface-container-highest rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <p className="text-error">Plan not found.</p>
        <Link href="/prep/study-plans" className="text-primary text-sm mt-2 inline-block">← Back to Study Plans</Link>
      </div>
    )
  }

  const completedIds = new Set(userProgress?.completed_challenges ?? [])
  const totalChallenges = plan.challenge_count ?? chapters.reduce((s, ch) => s + (ch.challenge_ids?.length ?? 0), 0)
  const completedCount = completedIds.size
  const progressPct = totalChallenges > 0 ? Math.round((completedCount / totalChallenges) * 100) : 0

  return (
    <div className="max-w-7xl mx-auto p-6 animate-fade-in-up">
      <div className="grid grid-cols-12 gap-6">

        {/* ── Plan Header Section ── */}
        <section className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl p-5 border border-outline-variant/20 shadow-sm">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-4">
              <Link href="/explore" className="hover:text-primary transition-colors">Explore</Link>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <Link href="/prep/study-plans" className="hover:text-primary transition-colors">Study Plans</Link>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span className="font-bold text-on-surface">{plan.title}</span>
            </nav>

            {/* Title & Meta */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold font-headline text-on-surface mb-2">{plan.title}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  {(plan.role_tags ?? []).map(tag => (
                    <span key={tag} className="bg-primary-fixed text-primary px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide">{tag}</span>
                  ))}
                  <span className="text-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {plan.estimated_hours ? `${plan.estimated_hours}h` : ''} · {chapters.length} chapters · {totalChallenges} challenges
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsActive(true)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${isActive ? 'bg-primary-fixed text-primary' : 'bg-secondary-container text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  {isActive ? 'Active Plan ✓' : 'Mark as active'}
                </button>
                <button
                  onClick={() => router.push('/challenges')}
                  className="bg-primary text-white hover:opacity-90 px-5 py-2 rounded-full text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                >
                  Continue Plan <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>

            {plan.description && (
              <p className="text-on-surface-variant text-sm max-w-2xl mb-6">{plan.description}</p>
            )}

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-primary">{completedCount} of {totalChallenges} challenges completed</span>
                <span className="text-xs text-on-surface-variant font-medium">{progressPct}% Complete</span>
              </div>
              <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>

          {/* ── Chapter Accordion List ── */}
          <div className="space-y-3">
            {chapters.map((ch, idx) => {
              const isExpanded = activeExpanded === ch.id
              const isUnlocked = idx === 0 // first chapter always unlocked; future: check progress

              if (!isUnlocked) {
                return (
                  <div key={ch.id} className="bg-white rounded-xl border border-outline-variant/20 p-4 flex items-center justify-between cursor-not-allowed opacity-80">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant text-xs font-bold">{idx + 1}</div>
                      <h2 className="text-base font-bold text-on-surface-variant">{ch.title}</h2>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant/40">lock</span>
                  </div>
                )
              }

              return (
                <div key={ch.id} className="bg-white rounded-xl border border-primary-container/30 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setExpandedChapter(isExpanded ? null : ch.id)}
                    className="w-full p-4 flex items-center justify-between cursor-pointer bg-primary-fixed/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">{idx + 1}</div>
                      <h2 className="text-lg font-bold font-headline text-on-surface">{ch.title}</h2>
                    </div>
                    <span className="material-symbols-outlined text-primary">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {isExpanded && (ch.challenges ?? []).length > 0 && (
                    <div className="divide-y divide-outline-variant/20">
                      {(ch.challenges ?? []).map((c: StudyPlanChapterChallenge) => {
                        const isDone = completedIds.has(c.id)
                        return (
                          <div
                            key={c.id}
                            className="p-4 flex items-center justify-between gap-4 hover:bg-surface-container-low transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-bold text-on-surface truncate">{c.title}</h3>
                                {c.paradigm && (
                                  <span className="bg-secondary-container text-[10px] px-2 py-0.5 rounded-full font-bold">{c.paradigm}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-on-surface-variant">
                                <span className={`${getDifficultyColor(c.difficulty)} font-bold uppercase`}>
                                  {getDifficultyLabel(c.difficulty)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {isDone ? (
                                <span className="text-xs font-bold text-primary flex items-center gap-1">
                                  Completed <span className="material-symbols-outlined text-sm">check_circle</span>
                                </span>
                              ) : (
                                <Link
                                  href={`/challenges/${c.id}`}
                                  className="bg-primary text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 hover:opacity-90 transition-opacity"
                                >
                                  Start <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </Link>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {isExpanded && (ch.challenges ?? []).length === 0 && (
                    <div className="p-4 text-sm text-on-surface-variant text-center">No challenges in this chapter yet.</div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Sidebar Column ── */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">

          {/* Luma Tip Card */}
          <div className="bg-surface-container rounded-xl p-5 border border-primary-container/20">
            <div className="flex items-start gap-3 mb-3">
              <LumaGlyph size={32} state="speaking" className="text-primary shrink-0" />
              <div className="bg-white p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl shadow-sm relative">
                <p className="text-xs font-medium text-on-surface leading-relaxed">
                  {completedCount === 0
                    ? 'Start with Chapter 1 to build your foundation before tackling advanced topics.'
                    : completedCount < totalChallenges
                    ? `You're ${completedCount} / ${totalChallenges} through. Keep going!`
                    : 'You completed this plan! Try another path to keep leveling up.'}
                </p>
              </div>
            </div>
          </div>

          {/* Plan Stats Card */}
          <div className="bg-white rounded-xl border border-outline-variant/20 p-4 shadow-sm">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">analytics</span>
              Plan Insights
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">Chapters</span>
                <span className="font-bold">{chapters.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">Challenges</span>
                <span className="font-bold">{totalChallenges}</span>
              </div>
              {plan.estimated_hours && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant">Est. Effort</span>
                  <span className="font-bold">{plan.estimated_hours}h total</span>
                </div>
              )}
              {(plan.role_tags ?? []).length > 0 && (
                <>
                  <hr className="border-outline-variant/20" />
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Best for</span>
                    <div className="flex flex-wrap gap-1">
                      {(plan.role_tags ?? []).map(tag => (
                        <span key={tag} className="bg-secondary-container text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="bg-white rounded-xl border border-outline-variant/20 p-4 shadow-sm">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">calendar_month</span>
              My Schedule
            </h3>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] uppercase font-bold text-on-surface-variant">{day}</span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      schedule[i] === 'done'
                        ? 'bg-primary text-white'
                        : schedule[i] === 'current'
                        ? 'bg-primary-fixed border-2 border-primary text-primary'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    {schedule[i] === 'done' ? '✓' : schedule[i] === 'current' ? '3' : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
