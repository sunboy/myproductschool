import { getDomainBySlug } from '@/lib/data/domains'
import { getChallenges } from '@/lib/data/challenges'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

type FlowMove = 'Frame' | 'Lens' | 'Optimize' | 'Win'

const FLOW_MOVES: { label: FlowMove; symbol: string; icon: string }[] = [
  { label: 'Frame',    symbol: '◇', icon: 'crop_square' },
  { label: 'Lens',     symbol: '◈', icon: 'lens_blur' },
  { label: 'Optimize', symbol: '◆', icon: 'auto_awesome' },
  { label: 'Win',      symbol: '◎', icon: 'stars' },
]

// Token classes per FLOW move — no raw hex
const MOVE_STYLES: Record<FlowMove, {
  borderLeft: string
  iconBg: string
  iconText: string
  labelText: string
  arrowHover: string
  barBg: string
}> = {
  Frame:    { borderLeft: 'border-l-flow-frame',    iconBg: 'bg-flow-frame/10',    iconText: 'text-flow-frame',    labelText: 'text-flow-frame',    arrowHover: 'group-hover:text-flow-frame',    barBg: 'bg-flow-frame' },
  Lens:     { borderLeft: 'border-l-flow-lens',     iconBg: 'bg-flow-lens/10',     iconText: 'text-flow-lens',     labelText: 'text-flow-lens',     arrowHover: 'group-hover:text-flow-lens',     barBg: 'bg-flow-lens' },
  Optimize: { borderLeft: 'border-l-flow-optimize', iconBg: 'bg-flow-optimize/10', iconText: 'text-flow-optimize', labelText: 'text-flow-optimize', arrowHover: 'group-hover:text-flow-optimize', barBg: 'bg-flow-optimize' },
  Win:      { borderLeft: 'border-l-flow-win',      iconBg: 'bg-flow-win/10',      iconText: 'text-flow-win',      labelText: 'text-flow-win',      arrowHover: 'group-hover:text-flow-win',      barBg: 'bg-flow-win' },
}

// Static FLOW move scores (per-topic training overview)
const FLOW_SCORES: Record<FlowMove, number> = {
  Frame:    40,
  Lens:     85,
  Optimize: 60,
  Win:      20,
}

const PRIMARY_MOVE: FlowMove = 'Lens'

// Role badge labels for challenges
const ROLE_LABELS = ['PM', 'Senior PM', 'Engineer→PM', 'Staff PM']

// Difficulty display helpers
function difficultyLabel(d: string) {
  if (d === 'beginner') return 'Easy'
  if (d === 'intermediate') return 'Medium'
  return 'Hard'
}
function difficultyTextClass(d: string) {
  if (d === 'beginner') return 'text-flow-lens'
  if (d === 'intermediate') return 'text-flow-optimize'
  return 'text-error'
}

// Related topics (static representative list)
const RELATED_TOPICS = [
  { icon: 'groups',    title: 'Cohort Analysis',      desc: 'Compare user groups over time.' },
  { icon: 'experiment', title: 'A/B Testing',          desc: 'Validate changes with data.' },
  { icon: 'north',     title: 'North Star Metrics',   desc: 'Define your core value metric.' },
  { icon: 'insights',  title: 'Retention Modeling',   desc: 'Predict and prevent churn.' },
]

export default async function DomainDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const domain = await getDomainBySlug(slug)
  if (!domain) notFound()

  const challenges = await getChallenges({ domainId: domain.id })

  return (
    <div className="mt-12 p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Breadcrumb ─────────────────────────────────────────── */}
      <nav className="flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant font-body uppercase tracking-wider">
        <Link href="/explore" className="hover:text-primary transition-colors">Explore</Link>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <Link href="/explore" className="hover:text-primary transition-colors">Metrics &amp; Data</Link>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <span className="text-on-surface">{domain.title}</span>
      </nav>

      {/* ── Topic Header Card ──────────────────────────────────── */}
      <section className="bg-surface-container rounded-xl p-5 border border-outline-variant flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1 space-y-3">
          {/* Title + paradigm/category chips */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary font-headline">{domain.title}</h1>
            <div className="flex gap-2">
              <span className="bg-surface-container-highest text-on-surface text-[10px] px-2 py-0.5 rounded-full font-bold">
                Traditional
              </span>
              <span className="bg-primary-fixed text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                Metrics &amp; Data
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">
            {domain.description ?? 'Understand where users drop off and diagnose the root cause. A core PM diagnostic skill essential for product optimization and growth engineering.'}
          </p>

          {/* Role badges */}
          <div className="flex items-center gap-4 pt-2">
            <span className="text-xs font-bold text-secondary">Most relevant for:</span>
            <div className="flex gap-2">
              <span className="bg-surface border border-outline-variant text-[10px] px-2 py-0.5 rounded">PM</span>
              <span className="bg-surface border border-outline-variant text-[10px] px-2 py-0.5 rounded">Senior PM</span>
              <span className="bg-surface border border-outline-variant text-[10px] px-2 py-0.5 rounded">Engineer→PM</span>
            </div>
          </div>
        </div>

        {/* Decorative image slot */}
        <div className="hidden lg:flex w-48 h-32 bg-white/40 rounded-lg border border-dashed border-outline-variant items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-outline-variant text-5xl">filter_frames</span>
        </div>
      </section>

      {/* ── Bento: FLOW Training + Luma Tip ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* FLOW Move Training — col-span-2 */}
        <div className="lg:col-span-2 bg-surface-container-low rounded-xl p-5 border border-outline-variant">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-on-surface font-body">FLOW Move Training</h3>
            <span className="text-[10px] font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded-full">
              CORE LENS TOPIC
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FLOW_MOVES.map(({ label, symbol }) => {
              const score = FLOW_SCORES[label]
              const isPrimary = label === PRIMARY_MOVE
              const styles = MOVE_STYLES[label]

              return (
                <div
                  key={label}
                  className={`space-y-2 relative ${isPrimary ? 'bg-white/50 p-2 -m-2 rounded-lg border border-flow-lens/30' : ''}`}
                >
                  <div className="flex justify-between items-center px-1">
                    <span className={`text-[10px] font-bold ${isPrimary ? styles.labelText : 'text-secondary'}`}>
                      {label} {symbol}
                    </span>
                    <span className={`text-xs font-extrabold ${styles.labelText}`}>{score}%</span>
                  </div>
                  <div className={`${isPrimary ? 'h-2' : 'h-1.5'} bg-white rounded-full overflow-hidden`}>
                    <div
                      className={`h-full ${styles.barBg} rounded-full`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  {isPrimary && (
                    <div className="absolute -top-2 -right-1 bg-flow-lens text-white text-[8px] px-1 rounded-sm font-bold uppercase tracking-tighter">
                      Primary
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <p className="mt-4 text-[11px] text-on-surface-variant italic border-t border-outline-variant pt-2">
            Note: This topic primarily trains the{' '}
            <span className="text-flow-lens font-bold italic">Lens ◈</span>{' '}
            move, focusing on diagnostic precision.
          </p>
        </div>

        {/* Luma Tip Card — col-span-1 */}
        <div className="bg-surface-container rounded-xl p-5 border border-outline-variant relative overflow-hidden flex flex-col justify-center">
          <div className="flex gap-4 items-center">
            <LumaGlyph size={64} state="speaking" className="flex-shrink-0" />
            <div className="bg-surface rounded-lg p-3 relative text-sm text-on-surface border border-outline-variant shadow-sm">
              {/* Speech bubble tail */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-surface border-l border-b border-outline-variant rotate-45" />
              <p className="relative z-10 leading-tight text-xs">
                Lens is your weakest move — {domain.title} is one of the best topics to sharpen it. Start with challenge #1.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Active Challenges ───────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <h2 className="text-xl font-bold text-primary font-headline">Active Challenges</h2>
          <span className="text-xs font-bold text-secondary">{challenges.length} Tasks available</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {challenges.map((challenge, idx) => {
            const move = FLOW_MOVES[idx % FLOW_MOVES.length]
            const styles = MOVE_STYLES[move.label]
            const role = ROLE_LABELS[idx % ROLE_LABELS.length]
            const diff = difficultyLabel(challenge.difficulty)
            const diffClass = difficultyTextClass(challenge.difficulty)
            const hasScore = challenge.best_score !== null

            return (
              <Link
                key={challenge.id}
                href={`/challenges/${challenge.id}`}
                className={`group bg-surface rounded-xl border-l-4 ${styles.borderLeft} border border-outline-variant p-4 flex items-center justify-between hover:bg-surface-container-high transition-colors cursor-pointer`}
              >
                <div className="flex items-center gap-4">
                  {/* Move icon */}
                  <div className={`w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center ${styles.iconText} flex-shrink-0`}>
                    <span className="material-symbols-outlined">{move.icon}</span>
                  </div>

                  {/* Title + meta */}
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">{challenge.title}</h4>
                    <div className="flex gap-3 mt-1">
                      <span className={`text-[10px] font-bold uppercase ${styles.labelText}`}>{move.label}</span>
                      <span className="text-[10px] font-bold text-secondary uppercase">• {role}</span>
                      <span className={`text-[10px] font-bold uppercase ${diffClass}`}>• {diff}</span>
                    </div>
                  </div>
                </div>

                {/* Score or Incomplete + arrow */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    {hasScore ? (
                      <>
                        <div className="text-[10px] font-bold text-primary">Your best</div>
                        <div className="text-sm font-black text-primary">{challenge.best_score}/100</div>
                      </>
                    ) : (
                      <div className="text-[10px] font-bold text-secondary">Incomplete</div>
                    )}
                  </div>
                  <span className={`material-symbols-outlined text-outline-variant ${styles.arrowHover} transition-colors`}>
                    arrow_forward
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── Related Topics ──────────────────────────────────────── */}
      <section className="space-y-4 pt-4">
        <h3 className="text-lg font-bold text-on-surface px-2 font-body">Related Topics</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {RELATED_TOPICS.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="flex-shrink-0 w-48 bg-surface rounded-xl border border-outline-variant p-4 hover:border-primary transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded bg-surface-container-low flex items-center justify-center mb-3 group-hover:bg-primary-fixed transition-colors">
                <span className="material-symbols-outlined text-primary">{icon}</span>
              </div>
              <h5 className="font-bold text-xs text-on-surface">{title}</h5>
              <p className="text-[10px] text-secondary mt-1 leading-tight">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
