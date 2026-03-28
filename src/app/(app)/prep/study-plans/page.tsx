import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

const plans = [
  {
    slug: 'staff-engineer-path',
    name: 'Staff Engineer Path',
    role: 'SWE',
    roleBg: 'bg-primary-fixed',
    roleText: 'text-primary',
    accentColor: '#4a7c59',
    duration: '6 weeks',
    challenges: 30,
    description: 'Master high-level architecture and organizational impact.',
    flow: { Frame: 80, Lens: 90, Optimize: 85, Win: 75 },
  },
  {
    slug: '7-day-prep',
    name: '7-Day Prep',
    role: 'SWE/Data/ML',
    roleBg: 'bg-blue-100',
    roleText: 'text-blue-700',
    accentColor: '#3b5bdb',
    duration: '7 days',
    challenges: 12,
    description: 'Intensive refresher for upcoming product design interviews.',
    flow: { Frame: 70, Lens: 60, Optimize: 50, Win: 70 },
  },
  {
    slug: 'ai-product-fluency',
    name: 'AI Product Fluency',
    role: 'SWE/ML/Founding',
    roleBg: 'bg-amber-100',
    roleText: 'text-tertiary',
    accentColor: '#705c30',
    duration: '4 weeks',
    challenges: 20,
    description: 'Bridging the gap between model capabilities and UX.',
    flow: { Frame: 90, Lens: 85, Optimize: 95, Win: 90 },
  },
  {
    slug: 'data-eng-product',
    name: 'Data Eng -> Product',
    role: 'Data Eng',
    roleBg: 'bg-purple-100',
    roleText: 'text-purple-700',
    accentColor: '#6b21a8',
    duration: '4 weeks',
    challenges: 18,
    description: 'Leveraging data pipelines for product decisions.',
    flow: { Frame: 75, Lens: 80, Optimize: 85, Win: 65 },
  },
  {
    slug: 'pm-product-leadership',
    name: 'PM Product Leadership',
    role: 'EM',
    roleBg: 'bg-teal-100',
    roleText: 'text-teal-700',
    accentColor: '#0d9488',
    duration: '6 weeks',
    challenges: 24,
    description: 'Leading product direction as an engineering manager.',
    flow: { Frame: 85, Lens: 80, Optimize: 75, Win: 80 },
  },
  {
    slug: 'founding-engineer',
    name: 'Founding Engineer',
    role: 'Founding Eng',
    roleBg: 'bg-orange-100',
    roleText: 'text-orange-700',
    accentColor: '#c2410c',
    duration: '4 weeks',
    challenges: 16,
    description: 'Zero-to-one product thinking for early-stage engineers.',
    flow: { Frame: 70, Lens: 90, Optimize: 80, Win: 75 },
  },
  {
    slug: 'devops-product',
    name: 'DevOps -> Product',
    role: 'DevOps',
    roleBg: 'bg-sky-100',
    roleText: 'text-sky-700',
    accentColor: '#0284c7',
    duration: '3 weeks',
    challenges: 15,
    description: 'Understanding product impact of infrastructure decisions.',
    flow: { Frame: 65, Lens: 75, Optimize: 90, Win: 70 },
  },
]

const ROLE_FILTERS = ['All', 'SWE', 'Data Eng', 'ML Eng', 'DevOps', 'EM', 'Founding Eng'] as const
const DURATION_FILTERS = ['All', '1 week', '4 weeks', '6+ weeks'] as const

export default function StudyPlansPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-3 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">explore</span>
            <h1 className="text-2xl font-extrabold font-headline text-primary">Study Plans</h1>
          </div>
          <p className="text-xs text-on-surface-variant font-body mt-0.5">Structured paths to PM interview readiness</p>
        </div>
        <LumaGlyph size={40} className="text-primary flex-shrink-0" />
      </div>

      {/* Filter chips */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-on-surface-variant mr-1">Roles:</span>
          {ROLE_FILTERS.map((r, i) => (
            <button key={r} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              i === 0 ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-on-surface-variant mr-1">Duration:</span>
          {DURATION_FILTERS.map(d => (
            <button key={d} className="px-3 py-1 rounded-full text-xs font-bold bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors">
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Luma recommendation strip */}
      <div className="bg-primary-fixed rounded-xl p-3 flex items-center gap-2">
        <LumaGlyph size={20} className="text-primary flex-shrink-0" />
        <p className="text-xs text-on-surface flex-1">
          Luma&apos;s Recommendation: Based on your FLOW profile, I recommend starting with the{' '}
          <Link href="/prep/study-plans/staff-engineer-path" className="font-bold text-primary hover:underline">Staff Engineer Path</Link>.
        </p>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {plans.map((plan) => (
          <Link
            key={plan.slug}
            href={`/prep/study-plans/${plan.slug}`}
            className="card-elevated card-interactive rounded-xl overflow-hidden transition-all group"
          >
            <div className="h-1.5 w-full" style={{ backgroundColor: plan.accentColor }} />
            <div className="p-3 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-headline font-bold text-sm text-on-surface leading-tight">{plan.name}</h3>
                <span className={`${plan.roleBg} ${plan.roleText} text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                  {plan.role}
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">{plan.description}</p>
              <div className="flex items-center gap-3 text-[11px] text-on-surface-variant font-semibold">
                <span className="flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">schedule</span> {plan.duration}
                </span>
                <span className="flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">assignment</span> {plan.challenges} challenges
                </span>
              </div>
              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">monitoring</span> FLOW Analysis
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {Object.entries(plan.flow).map(([label, value]) => (
                    <div key={label} className="space-y-0.5">
                      <div className="flex justify-between text-[10px] font-bold text-on-surface-variant">
                        <span>{label}</span>
                        <span>{value}%</span>
                      </div>
                      <div className="h-1 bg-outline-variant rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: plan.accentColor }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full bg-primary text-on-primary rounded-full py-2 text-xs font-label font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1">
                Start Plan <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </div>
          </Link>
        ))}
      </div>

      {/* Luma Study Tip */}
      <div className="bg-surface-container-high border border-outline-variant rounded-xl p-3 flex items-start gap-3">
        <LumaGlyph size={28} className="text-primary flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-on-surface">Luma&apos;s Study Tip</h4>
          <p className="text-xs text-on-surface-variant font-body">
            I&apos;ve noticed your <strong>Frame</strong> scores are consistently high! Focus on <strong>Win</strong> (execution) challenges this week to balance your FLOW profile for the Staff PM track.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 pt-2 pb-2 text-[10px] text-on-surface-variant">
        <LumaGlyph size={12} className="text-primary" />
        <span>&copy; 2026 HackProduct. Practice builds intuition.</span>
      </div>
    </div>
  )
}
