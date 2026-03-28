'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

type Challenge = {
  name: string
  status: 'completed' | 'available' | 'locked'
  type?: string
  difficulty?: string
  difficultyColor?: string
  roles?: string
  flowSymbols?: string
}
type Chapter = { id: number; title: string; challenges?: Challenge[] }

const chapters: Chapter[] = [
  {
    id: 1,
    title: 'See Product in Code',
    challenges: [
      { name: 'The Feature That Backfired', status: 'completed', type: 'Traditional', difficulty: 'Easy', difficultyColor: 'text-green-600', roles: 'SWE, Data', flowSymbols: '◇◈◆◎' },
      { name: 'Power User Paradox', status: 'available', type: 'Traditional', difficulty: 'Medium', difficultyColor: 'text-orange-500', roles: 'SWE, Data, EM', flowSymbols: '◇◈◎' },
      { name: 'Funnel Drop Analysis', status: 'locked', type: 'Traditional', difficulty: 'Medium', difficultyColor: 'text-orange-500', roles: 'Data, SWE', flowSymbols: '◇◈◆' },
      { name: 'The Activation Mystery', status: 'locked', type: 'Traditional', difficulty: 'Hard', difficultyColor: 'text-error', roles: 'SWE, Data', flowSymbols: '◇◈◆◎' },
      { name: 'Retention vs Revenue', status: 'locked', type: 'Traditional', difficulty: 'Hard', difficultyColor: 'text-error', roles: 'EM, SWE', flowSymbols: '◇◈◆◎' },
    ],
  },
  { id: 2, title: 'Drive Decisions' },
  { id: 3, title: 'Systems & Incentives' },
  { id: 4, title: 'AI-Era Thinking' },
  { id: 5, title: 'Hard Mode' },
  { id: 6, title: 'AI-Native Frontier' },
]

const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const schedule = ['done', 'done', 'current', '', '', '', '']

export default function StudyPlanDetailPage() {
  const [expandedChapter, setExpandedChapter] = useState(1)

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 animate-fade-in-up">
      <div className="grid grid-cols-12 gap-3">
        {/* Plan Header Section */}
        <section className="col-span-12 lg:col-span-8 space-y-3">
          <div className="card-elevated rounded-xl p-4">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-3">
              <Link href="/explore" className="hover:text-primary transition-colors">Explore</Link>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <Link href="/prep/study-plans" className="hover:text-primary transition-colors">Study Plans</Link>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span className="font-bold text-on-surface">Staff Engineer Path</span>
            </nav>

            {/* Title & Meta */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
              <div>
                <h1 className="text-xl font-bold font-headline text-on-surface mb-1">Staff Engineer Path</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-primary-fixed text-primary px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide">SWE</span>
                  <span className="text-xs text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">schedule</span>
                    6 weeks &middot; 6 chapters &middot; 30 challenges
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="bg-secondary-container text-on-surface-variant hover:bg-surface-container-high px-3 py-1.5 rounded-full text-xs font-bold transition-all">
                  Mark as active
                </button>
                <button className="bg-primary text-on-primary hover:opacity-90 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all flex items-center gap-1">
                  Continue Plan <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
              </div>
            </div>

            <p className="text-on-surface-variant text-xs max-w-2xl mb-3">
              The Blind 75 for product sense. 30 problems that build the complete toolkit for Senior &rarr; Staff.
            </p>

            {/* Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-primary">3 of 30 challenges completed</span>
                <span className="text-xs text-on-surface-variant font-medium">10% Complete</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '10%' }} />
              </div>
            </div>
          </div>

          {/* Chapter Accordion List */}
          <div className="space-y-2">
            {chapters.map((ch) => {
              const isFirst = ch.id === 1
              const isExpanded = expandedChapter === ch.id && isFirst
              const isLocked = !isFirst

              if (isLocked) {
                return (
                  <div key={ch.id} className="card-elevated rounded-xl p-3 flex items-center justify-between cursor-not-allowed opacity-80">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant text-[10px] font-bold">{ch.id}</div>
                      <h2 className="text-sm font-bold text-on-surface-variant">{ch.title}</h2>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant/40 text-lg">lock</span>
                  </div>
                )
              }

              return (
                <div key={ch.id} className="card-elevated rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedChapter(isExpanded ? 0 : ch.id)}
                    className="w-full p-3 flex items-center justify-between cursor-pointer bg-primary-fixed/20"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary text-[10px] font-bold">{ch.id}</div>
                      <h2 className="text-sm font-bold font-headline text-on-surface">{ch.title}</h2>
                    </div>
                    <span className="material-symbols-outlined text-primary text-lg">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {isExpanded && ch.challenges && (
                    <div className="divide-y divide-outline-variant/20">
                      {ch.challenges.map((c, i) => (
                        <div
                          key={i}
                          className={`px-3 py-2.5 flex items-center justify-between gap-3 ${
                            c.status === 'available' ? 'bg-primary/5 hover:bg-primary/10' :
                            c.status === 'locked' ? 'opacity-70' :
                            'hover:bg-surface-container-low'
                          } transition-colors`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="text-xs font-bold text-on-surface truncate">{c.name}</h3>
                              {c.type && (
                                <span className="bg-secondary-container text-[10px] px-1.5 py-0.5 rounded-full font-bold">{c.type}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
                              {c.difficulty && (
                                <span className={`${c.difficultyColor} font-bold uppercase`}>{c.difficulty}</span>
                              )}
                              {c.roles && <span>{c.roles}</span>}
                              {c.flowSymbols && <span className="text-outline-variant">{c.flowSymbols}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {c.status === 'completed' && (
                              <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                                Completed <span className="material-symbols-outlined text-xs">check_circle</span>
                              </span>
                            )}
                            {c.status === 'available' && (
                              <button className="bg-primary text-on-primary px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-0.5 hover:opacity-90 transition-opacity">
                                Start <span className="material-symbols-outlined text-xs">arrow_forward</span>
                              </button>
                            )}
                            {c.status === 'locked' && (
                              <span className="text-[10px] font-medium text-on-surface-variant flex items-center gap-0.5">
                                Locked <span className="material-symbols-outlined text-xs">lock</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Sidebar Column */}
        <aside className="col-span-12 lg:col-span-4 space-y-3">
          {/* Luma Tip Card */}
          <div className="card-elevated rounded-xl p-4 border border-primary-container/20">
            <div className="flex items-start gap-2">
              <LumaGlyph size={28} className="text-primary flex-shrink-0" />
              <div className="bg-white p-2.5 rounded-tr-xl rounded-br-xl rounded-bl-xl shadow-sm relative">
                <p className="text-xs font-medium text-on-surface leading-relaxed">
                  Complete Chapter 1 to unlock Chapter 2. You&apos;re 1 challenge away!
                </p>
              </div>
            </div>
          </div>

          {/* Plan Stats Card */}
          <div className="bg-white rounded-xl border border-outline-variant/20 p-3 shadow-sm">
            <h3 className="text-xs font-bold mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-sm">analytics</span>
              Plan Insights
            </h3>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">Total Practicing</span>
                <span className="font-bold">1,240 Engineers</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">Success Rate</span>
                <span className="font-bold">68%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">Est. Effort</span>
                <span className="font-bold">3h / week</span>
              </div>
              <hr className="border-outline-variant/20" />
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Top Skills You&apos;ll Build</span>
                <div className="flex flex-wrap gap-1">
                  {['Decision Making', 'System Incentives', 'Product Intuition'].map((skill) => (
                    <span
                      key={skill}
                      className="bg-secondary-container text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="bg-white rounded-xl border border-outline-variant/20 p-3 shadow-sm">
            <h3 className="text-xs font-bold mb-2 flex items-center gap-1.5">
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
                        ? 'bg-primary text-on-primary'
                        : schedule[i] === 'current'
                        ? 'bg-primary-fixed border-2 border-primary text-primary'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    {schedule[i] === 'done' ? '\u2713' : schedule[i] === 'current' ? '3' : null}
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
