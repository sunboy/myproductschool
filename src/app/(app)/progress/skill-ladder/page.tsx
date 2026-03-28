import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

/* ---------- mock data ---------- */
const levels = [
  {
    id: 'L1',
    flowLabel: 'Lens Finder',
    title: 'Lens Finder',
    subtitle: 'Beginner',
    description: 'Mastery of basic observational frameworks and data gathering principles.',
    status: 'completed' as const,
    completedDate: 'Jan 2026',
    careerLabel: 'Typical: APM / Junior PM',
  },
  {
    id: 'L2',
    flowLabel: 'Lens Builder',
    title: 'Lens Builder',
    subtitle: 'Developing',
    description: 'Apply strategic frameworks to interpret product signals and form hypotheses. Focus: Multi-stakeholder alignment & edge-case discovery.',
    status: 'active' as const,
    xpCurrent: 1240,
    xpMax: 2000,
    pct: 62,
    remaining: 6,
    featuredChallenge: {
      title: 'DAU/MAU ratio declining',
      difficulty: 'Hard',
      note: "Luma's Pick for you — based on your recent practice sessions.",
    },
  },
  {
    id: 'L3',
    flowLabel: 'Lens Strategist',
    title: 'Lens Strategist',
    subtitle: 'Proficient',
    description: 'Advanced synthesis of cross-functional inputs into cohesive product visions. Typical: Senior PM / PM Lead.',
    status: 'locked' as const,
    unlockRequirement: 'Complete 6 more Lens challenges (2 Hard)',
  },
  {
    id: 'L4',
    flowLabel: 'Lens Expert',
    title: 'Lens Expert',
    subtitle: 'Advanced',
    description: 'Master system-wide perspective moves and lead complex analyses at scale.',
    status: 'locked' as const,
  },
  {
    id: 'L5',
    flowLabel: 'Lens Master',
    title: 'Lens Master',
    subtitle: 'Elite',
    description: 'Elite all-round product thinker — mentor others and shape product strategy.',
    status: 'locked' as const,
  },
]

const careerBenchmarks = [
  { label: 'APM', active: false },
  { label: 'PM', active: false },
  { label: 'YOU', active: true, sublabel: 'PM-2 Senior' },
  { label: 'Principal', active: false },
]

const relatedSkills = [
  { name: 'Logic', level: 3 },
  { name: 'Metrics', level: 4 },
  { name: 'Design', level: 1 },
  { name: 'Strategy', level: 2 },
]

export default function SkillLadderPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-3 animate-fade-in-up">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-xs font-label text-on-surface-variant">
        <Link href="/progress" className="hover:text-primary">Progress</Link>
        <span>›</span>
        <Link href="/progress/skill-ladder" className="hover:text-primary">Skill Ladder</Link>
        <span>›</span>
        <span className="text-on-surface font-semibold">Lens Move</span>
      </nav>

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-headline font-bold text-on-surface mb-0.5">Lens Move</h1>
        <p className="text-xs font-body text-on-surface-variant">Level 2 — Lens Builder</p>
        <p className="text-xs font-body text-on-surface-variant italic">&ldquo;Find the right angle to see through a problem&rdquo;</p>
      </div>

      {/* ── XP Progress ── */}
      <div className="card-elevated rounded-xl p-4">
        <p className="text-xs font-label text-on-surface mb-1.5">You&apos;re <strong>6 challenges</strong> away from Level 3.</p>
        <div className="w-full h-2.5 rounded-full bg-surface-container-highest">
          <div className="h-2.5 rounded-full bg-primary transition-all" style={{ width: '62%' }} />
        </div>
        <p className="text-[10px] font-label text-on-surface-variant mt-1">1,240 / 2,000 XP (62%)</p>
      </div>

      {/* ── Level Cards ── */}
      <div className="space-y-3">
        {levels.map((lvl) => {
          if (lvl.status === 'completed') {
            return (
              <div key={lvl.id} className="card-elevated rounded-xl p-4 opacity-70">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-on-primary text-base">check</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-label font-semibold text-primary">{lvl.id} — {lvl.flowLabel} · {lvl.subtitle}</span>
                    <p className="font-label font-semibold text-on-surface text-sm">{lvl.title}</p>
                    <p className="text-xs font-body text-on-surface-variant">{lvl.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-label text-on-surface-variant">
                      <span>Earned {lvl.completedDate}</span>
                      <span>{lvl.careerLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          if (lvl.status === 'active') {
            return (
              <div key={lvl.id} className="card-elevated rounded-xl p-4 ring-2 ring-primary/40">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="font-label font-bold text-on-primary text-xs">{lvl.id}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-label font-semibold text-primary">{lvl.id} — {lvl.flowLabel} · {lvl.subtitle}</span>
                      <span className="text-[10px] font-label bg-primary/10 text-primary rounded-full px-2 py-0.5">You are here</span>
                    </div>
                    <p className="font-label font-semibold text-on-surface text-sm">{lvl.title}</p>
                    <p className="text-xs font-body text-on-surface-variant">{lvl.description}</p>

                    {/* Progress */}
                    <div className="mt-2">
                      <div className="w-full h-1.5 rounded-full bg-surface-container-highest">
                        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${lvl.pct}%` }} />
                      </div>
                      <p className="text-[10px] font-label text-on-surface-variant mt-0.5">{lvl.pct}% · {lvl.remaining} challenges remaining to Level 3</p>
                    </div>

                    {/* Featured challenge — Luma's Pick */}
                    {lvl.featuredChallenge && (
                      <div className="mt-3 bg-surface-container-high rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <LumaGlyph size={16} className="text-primary" />
                          <p className="text-[10px] font-label font-semibold text-primary">Luma&apos;s Pick for you</p>
                        </div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-label font-semibold text-on-surface text-sm">{lvl.featuredChallenge.title}</p>
                          <span className="text-[10px] font-label bg-error/10 text-error rounded-full px-1.5 py-0.5">{lvl.featuredChallenge.difficulty}</span>
                        </div>
                        <p className="text-[10px] font-label text-on-surface-variant mb-2">{lvl.featuredChallenge.note}</p>
                        <Link
                          href="/challenges"
                          className="glow-primary inline-flex items-center gap-1 bg-primary text-on-primary rounded-full px-4 py-2 text-xs font-label font-semibold"
                        >
                          Start <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          }

          // locked
          return (
            <div key={lvl.id} className="card-elevated rounded-xl p-4 opacity-60">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-dim flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-surface-variant text-base">lock</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-label font-semibold text-on-surface-variant">{lvl.id} — {lvl.flowLabel} · {lvl.subtitle}</span>
                    {lvl.id === 'L3' && (
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">workspace_premium</span>
                    )}
                  </div>
                  <p className="font-label font-semibold text-on-surface text-sm">{lvl.title}</p>
                  <p className="text-xs font-body text-on-surface-variant">{lvl.description}</p>
                  {'unlockRequirement' in lvl && lvl.unlockRequirement && (
                    <p className="text-[10px] font-label text-on-surface-variant mt-1 italic">&ldquo;{lvl.unlockRequirement}&rdquo;</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Live Credential ── */}
      <section className="card-elevated rounded-xl p-4">
        <h3 className="font-label font-semibold text-on-surface text-xs mb-2">Live Credential</h3>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-primary text-xl">verified</span>
          </div>
          <div className="flex-1">
            <p className="font-headline font-bold text-on-surface text-sm">Lens Builder</p>
            <p className="text-[10px] font-label text-on-surface-variant">Level 2 · HACKPRODUCT VERIFIED</p>
          </div>
          <button className="bg-secondary-container text-on-secondary-container rounded-full px-3 py-2 text-xs font-label font-semibold shrink-0 inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">share</span>
            Add to LinkedIn
          </button>
        </div>
      </section>

      {/* ── Career Benchmark ── */}
      <section className="card-elevated rounded-xl p-4">
        <h3 className="font-label font-semibold text-on-surface text-xs mb-1">Career Benchmark</h3>
        <p className="text-[10px] font-body text-on-surface-variant mb-3">
          Your current &lsquo;Lens Move&rsquo; skill score puts you in the <strong>top 15%</strong> of Mid-Level PMs in the tech industry.
        </p>
        <div className="flex items-center gap-0">
          {careerBenchmarks.map((b, i) => (
            <div key={b.label} className="flex-1 relative">
              <div className={`h-2 ${b.active ? 'bg-primary' : 'bg-surface-container-highest'} ${i === 0 ? 'rounded-l-full' : ''} ${i === careerBenchmarks.length - 1 ? 'rounded-r-full' : ''}`} />
              <div className="mt-1.5 text-center">
                {b.active ? (
                  <>
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                    <p className="text-[10px] font-label font-bold text-primary">{b.label}</p>
                    {'sublabel' in b && <p className="text-[9px] font-label text-on-surface-variant">{b.sublabel}</p>}
                  </>
                ) : (
                  <p className="text-[10px] font-label text-on-surface-variant">{b.label}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Related Skills ── */}
      <section>
        <h3 className="font-label font-semibold text-on-surface text-xs mb-2">Related Skills</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {relatedSkills.map((s) => (
            <div key={s.name} className="card-elevated rounded-lg p-3 text-center">
              <p className="font-label font-semibold text-on-surface text-sm">{s.name}</p>
              <p className="text-[10px] font-label text-on-surface-variant">Level {s.level}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FLOW Framework Note ── */}
      <section className="bg-tertiary-container rounded-xl p-4">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-on-surface text-lg mt-0.5">lightbulb</span>
          <div>
            <p className="font-label font-semibold text-on-surface text-xs mb-0.5">FLOW Framework</p>
            <p className="text-xs font-body text-on-surface/80">
              The Lens move is one of 4 FLOW thinking moves: <strong>Frame · Lens · Optimize · Win</strong>. Level 3 doesn&apos;t just solve the problem — it identifies why the problem exists in the wider organizational ecosystem.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
