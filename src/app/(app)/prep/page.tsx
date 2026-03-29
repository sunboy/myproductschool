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

const COMPANIES_MOCK: Company[] = [
  { id: '1', name: 'Google', slug: 'google', challenge_count: 24 },
  { id: '2', name: 'Meta', slug: 'meta', challenge_count: 18 },
  { id: '3', name: 'Stripe', slug: 'stripe', challenge_count: 12 },
  { id: '4', name: 'Amazon', slug: 'amazon', challenge_count: 15 },
  { id: '5', name: 'Apple', slug: 'apple', challenge_count: 8 },
  { id: '6', name: 'Uber', slug: 'uber', challenge_count: 10 },
  { id: '7', name: 'Airbnb', slug: 'airbnb', challenge_count: 6 },
  { id: '8', name: 'DoorDash', slug: 'doordash', challenge_count: 5 },
]

const COMPANY_COLORS: Record<string, string> = {
  google: 'text-primary', meta: 'text-blue-600', stripe: 'text-indigo-500',
  amazon: 'text-orange-500', apple: 'text-gray-800', uber: 'text-black',
  airbnb: 'text-red-500', doordash: 'text-red-600',
}

export default function PrepHubPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>(COMPANIES_MOCK)
  const [selectedCompany, setSelectedCompany] = useState<Company>(COMPANIES_MOCK[0])
  const [coachingDismissed, setCoachingDismissed] = useState(false)
  const [interviewDate, setInterviewDate] = useState<string | null>(null)

  const daysLeft = interviewDate
    ? Math.max(0, Math.ceil((new Date(interviewDate).getTime() - Date.now()) / 86400000))
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

  return (
    <div className="p-6 bg-background space-y-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline text-on-surface leading-none">Prep Hub</h1>
          <p className="text-sm text-on-surface-variant mt-1">Tell Luma where you&apos;re interviewing</p>
        </div>
      </div>

      {/* Section 1: Company Selector */}
      <section className="relative">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {companies.map(company => {
            const isSelected = selectedCompany.id === company.id
            const initial = company.name[0].toUpperCase()
            const colorClass = COMPANY_COLORS[company.slug] ?? 'text-on-surface'
            return (
              <button
                key={company.id}
                onClick={() => setSelectedCompany(company)}
                className={`flex-shrink-0 w-[120px] rounded-xl p-3 text-center transition-all hover:scale-105 ${isSelected ? 'bg-primary-fixed border-2 border-primary' : 'bg-surface-container hover:bg-surface-container-high border border-transparent'}`}
              >
                <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center mx-auto mb-2 font-bold shadow-sm ${colorClass}`}>{initial}</div>
                <div className="text-sm font-bold text-on-surface truncate">{company.name}</div>
                <div className={`text-[10px] font-bold ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}>{company.challenge_count} challenges</div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Section 2: Selected Company Detail */}
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
              {/* Chapter 1: Expanded */}
              <div className="border border-outline-variant rounded-xl overflow-hidden bg-white">
                <button className="w-full flex items-center justify-between p-4 bg-surface-container-high/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    </div>
                    <span className="font-bold text-sm">Chapter 1: Product Sense &amp; Logic</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">expand_less</span>
                </button>
                <div className="p-2 space-y-1">
                  {/* Item 1 */}
                  <Link href="/challenges" className="flex items-center justify-between p-2.5 hover:bg-surface-container rounded-lg group transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                      <span className="text-sm font-medium">Improve Google Maps for commuters</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded-full">78/100</span>
                      <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </Link>
                  {/* Item 2 */}
                  <Link href="/challenges" className="flex items-center justify-between p-2.5 hover:bg-surface-container rounded-lg group transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                      <span className="text-sm font-medium">Design a new Google Workspace feature</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-amber-700 bg-tertiary-container px-2 py-0.5 rounded-full">65/100</span>
                      <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </Link>
                  {/* Item 3 */}
                  <Link href="/challenges" className="flex items-center justify-between p-2.5 hover:bg-surface-container rounded-lg group transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-outline text-lg">radio_button_unchecked</span>
                      <span className="text-sm font-medium text-on-surface-variant">Google Search quality metrics</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Start</span>
                      <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </Link>
                  {/* Item 4 */}
                  <Link href="/challenges" className="flex items-center justify-between p-2.5 hover:bg-surface-container rounded-lg group transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-outline text-lg">radio_button_unchecked</span>
                      <span className="text-sm font-medium text-on-surface-variant italic">Concept: &apos;Platform thinking&apos;</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-tertiary uppercase tracking-tighter">Review</span>
                      <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Chapter 2: Collapsed */}
              <div className="border border-outline-variant rounded-xl overflow-hidden">
                <button className="w-full flex items-center justify-between p-4 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-outline-variant/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">monitoring</span>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm">Chapter 2: Execution &amp; Metrics</div>
                      <div className="text-[10px] text-on-surface-variant uppercase tracking-widest">3 challenges · 2 concepts</div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
                </button>
              </div>

              {/* Chapter 3: Locked */}
              <div className="border border-outline-variant rounded-xl overflow-hidden opacity-60 bg-surface-container/50">
                <div className="w-full flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-outline-variant/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">diversity_3</span>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm">Chapter 3: Leadership &amp; Behavioral</div>
                      <div className="text-[10px] text-primary font-bold">PRO ONLY</div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">lock</span>
                </div>
              </div>
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
                <p className="text-[10px] text-on-surface-variant">Ahead of 72% of candidates</p>
                <div className="w-full bg-outline-variant h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-primary h-full w-[72%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Mock Interview Simulation */}
          <div className="bg-primary-fixed rounded-xl p-5 shadow-sm relative overflow-hidden group">
            {/* Background Luma */}
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
              <span className="text-xs font-bold text-on-surface-variant">12 others prepping for Google</span>
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
            <span className="font-bold text-on-surface">Luma&apos;s Tip:</span> Google heavily weighs <span className="text-primary font-bold italic">User Empathy</span> in Product Sense rounds. Try to focus on the &ldquo;Why&rdquo; before jumping to &ldquo;How&rdquo; in your framework.
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
