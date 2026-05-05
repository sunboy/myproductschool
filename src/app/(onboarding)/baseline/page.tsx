import Link from 'next/link'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

const SCORES = [
  { name: 'Frame', score: 72, icon: 'diamond', color: 'text-primary' },
  { name: 'List', score: 58, icon: 'vignette', color: 'text-primary' },
  { name: 'Optimize', score: 65, icon: 'pentagon', color: 'text-primary' },
  { name: 'Win', score: 44, icon: 'circle', color: 'text-tertiary', focus: true },
]

const PROFICIENCY = [
  { name: 'Frame', level: 'L3', icon: 'pentagon' },
  { name: 'List', level: 'L2', icon: 'join_inner' },
  { name: 'Optimize', level: 'L2', icon: 'balance' },
  { name: 'Win', level: 'Focus', icon: 'trophy', highlight: true },
]

export default function BaselineResultsPage() {
  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      {/* Back + Logo */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/results"
          className="p-1.5 rounded-lg hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </Link>
        <span className="font-headline text-lg font-bold text-primary">HackProduct</span>
        <div className="flex-1" />
        <HatchGlyph size={28} className="text-primary" state="listening" />
      </div>

      {/* Heading */}
      <h1 className="font-headline text-3xl font-bold text-on-surface mb-3">
        Your Baseline Results
      </h1>

      {/* Hatch quote */}
      <div className="flex items-start gap-3 mb-8 bg-surface-container-low rounded-xl p-5">
        <HatchGlyph size={32} state="speaking" className="text-primary flex-shrink-0" />
        <p className="text-sm text-on-surface font-body">
          Based on your answer, I&apos;ve mapped your starting point across all 4 FLOW moves. Here&apos;s where you stand.
        </p>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {SCORES.map((s) => (
          <div key={s.name} className="bg-surface-container rounded-xl p-4 text-center relative">
            <span className={`material-symbols-outlined text-2xl ${s.color}`}>{s.icon}</span>
            <p className="font-headline text-3xl font-bold text-on-surface mt-1">{s.score}</p>
            <p className="text-xs font-label font-semibold text-on-surface-variant mt-0.5">{s.name}</p>
            {s.focus && (
              <span className="absolute top-2 right-2 text-[10px] font-label font-bold text-tertiary bg-tertiary-container/50 rounded-full px-2 py-0.5">
                Focus area
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Benchmark bar */}
      <div className="bg-surface-container-low rounded-xl p-4 mb-8">
        <p className="text-sm font-label font-semibold text-on-surface mb-2">
          Better than 61% of engineers at your stage
        </p>
        <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: '61%' }} />
        </div>
      </div>

      {/* Archetype */}
      <div className="bg-surface-container rounded-xl p-5 mb-6">
        <h2 className="font-headline text-lg font-bold text-on-surface mb-2">
          Your Thinking Archetype: The Systematic Builder
        </h2>
        <p className="text-sm text-on-surface-variant font-body">
          You excel at structured methodology — defining frameworks, organizing information, and building systematic approaches.
          Your gap is in stakeholder narrative: translating your solid analysis into compelling stories that drive alignment and action.
        </p>
      </div>

      {/* What Hatch noticed */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 mb-6">
        <h3 className="text-sm font-label font-bold text-on-surface mb-2 flex items-center gap-2">
          <HatchGlyph size={16} state="none" className="text-primary" />
          What Hatch noticed in your answer
        </h3>
        <p className="text-sm text-on-surface-variant font-body italic mb-3">
          &quot;You identified the structural issue quickly and used criteria-based thinking to frame your analysis.
          Your stakeholder narrative could be stronger — try leading with the business impact before diving into methodology.&quot;
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="bg-primary-fixed text-primary rounded-full px-3 py-1 text-xs font-label font-semibold">
            Criteria-based thinking
          </span>
          <span className="bg-secondary-container text-on-secondary-container rounded-full px-3 py-1 text-xs font-label font-semibold">
            Stakeholder narrative
          </span>
        </div>
      </div>

      {/* Proficiency levels */}
      <div className="grid grid-cols-4 gap-2 mb-8">
        {PROFICIENCY.map((p) => (
          <div
            key={p.name}
            className={`rounded-xl p-3 text-center ${
              p.highlight
                ? 'bg-tertiary-container/40 border border-tertiary-container'
                : 'bg-surface-container'
            }`}
          >
            <span className={`material-symbols-outlined text-lg ${p.highlight ? 'text-tertiary' : 'text-primary'}`}>
              {p.icon}
            </span>
            <p className="text-xs font-label font-bold text-on-surface mt-1">{p.name}</p>
            <p className={`text-xs font-label font-semibold ${p.highlight ? 'text-tertiary' : 'text-on-surface-variant'}`}>
              {p.level}
            </p>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="text-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-full px-8 py-3 font-label font-semibold hover:bg-primary/90 transition-colors"
        >
          Start your first challenge
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </Link>
        <p className="mt-4">
          <Link href="/dashboard" className="text-sm text-primary font-label font-semibold hover:underline">
            See your personalized study plan
          </Link>
        </p>
      </div>
    </div>
  )
}
