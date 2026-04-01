'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface Company {
  id: string
  name: string
  slug: string
  challenge_count: number
}

interface ChapterItem {
  id: string
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
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>(COMPANIES_MOCK)
  const [selectedCompany, setSelectedCompany] = useState<Company>(COMPANIES_MOCK[0])
  const [coachingDismissed, setCoachingDismissed] = useState(false)
  const [interviewDate, setInterviewDate] = useState<string | null>(null)
  const [expandedChapter, setExpandedChapter] = useState<number | null>(1)
  const [chapters, setChapters] = useState<Chapter[]>([])

  const daysLeft = interviewDate
    ? Math.max(0, Math.ceil((new Date(interviewDate).getTime() - new Date().getTime()) / 86400000))
    : null

  useEffect(() => {
    const saved = localStorage.getItem('hackproduct_interview_date')
    if (saved) setInterviewDate(saved)
  }, [])

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
  }, [])

  useEffect(() => {
    fetch('/api/prep/challenges')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.chapters?.length) setChapters(data.chapters) })
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
                            href={`/challenges/${item.id}`}
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

        {/* Right Column: Status & Simulation */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Prep Status Card */}
          <div className="bg-surface-container rounded-xl p-5 shadow-sm border border-white/50">
            <h3 className="font-bold text-sm mb-4">Prep Status</h3>
            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle className="text-outline-variant" cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeWidth="6" />
                  <circle className="text-primary" cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeDasharray="213.6" strokeDashoffset="138.8" strokeWidth="6" />
                </svg>
                <span className="absolute text-xl font-black font-headline text-on-surface">35%</span>
              </div>
              <div className="flex-1 space-y-1">
                {daysLeft !== null ? (
                  <div className="text-xs font-bold text-orange-700">{daysLeft} days until interview</div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-on-surface-variant">Interview date:</span>
                    <input
                      type="date"
                      className="text-xs border border-outline-variant rounded-lg px-2 py-1 bg-surface-container focus:outline-none focus:border-primary"
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => {
                        setInterviewDate(e.target.value)
                        localStorage.setItem('hackproduct_interview_date', e.target.value)
                      }}
                    />
                  </div>
                )}
                <p className="text-[10px] text-on-surface-variant">Complete more challenges to track your progress</p>
                <div className="w-full bg-outline-variant h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-primary h-full w-[35%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Mock Interview Simulation */}
          <div className="bg-primary-fixed rounded-xl p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <LumaGlyph size={128} state="idle" className="text-primary" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <LumaGlyph size={40} state="speaking" className="text-primary" />
                <div>
                  <h3 className="font-black font-headline text-primary leading-none">Practice with Luma</h3>
                  <p className="text-[10px] font-bold text-primary/70 uppercase tracking-tighter">AI-Powered Simulation</p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-5 px-1">
                <span className="text-xs font-bold text-primary">Standard</span>
                <div className="w-8 h-4 bg-primary/20 rounded-full relative p-0.5 cursor-pointer">
                  <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                </div>
                <span className="text-xs font-bold text-primary/40">Advanced</span>
              </div>
              <button
                onClick={() => router.push('/simulation')}
                className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#3d6549] transition-colors shadow-md"
              >
                Start Simulation
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Community Card */}
          <div className="bg-surface-container rounded-xl p-4 shadow-sm border border-outline-variant/30">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full border-2 border-surface-container bg-primary-fixed flex items-center justify-center text-[8px] font-bold text-primary">A</div>
                <div className="w-6 h-6 rounded-full border-2 border-surface-container bg-tertiary-container flex items-center justify-center text-[8px] font-bold text-tertiary">B</div>
                <div className="w-6 h-6 rounded-full border-2 border-surface-container bg-secondary-container flex items-center justify-center text-[8px] font-bold text-secondary">C</div>
                <div className="w-6 h-6 rounded-full border-2 border-surface-container bg-surface-container-high flex items-center justify-center text-[8px] font-bold">+9</div>
              </div>
              <span className="text-xs font-bold text-on-surface-variant">Engineers practicing for {selectedCompany.name}</span>
            </div>
            <Link className="mt-3 block text-[11px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1" href="/cohort">
              Join discussion
              <span className="material-symbols-outlined text-xs">chevron_right</span>
            </Link>
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
