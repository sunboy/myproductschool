'use client'

import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

/* ── Mock Data ───────────────────────────────────────────────── */

const isCalibrated = true

// Move-specific accent colors are not in the design system token set;
// they are used only in SVG/style attributes (not className).
const MOVE_COLORS = {
  frame:    '#5eaeff',
  lens:     '#2dd4a0',
  optimize: '#f59e0b',
  win:      '#a78bfa',
}

const moveLevels = [
  { name: 'Frame',    symbol: '◇', color: MOVE_COLORS.frame,    level: 2, progress: 68, nextLevel: 3 },
  { name: 'Lens',     symbol: '◈', color: MOVE_COLORS.lens,     level: 3, progress: 22, nextLevel: 4 },
  { name: 'Optimize', symbol: '◆', color: MOVE_COLORS.optimize, level: 1, progress: 90, nextLevel: 2 },
  { name: 'Win',      symbol: '◎', color: MOVE_COLORS.win,      level: 1, progress: 45, nextLevel: 2 },
]

const noCalMoves = [
  { name: 'Frame',    symbol: '◇', color: MOVE_COLORS.frame,    icon: 'crop_free' },
  { name: 'Lens',     symbol: '◈', color: MOVE_COLORS.lens,     icon: 'grid_view', filled: true },
  { name: 'Optimize', symbol: '◆', color: MOVE_COLORS.optimize, icon: 'balance',   filled: true },
  { name: 'Win',      symbol: '◎', color: MOVE_COLORS.win,      icon: 'campaign' },
]

/* ── Returning User Dashboard ────────────────────────────────── */

function ReturningDashboard() {
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-3 animate-fade-in-up">

      {/* 1. Luma Greeting */}
      <section className="flex items-center gap-3 glass-card rounded-xl px-3 py-2.5">
        <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-lg shrink-0">
          <LumaGlyph size={18} className="text-primary animate-luma-glow" animated />
        </div>
        <p className="text-sm font-medium text-on-surface">
          Good morning! Your <span className="font-bold text-primary">Frame</span> skills jumped last session. Try a Quick Take to keep the momentum.
        </p>
        <span className="ml-auto text-lg shrink-0">👋</span>
      </section>

      {/* 2. Bento Grid — Quick Take + Next Challenge */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Quick Take */}
        <div className="card-elevated p-4 flex flex-col relative overflow-hidden">
          {/* Move badge */}
          <div
            className="absolute top-3 right-3 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide font-label"
            style={{ background: `linear-gradient(135deg, #4a8fd4, ${MOVE_COLORS.frame})` }}
          >
            Frame ◇
          </div>
          <div className="mb-2">
            <h2 className="text-base font-bold flex items-center gap-1.5 text-on-surface font-label">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              Quick Take
            </h2>
            <p className="text-xs text-on-surface-variant font-label">90 seconds · one move · real feedback</p>
          </div>
          <p className="text-sm font-semibold text-on-surface leading-snug mb-2.5 font-body">
            &ldquo;Your app&apos;s DAU is up 20% but revenue is flat. What&apos;s the first question you ask?&rdquo;
          </p>
          <textarea
            className="w-full bg-surface-container-low rounded-lg p-2.5 text-sm focus:ring-2 ring-primary/30 placeholder:text-on-surface-variant/40 resize-none font-body border border-outline-variant/30 focus:border-primary/40 transition-colors outline-none"
            placeholder="Write your thinking..."
            rows={3}
          />
          <button className="mt-2.5 bg-primary text-on-primary rounded-full px-5 py-2 text-sm font-bold font-label hover:brightness-110 active:scale-95 transition-all self-start shadow-sm glow-primary">
            Grade in 15s ⚡
          </button>
        </div>

        {/* Your Next Challenge */}
        <div className="card-elevated p-4 flex flex-col card-interactive cursor-pointer">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 font-label">
            Your Next Challenge
          </h2>
          <h3 className="text-lg font-headline font-bold text-on-surface leading-tight mb-2">
            Model Accuracy Up, Engagement Down
          </h3>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span
              className="badge-move"
              style={{ backgroundColor: `${MOVE_COLORS.frame}22`, color: MOVE_COLORS.frame }}
            >
              AI-Assisted
            </span>
            <span className="badge-move bg-error-container text-on-error-container">Hard</span>
          </div>
          <div className="flex gap-1.5 mb-2.5">
            {['ML Eng', 'SWE', 'Data Eng'].map(r => (
              <span key={r} className="text-[9px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full border border-outline-variant/40 font-label">{r}</span>
            ))}
          </div>
          <p className="text-xs italic text-on-surface-variant mb-3 flex-1 font-body">
            &ldquo;Your Communication is 2.8 — this challenge targets that dimension&rdquo;
          </p>
          <div className="flex items-center gap-2">
            <Link
              href="/challenges"
              className="flex-1 bg-primary text-on-primary rounded-full py-2 text-sm font-bold font-label flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-sm"
            >
              Start Challenge
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
            <button className="w-9 h-9 flex items-center justify-center border border-outline-variant rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-base">refresh</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Move Levels */}
      <section className="card-elevated p-4">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 font-label">Your Move Levels</h2>
        <div className="space-y-2.5">
          {moveLevels.map((m) => (
            <div key={m.name} className="space-y-1">
              <div className="flex justify-between items-center text-[11px] font-bold font-label">
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ color: m.color }}>{m.name} {m.symbol}</span>
                  <span className="text-on-surface-variant font-normal">Lv {m.level}</span>
                </div>
                <span className="text-on-surface-variant">{m.progress}% → Lv {m.nextLevel}</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ backgroundColor: m.color, width: `${m.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

/* ── No-Calibration State ────────────────────────────────────── */

function NoCalibrationDashboard() {
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-3">

      {/* Calibration Hero */}
      <section className="relative overflow-hidden bg-primary-fixed/40 rounded-xl p-6 flex items-center justify-between gap-6">
        <div className="z-10 max-w-xl">
          <h1 className="text-2xl font-headline font-bold text-on-surface mb-2">
            Discover your product thinking level
          </h1>
          <p className="text-on-surface/80 text-sm mb-4 leading-relaxed font-body">
            Take a 10-minute calibration challenge. Luma will assess your baseline across all 4 thinking moves and assign your starting level.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/onboarding/welcome"
              className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold font-label text-sm hover:brightness-110 transition-all flex items-center gap-2"
            >
              Start Calibration
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
            <button className="text-on-surface font-bold text-sm hover:underline font-label">
              Skip for now
            </button>
          </div>
        </div>
        <div className="relative flex items-center justify-center w-32 h-32 shrink-0">
          <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
          <div className="absolute w-24 h-24 border-2 border-primary/30 rounded-full" />
          <div className="absolute w-16 h-16 border border-primary/50 rounded-full" />
          <div className="w-14 h-14 bg-primary rounded-xl rotate-45 flex items-center justify-center shadow-lg">
            <LumaGlyph size={28} className="text-on-primary -rotate-45" />
          </div>
        </div>
      </section>

      {/* Move Levels — Locked */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-on-surface font-label">Your Thinking Moves</h2>
            <span className="material-symbols-outlined text-outline text-sm">lock</span>
          </div>
          <span className="text-[10px] font-semibold text-on-surface-variant bg-surface-container px-2.5 py-0.5 rounded-full font-label">
            Complete calibration to unlock
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {noCalMoves.map((m) => (
            <div
              key={m.name}
              className="bg-surface-container rounded-xl p-4 relative opacity-50 grayscale-[0.5] border border-outline-variant/30"
            >
              <span className="material-symbols-outlined absolute top-3 right-3 text-outline text-sm">lock</span>
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
                style={{ backgroundColor: `${m.color}33`, color: m.color }}
              >
                <span className="material-symbols-outlined text-xl" style={m.filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {m.icon}
                </span>
              </div>
              <h3 className="font-headline font-bold text-base mb-1 text-on-surface">
                {m.name} <span style={{ color: m.color }}>{m.symbol}</span>
              </h3>
              <div className="w-full bg-outline-variant h-1 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      {/* Benefits row */}
      <section className="grid grid-cols-3 gap-3 pt-2 border-t border-outline-variant">
        {[
          { icon: 'psychology', title: '4 thinking moves', desc: 'Frame, Lens, Optimize, Win' },
          { icon: 'timer', title: '~10 minutes', desc: 'Scenario-based exercise' },
          { icon: 'grade', title: 'Staff benchmarks', desc: 'Junior → Senior → Staff' },
        ].map((b) => (
          <div key={b.title} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-sm">{b.icon}</span>
            </div>
            <div>
              <h4 className="font-bold text-xs text-on-surface font-label">{b.title}</h4>
              <p className="text-[10px] text-on-surface-variant font-body">{b.desc}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="flex justify-center pb-2">
        <Link href="/challenges" className="text-primary font-bold text-xs flex items-center gap-1 hover:opacity-80 font-label">
          Browse challenges without calibration
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>

      {/* Luma Tip */}
      <div className="fixed bottom-6 right-6 max-w-xs bg-surface rounded-xl shadow-xl p-3 border border-outline-variant flex gap-3 items-start z-50">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <LumaGlyph size={16} className="text-on-primary" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5 font-label">Luma&apos;s Tip</p>
          <p className="text-xs text-on-surface leading-snug font-body">
            &ldquo;Calibration helps me pick the perfect challenges for your skill level!&rdquo;
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function DashboardPage() {
  return isCalibrated ? <ReturningDashboard /> : <NoCalibrationDashboard />
}
