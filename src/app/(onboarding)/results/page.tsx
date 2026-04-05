'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import type { CalibrationResults } from '@/lib/types'

const STARTING_LEVELS_MOCK = [
  { icon: 'diamond', name: 'Frame', level: 'Level 3', highlight: false },
  { icon: 'vignette', name: 'List', level: 'Level 2', highlight: false },
  { icon: 'pentagon', name: 'Optimize', level: 'Level 2', highlight: false },
  { icon: 'circle', name: 'Win', level: 'Focus area', highlight: true },
]

export default function ResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<CalibrationResults | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [radarVisible, setRadarVisible] = useState(false)
  const [firstName, setFirstName] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/onboarding/results').then(r => r.ok ? r.json() : null),
      fetch('/api/profile').then(r => r.ok ? r.json() : null),
    ])
      .then(([resultsData, profileData]) => {
        if (resultsData) setResults(resultsData)
        if (profileData?.display_name) {
          setFirstName(profileData.display_name.trim().split(/\s+/)[0])
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  // Raph Koster: animate radar chart reveal on mount
  useEffect(() => {
    const t = setTimeout(() => setRadarVisible(true), 500)
    return () => clearTimeout(t)
  }, [])

  const handleStartChallenge = async () => {
    setIsCompleting(true)
    try {
      await fetch('/api/onboarding/complete', { method: 'POST' })
    } catch {
      // Non-fatal — proceed regardless
    }
    router.push('/dashboard')
  }

  const scores = results?.scores ?? { frame: 72, list: 58, optimize: 65, win: 44 }
  const archetype = results?.archetype ?? 'The Systematic Builder'
  const archetypeDescription = results?.archetype_description ?? 'You construct solutions methodically with strong framing, but your narrative communication (Win move) needs development.'
  const percentile = results?.percentile ?? 61

  const startingLevels = results?.starting_levels
    ? [
        { icon: 'diamond',  name: 'Frame',    level: `Level ${results.starting_levels.frame}`,    highlight: results.starting_levels.frame < 2 },
        { icon: 'vignette', name: 'List',     level: `Level ${results.starting_levels.list}`,     highlight: results.starting_levels.list < 2 },
        { icon: 'pentagon', name: 'Weigh', level: `Level ${results.starting_levels.weigh}`, highlight: results.starting_levels.weigh < 2 },
        { icon: 'circle',   name: 'Sell',  level: `Level ${results.starting_levels.sell}`,  highlight: results.starting_levels.sell < 2 },
      ]
    : STARTING_LEVELS_MOCK

  return (
    <div className="min-h-screen pb-20">
      {/* Top App Bar */}
      <header className="h-12 w-full sticky top-0 z-50 bg-background border-b border-outline-variant flex items-center justify-between px-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Link href="/calibration/frame" className="hover:bg-surface-container p-1 rounded-full transition-colors active:scale-95">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </Link>
          <span className="font-headline text-2xl font-bold text-primary">HackProduct</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center overflow-hidden">
          <LumaGlyph size={28} state="idle" className="text-primary" />
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <h1 className="font-headline text-2xl font-extrabold text-on-surface">Your Baseline Results</h1>
        </div>

        {/* Section 1: Luma Speaking Card */}
        <section className="bg-surface-container rounded-xl p-4 flex gap-4 items-start relative">
          <div className="shrink-0">
            <LumaGlyph size={64} state="speaking" className="text-primary rounded-lg bg-white/50 p-1" />
          </div>
          <div className="relative bg-white p-3 rounded-lg rounded-tl-none border border-outline-variant shadow-sm text-sm">
            <p className="text-on-surface-variant leading-relaxed">
              {firstName ? `${firstName}, based` : 'Based'} on your calibration challenge, here&apos;s your starting baseline...
            </p>
            <div className="absolute -left-2 top-0 w-0 h-0 border-t-[8px] border-t-white border-l-[8px] border-l-transparent" />
          </div>
        </section>

        {/* Section 2: Radar Chart */}
        <section className="flex flex-col items-center justify-center py-4 bg-white rounded-xl shadow-sm border border-outline-variant/30">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-45" viewBox="0 0 200 200">
              {/* Web circles */}
              <circle cx="100" cy="100" r="80" fill="none" stroke="#eae6de" strokeWidth="1" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="#eae6de" strokeWidth="1" />
              <circle cx="100" cy="100" r="40" fill="none" stroke="#eae6de" strokeWidth="1" />
              <circle cx="100" cy="100" r="20" fill="none" stroke="#eae6de" strokeWidth="1" />
              {/* Axes */}
              <line x1="100" y1="20" x2="100" y2="180" stroke="#eae6de" strokeWidth="1" />
              <line x1="20" y1="100" x2="180" y2="100" stroke="#eae6de" strokeWidth="1" />
              {/* Data Shape computed from scores — animated reveal */}
              <polygon
                points={`100,${100 - scores.frame * 0.8} ${100 + scores.list * 0.8},100 100,${100 + scores.optimize * 0.8} ${100 - scores.win * 0.8},100`}
                fill="#4a7c59"
                fillOpacity={radarVisible ? 0.4 : 0}
                stroke="#4a7c59"
                strokeWidth="2"
                style={{ transition: 'fill-opacity 800ms ease-out, transform 800ms ease-out', transformOrigin: '100px 100px', transform: radarVisible ? 'scale(1)' : 'scale(0)' }}
              />
            </svg>
            {/* Labels positioned around the SVG */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-center">
              <span className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Frame</span>
              <span className="text-sm font-bold text-primary">{scores.frame}</span>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 text-center">
              <span className="block text-[10px] font-bold text-secondary uppercase tracking-wider">List</span>
              <span className="text-sm font-bold text-primary">{scores.list}</span>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 text-center">
              <span className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Optimize</span>
              <span className="text-sm font-bold text-primary">{scores.optimize}</span>
            </div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 text-center">
              <span className="block text-[10px] font-bold text-secondary uppercase tracking-wider">Win</span>
              <span className="text-sm font-bold text-primary">{scores.win}</span>
            </div>
          </div>
          <div className="mt-8 bg-secondary-container text-secondary text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-tight">
            Better than {percentile}% of engineers at your stage
          </div>
        </section>

        {/* Section 3: Archetype Card */}
        <section className="bg-primary-container rounded-xl p-5 border border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Your Thinking Archetype</span>
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
          </div>
          <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">{archetype}</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {archetypeDescription}
          </p>
        </section>

        {/* Section 4: Answer Callout — only show when real feedback from API */}
        {results?.luma_observation && (
          <section className="bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="p-5 border-l-4 border-primary">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">What Luma noticed in your answer</h3>
              <blockquote className="text-on-surface-variant italic text-sm leading-relaxed mb-4">
                &ldquo;{results.luma_observation}&rdquo;
              </blockquote>
              {results.strengths && results.strengths.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {results.strengths.map((s: string) => (
                    <span key={s} className="bg-primary-fixed text-primary text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check</span>
                      {s}
                    </span>
                  ))}
                  {results.focus_area && (
                    <span className="bg-tertiary-container/30 text-tertiary text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      {results.focus_area}
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Section 5: Starting Levels */}
        <section className="grid grid-cols-2 md:flex md:flex-row gap-3">
          {startingLevels.map((item) => (
            <div
              key={item.name}
              className={`bg-white border rounded-lg p-3 flex flex-col items-center justify-center flex-1 ${
                item.highlight ? 'border-tertiary-container' : 'border-outline-variant'
              }`}
            >
              <span className={`material-symbols-outlined mb-1 ${item.highlight ? 'text-tertiary' : 'text-primary'}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-bold text-secondary uppercase mb-1">
                {item.name}
              </span>
              {item.highlight ? (
                <span className="border border-tertiary text-tertiary text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {item.level}
                </span>
              ) : (
                <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {item.level}
                </span>
              )}
            </div>
          ))}
        </section>

        {/* Section 6: CTA */}
        <section className="pt-4 space-y-4">
          <button
            onClick={handleStartChallenge}
            disabled={isCompleting}
            className="w-full bg-primary hover:brightness-110 text-on-primary font-label font-bold py-4 rounded-full transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isCompleting ? 'Setting up...' : 'Start your first challenge'}
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button
            onClick={async () => {
              setIsCompleting(true)
              try {
                await fetch('/api/onboarding/complete', { method: 'POST' })
              } catch {
                // Non-fatal
              }
              router.push('/prep')
            }}
            disabled={isCompleting}
            className="block w-full text-center text-sm font-bold text-primary hover:underline underline-offset-4 decoration-2 disabled:opacity-50"
          >
            See your personalized study plan →
          </button>
        </section>
      </main>
    </div>
  )
}
