'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { useMoveLevels } from '@/hooks/useMoveLevels'

/* ---------- mock data ---------- */
const FLOW_MOVES_MOCK = [
  { name: 'Frame', level: 3, pct: 45, icon: 'navigation', color: '#5eaeff' },
  { name: 'List',  level: 3, pct: 78, icon: 'grid_view', color: '#2dd4a0', fill: true },
  { name: 'Optimize', level: 2, pct: 30, icon: 'balance', color: '#f59e0b', fill: true },
  { name: 'Win',  level: 1, pct: 60, icon: 'campaign', color: '#a78bfa', fill: true },
]

const MOVE_ICONS: Record<string, string> = {
  frame: 'navigation', list: 'grid_view', optimize: 'balance', win: 'campaign',
}
const MOVE_COLORS: Record<string, string> = {
  frame: '#5eaeff', list: '#2dd4a0', optimize: '#f59e0b', win: '#a78bfa',
}

const masteryGrid = [
  'mastered','mastered','mastered','mid','mid',
  'low','low','mid','mid','mid',
  'unplayed','unplayed','unplayed','unplayed','unplayed',
  'unplayed','unplayed','unplayed','unplayed','unplayed',
] as const

const recentPatterns = [
  { challenge: 'Uber Fleet Challenge', pattern: 'Composition Effect', date: 'Oct 12' },
  { challenge: 'Stripe Payouts', pattern: 'Second-Order Thinking', date: 'Oct 08' },
  { challenge: 'Netflix Ads Tier', pattern: 'Sunk Cost Fallacy', date: 'Oct 05' },
]

function squareColor(s: typeof masteryGrid[number]) {
  switch (s) {
    case 'unplayed': return 'bg-surface-container-highest'
    case 'low': return 'bg-error'
    case 'mid': return 'bg-tertiary-container'
    case 'mastered': return 'bg-primary'
  }
}

export default function ProgressPage() {
  const router = useRouter()
  const { moves } = useMoveLevels()

  const flowMoves = moves.length > 0
    ? moves.map(m => ({
        name: m.move.charAt(0).toUpperCase() + m.move.slice(1),
        level: m.level,
        pct: m.progress_pct,
        icon: MOVE_ICONS[m.move] ?? 'circle',
        color: MOVE_COLORS[m.move] ?? '#4a7c59',
        fill: m.move !== 'frame',
      }))
    : FLOW_MOVES_MOCK

  return (
    <div className="max-w-7xl mx-auto p-6 w-full flex flex-col gap-6 animate-fade-in-up">

      {/* ── Page Header ── */}
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-3xl text-primary">analytics</span>
        <div>
          <h1 className="text-2xl font-headline font-extrabold tracking-tight">Progress &amp; Analytics</h1>
          <p className="text-sm text-on-surface-variant">Your journey to engineering product mastery</p>
        </div>
      </div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-12 gap-5">

        {/* Archetype Card */}
        <section className="col-span-12 lg:col-span-7 bg-[#e8def8] rounded-xl p-5 flex items-center justify-between shadow-sm border border-[#d1c4e9]">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#6750a4]">Thinking Archetype</span>
            </div>
            <h2 className="text-3xl font-headline font-bold text-on-surface">The Analyst</h2>
            <p className="text-sm text-on-surface-variant mt-2 max-w-md">
              Strong at breaking down problems (<span className="font-bold text-primary">Frame + List</span>), developing your communication muscle (<span className="font-bold text-tertiary">Win</span>).
            </p>
            <button
              onClick={() => router.push('/profile/share')}
              className="mt-4 flex items-center gap-2 bg-[#6750a4] text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-[#5a4591] transition-colors"
            >
              <span className="material-symbols-outlined text-sm">share</span>
              Share Archetype
            </button>
          </div>
          <div className="hidden sm:block">
            <LumaGlyph size={128} state="celebrating" className="text-primary opacity-90" />
          </div>
        </section>

        {/* Move Levels */}
        <section className="col-span-12 lg:col-span-5 bg-surface-container rounded-xl p-5 border border-outline-variant/30">
          <h3 className="text-sm font-bold mb-4 flex items-center justify-between">
            Move Levels
            <span className="text-xs font-normal text-on-surface-variant">4 core competencies</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flowMoves.map((m) => (
              <div key={m.name} className="bg-white p-3 rounded-lg border border-outline-variant/20">
                <div className="flex justify-between items-start mb-2">
                  <span
                    className="material-symbols-outlined"
                    style={{ color: m.color, fontVariationSettings: m.fill ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {m.icon}
                  </span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={{ backgroundColor: `${m.color}15`, color: m.color }}
                  >
                    Level {m.level}
                  </span>
                </div>
                <div className="text-xs font-bold mb-1">{m.name}</div>
                <div className="w-full bg-surface-container-highest h-1.5 rounded-full">
                  <div className="h-1.5 rounded-full" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
                </div>
                <div className="text-right text-[10px] mt-1 text-on-surface-variant">{m.pct}%</div>
              </div>
            ))}
          </div>
        </section>

        {/* Mastery Map */}
        <section className="col-span-12 md:col-span-6 bg-surface-container rounded-xl p-5 border border-outline-variant/30">
          <h3 className="text-sm font-bold mb-1">Challenge Mastery Map</h3>
          <p className="text-[11px] text-on-surface-variant mb-4">10 of 20 challenges attempted • 3 mastered</p>
          <div className="grid grid-cols-5 gap-3 mb-6">
            {masteryGrid.map((sq, i) => (
              <div key={i} className={`w-6 h-6 rounded shadow-sm ${squareColor(sq)}`} />
            ))}
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold text-on-surface-variant pt-2 border-t border-outline-variant/20">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-surface-container-highest" /> Unplayed</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-error" /> &lt;3 Score</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-tertiary-container" /> 3-4 Score</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-primary" /> 4+ Mastered</div>
          </div>
        </section>

        {/* Recent Thinking Patterns */}
        <section className="col-span-12 md:col-span-6 bg-surface-container rounded-xl p-5 border border-outline-variant/30">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold">Recent Thinking Patterns</h3>
            <Link href="/progress" className="text-[10px] font-bold text-primary hover:underline">View all 8 patterns →</Link>
          </div>
          <div className="flex flex-col gap-3">
            {recentPatterns.map((p) => (
              <div key={p.pattern} className="bg-white/60 p-3 rounded-lg border border-outline-variant/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold">{p.pattern}</div>
                  <div className="text-[10px] text-on-surface-variant">Source: {p.challenge} • {p.date}</div>
                </div>
                <span className="material-symbols-outlined text-xs text-on-surface-variant">open_in_new</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => window.print()}
            className="w-full mt-4 py-2 border border-primary/30 rounded-full text-[11px] font-bold text-primary hover:bg-primary/5 transition-colors"
          >
            Export as PDF
          </button>
        </section>

        {/* Your Growth — Frame Move */}
        <section className="col-span-12 bg-surface-container rounded-xl overflow-hidden border border-outline-variant/30">
          <button className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-container-high transition-colors">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">trending_up</span>
              <div>
                <h3 className="text-sm font-bold">Your Growth — Frame Move</h3>
                <p className="text-[11px] text-on-surface-variant">See how your thinking has evolved over time</p>
              </div>
            </div>
            <span className="material-symbols-outlined">expand_more</span>
          </button>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-outline-variant/20 bg-white/40">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">Day 1 Response</span>
                <span className="bg-surface-container-highest text-on-surface px-2 py-0.5 rounded text-[10px] font-bold">Score 2.5</span>
              </div>
              <p className="text-xs italic text-on-surface-variant bg-surface-container-low p-3 rounded-lg border border-outline-variant/10 leading-relaxed">
                &ldquo;The main goal is to increase revenue by 10%. We should look at user acquisition and retention metrics to see where we can improve the funnel.&rdquo;
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wide text-primary">Today&apos;s Response</span>
                <span className="bg-primary-fixed text-primary px-2 py-0.5 rounded text-[10px] font-bold">Score 4.2</span>
              </div>
              <p className="text-xs text-on-surface bg-primary/5 p-3 rounded-lg border border-primary/20 leading-relaxed">
                &ldquo;To frame this problem, we must first isolate the strategic intent: is this a defensibility play or pure growth? By splitting the ecosystem into supply-side liquidity and demand-side friction, we can identify that revenue is a trailing indicator of trust...&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* Certification Path */}
        <section className="col-span-12 bg-surface-container-highest/50 rounded-xl p-6 border-2 border-dashed border-outline-variant relative overflow-hidden">
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="bg-on-surface text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-xl">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              <span className="text-xs font-bold">LOCKED: REACH LEVEL 3 IN ALL MOVES</span>
            </div>
          </div>
          <div className="opacity-50 flex flex-col md:flex-row items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-24 h-24 rounded-full border-4 border-primary/20 flex items-center justify-center bg-white shadow-inner">
                <span className="material-symbols-outlined text-5xl text-primary/40">verified</span>
              </div>
              <div className="text-center">
                <h3 className="font-headline font-bold text-lg">HackProduct Certified</h3>
                <p className="text-[10px] font-bold uppercase text-on-surface-variant">Industry Ready</p>
              </div>
            </div>
            <div className="flex-1 w-full flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/40 p-3 rounded-lg border border-outline-variant/20">
                  <div className="text-[10px] font-bold text-on-surface-variant mb-1">CHALLENGE QUOTA</div>
                  <div className="text-sm font-bold">12 / 20 challenges</div>
                  <div className="w-full h-1 bg-surface-container-highest mt-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: '60%' }} />
                  </div>
                </div>
                <div className="bg-white/40 p-3 rounded-lg border border-outline-variant/20">
                  <div className="text-[10px] font-bold text-on-surface-variant mb-1">DIMENSION MASTERY</div>
                  <div className="text-sm font-bold">3 / 5 dimensions (Lvl 2+)</div>
                  <div className="w-full h-1 bg-surface-container-highest mt-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: '60%' }} />
                  </div>
                </div>
                <div className="bg-white/40 p-3 rounded-lg border border-outline-variant/20">
                  <div className="text-[10px] font-bold text-on-surface-variant mb-1">CAPSTONE</div>
                  <div className="text-sm font-bold">Locked</div>
                  <div className="w-full h-1 bg-surface-container-highest mt-2 rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 mt-2">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span>Overall Certification Progress</span>
                    <span>42%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: '42%' }} />
                  </div>
                </div>
                <LumaGlyph size={48} state="none" className="text-primary grayscale" />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer className="py-8 text-center border-t border-outline-variant/20 mt-4">
        <p className="text-[10px] text-on-surface-variant font-medium tracking-widest uppercase">Keep thinking. Keep building.</p>
      </footer>
    </div>
  )
}
