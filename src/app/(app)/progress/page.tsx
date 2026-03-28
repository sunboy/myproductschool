import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

/* ---------- radial progress ---------- */
function RadialProgress({ progress, size = 80, strokeColor = '#4a7c59' }: { progress: number; size?: number; strokeColor?: string }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const dash = (progress / 100) * circ
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={6} stroke="#eae6de" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={6}
          stroke={strokeColor} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-headline font-bold text-on-surface">{progress}%</span>
      </div>
    </div>
  )
}

/* ---------- mock data ---------- */
const flowMoves = [
  { name: 'Frame', level: 3, pct: 45, icon: 'navigation', color: '#4a7c59' },
  { name: 'Split', level: 3, pct: 78, icon: 'grid_view', color: '#4a7c59' },
  { name: 'Weigh', level: 2, pct: 30, icon: 'balance', color: '#705c30' },
  { name: 'Sell', level: 1, pct: 60, icon: 'campaign', color: '#b83230' },
]

type MasterySquare = 'unplayed' | 'low' | 'medium' | 'mastered'
const masteryGrid: MasterySquare[] = [
  'unplayed','unplayed','unplayed','unplayed','unplayed',
  'low','low','medium','medium','medium',
  'mastered','mastered','mastered','unplayed','unplayed',
  'unplayed','unplayed','unplayed','unplayed','unplayed',
]

const recentPatterns = [
  { challenge: 'Uber Fleet Challenge', pattern: 'Composition Effect', date: 'Oct 12' },
  { challenge: 'Stripe Payouts', pattern: 'Second-Order Thinking', date: 'Oct 08' },
  { challenge: 'Netflix Ads Tier', pattern: 'Sunk Cost Fallacy', date: 'Oct 05' },
]

/* ---------- helpers ---------- */
function squareColor(s: MasterySquare) {
  switch (s) {
    case 'unplayed': return 'bg-surface-container-highest'
    case 'low': return 'bg-tertiary-container'
    case 'medium': return 'bg-primary-container'
    case 'mastered': return 'bg-primary'
  }
}

export default function ProgressPage() {
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-3 animate-fade-in-up">

      {/* ── Page Title ── */}
      <section>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="material-symbols-outlined text-primary text-2xl">analytics</span>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Progress &amp; Analytics</h1>
        </div>
        <p className="text-xs font-body text-on-surface-variant">Your journey to engineering product mastery</p>
      </section>

      {/* ── Section 1: Thinking Archetype ── */}
      <section className="glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center relative overflow-hidden">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-tertiary text-lg">diamond</span>
            <p className="text-xs font-label text-on-surface-variant">Thinking Archetype</p>
          </div>
          <h2 className="text-xl font-headline font-bold text-on-surface mb-1">The Analyst</h2>
          <p className="text-xs font-body text-on-surface-variant leading-relaxed mb-2">
            Strong at breaking down problems (Frame + Split), developing your communication muscle (Sell).
          </p>
          <button className="bg-primary text-on-primary rounded-lg px-4 py-2 text-xs font-label font-semibold inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">share</span>
            Share Archetype
          </button>
        </div>
        <div className="shrink-0 opacity-30">
          <LumaGlyph size={100} className="text-primary" />
        </div>
      </section>

      {/* ── Section 2: FLOW Move Levels (Radial Progress) ── */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary text-lg">navigation</span>
          <h2 className="text-base font-headline font-bold text-on-surface">Move Levels</h2>
          <span className="text-xs font-body text-on-surface-variant ml-1">4 core competencies</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {flowMoves.map((m) => (
            <div key={m.name} className="card-elevated rounded-2xl p-4 flex flex-col items-start gap-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg" style={{ color: m.color }}>{m.icon}</span>
                <span className="text-xs font-label text-on-surface-variant">Level {m.level}</span>
              </div>
              <h3 className="text-sm font-headline font-bold text-on-surface">{m.name}</h3>
              <RadialProgress progress={m.pct} strokeColor={m.color} />
            </div>
          ))}
        </div>
        <Link href="/progress/skill-ladder" className="inline-flex items-center gap-1 mt-2 text-xs font-label font-semibold text-primary hover:underline">
          View Skill Ladder <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </section>

      {/* ── Section 3: Challenge Mastery Map ── */}
      <section>
        <h2 className="text-base font-headline font-bold text-on-surface mb-0.5">Challenge Mastery Map</h2>
        <p className="text-xs font-body text-on-surface-variant mb-2">10 of 20 challenges attempted · 3 mastered</p>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-2 flex-wrap">
          {([
            ['bg-surface-container-highest', 'Unplayed'],
            ['bg-tertiary-container', '<3 Score'],
            ['bg-primary-container', '3–4 Score'],
            ['bg-primary', '4+ Mastered'],
          ] as const).map(([color, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded-sm ${color}`} />
              <span className="text-xs font-label text-on-surface-variant">{label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-2 max-w-xs">
          {masteryGrid.map((sq, i) => (
            <div key={i} className={`aspect-square rounded-md ${squareColor(sq)} cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center`}>
              {sq === 'mastered' && (
                <span className="material-symbols-outlined text-on-primary text-sm">check</span>
              )}
            </div>
          ))}
        </div>

        <Link href="/challenges" className="inline-flex items-center gap-1 mt-2 text-xs font-label font-semibold text-primary hover:underline">
          View all challenges <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </section>

      {/* ── Section 4: Recent Thinking Patterns ── */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-headline font-bold text-on-surface">Recent Thinking Patterns</h2>
          <Link href="/progress" className="text-xs font-label font-semibold text-primary hover:underline">
            View all 8 patterns →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {recentPatterns.map((p) => (
            <div key={p.pattern} className="card-elevated rounded-xl p-4 group">
              <h3 className="text-sm font-headline font-bold text-on-surface mb-0.5">{p.pattern}</h3>
              <p className="text-xs font-label text-on-surface-variant mb-2">Source: {p.challenge} · {p.date}</p>
              <button className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-lg">open_in_new</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Export ── */}
      <button className="bg-surface-container-low border border-outline-variant text-on-surface-variant rounded-lg px-4 py-2 text-xs font-label font-semibold inline-flex items-center gap-1.5 hover:bg-surface-container transition-colors">
        <span className="material-symbols-outlined text-sm">file_download</span>
        Export as PDF
      </button>

      {/* ── Section 5: Before/After — Frame Move ── */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">trending_up</span>
            <h2 className="text-base font-headline font-bold text-on-surface">Your Growth — Frame Move</h2>
          </div>
          <p className="text-xs font-body text-on-surface-variant hidden md:block">How your thinking evolved</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Day 1 Response */}
          <div className="card-elevated rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-headline font-bold text-on-surface">Day 1 Response</h3>
              <span className="bg-tertiary-container text-on-surface rounded-full px-2.5 py-0.5 text-xs font-label font-semibold">Score 2.5</span>
            </div>
            <p className="text-xs font-body text-on-surface leading-relaxed italic">
              &ldquo;The main goal is to increase revenue by 10%. We should look at user acquisition and retention metrics to see where we can improve the funnel.&rdquo;
            </p>
          </div>
          {/* Today's Response */}
          <div className="card-elevated rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-headline font-bold text-on-surface">Today&apos;s Response</h3>
              <span className="bg-primary text-on-primary rounded-full px-2.5 py-0.5 text-xs font-label font-semibold">Score 4.2</span>
            </div>
            <p className="text-xs font-body text-on-surface leading-relaxed italic">
              &ldquo;To frame this problem, we must first isolate the strategic intent: is this a defensibility play or pure growth? By splitting the ecosystem into supply-side liquidity and demand-side friction…&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 6: HackProduct Certification ── */}
      <section className="card-elevated rounded-2xl p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          <div>
            {/* Lock banner */}
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-xl">lock</span>
              <h3 className="text-sm font-headline font-bold text-on-surface uppercase tracking-wide">Locked: Reach Level 3 in All Moves</h3>
            </div>

            <div className="flex items-center gap-2 mb-0.5">
              <span className="material-symbols-outlined text-primary text-xl">verified</span>
              <h2 className="text-lg font-headline font-bold text-on-surface">HackProduct Certified</h2>
            </div>
            <span className="inline-block text-xs font-label text-on-surface-variant mb-3">Industry Ready</span>

            {/* Requirements */}
            <div className="bg-white/60 rounded-xl p-4 space-y-3 mb-3">
              <div>
                <p className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wide mb-0.5">Challenge Quota</p>
                <p className="text-sm font-headline font-bold text-on-surface">12 / 20 challenges</p>
                <div className="w-full h-1.5 rounded-full bg-surface-container-highest mt-1">
                  <div className="h-1.5 rounded-full bg-primary" style={{ width: '60%' }} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wide mb-0.5">Dimension Mastery</p>
                <p className="text-sm font-headline font-bold text-on-surface">3 / 5 dimensions (Lvl 2+)</p>
                <div className="w-full h-1.5 rounded-full bg-surface-container-highest mt-1">
                  <div className="h-1.5 rounded-full bg-primary-container" style={{ width: '60%' }} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wide mb-0.5">Capstone</p>
                <p className="text-sm font-headline font-bold text-error">Locked</p>
              </div>
            </div>

            {/* Overall progress */}
            <div className="bg-surface-container-highest rounded-lg p-3 text-center">
              <p className="text-xs font-label text-on-surface-variant">Overall Certification Progress</p>
              <p className="text-xl font-headline font-bold text-on-surface">42%</p>
            </div>
          </div>

          {/* Luma decorative */}
          <div className="flex items-center justify-center">
            <LumaGlyph size={140} className="text-primary opacity-40" />
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <div className="text-center pt-2 pb-2">
        <p className="text-sm font-headline text-primary italic">Keep thinking. Keep building.</p>
      </div>
    </div>
  )
}
