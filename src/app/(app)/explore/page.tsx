import Link from 'next/link'
import type { StudyPlan, AutopsyProduct, LearnModule, DomainWithProgress } from '@/lib/types'
import { getStudyPlanSummaries } from '@/lib/data/study-plans'
import { getShowcaseProducts } from '@/lib/data/showcase'
import { getLearnModuleSummaries } from '@/lib/data/learn-modules'
import { getDomainsWithProgress } from '@/lib/data/domains'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ParadigmGrid } from './ParadigmGrid'
import { StudyPlanGrid } from './StudyPlanGrid'

interface PersonalisedPlan {
  slug: string
  title: string
  description: string | null
  move_tag: string | null
}

const MOVE_ICON: Record<string, string> = {
  frame: 'center_focus_strong',
  list: 'format_list_bulleted',
  optimize: 'tune',
  win: 'emoji_events',
}

const MOVE_LABEL: Record<string, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

/* ── Static data ────────────────────────────────────────────────── */

interface PlanItem {
  title: string
  sub: string
  diff: string
  color: string
  bg: string
  enrolled: number
  icon: string
  slug: string
}

const PLANS_STATIC: PlanItem[] = [
  { title: 'Staff Engineer Path',            sub: '6 weeks · All paradigms',        diff: 'Intermediate', color: '#4a7c59', bg: '#cfe3d3', enrolled: 1243,  icon: 'route',       slug: 'staff-engineer-path' },
  { title: 'AI Product Foundations',         sub: '3 weeks · AI-Assisted + Native', diff: 'Beginner',     color: '#3b6ed4', bg: '#e1ecff', enrolled: 892,   icon: 'smart_toy',   slug: 'ai-product-foundations' },
  { title: 'Decision-Making Under Pressure', sub: '4 weeks · Traditional',          diff: 'Advanced',     color: '#8b46d4', bg: '#ecdeff', enrolled: 441,   icon: 'bolt',        slug: 'decision-making-under-pressure' },
  { title: 'From Engineer to PM',            sub: '8 weeks · All',                  diff: 'Beginner',     color: '#c9602a', bg: '#fbe1d0', enrolled: 2104,  icon: 'trending_up', slug: 'from-engineer-to-pm' },
]

/* ── FLOW moves ─────────────────────────────────────────────────── */

const FLOW_MOVES = [
  { k: 'Frame',    sub: 'Define the right problem',  color: '#4a7c59', bg: '#cfe3d3', icon: 'center_focus_strong' },
  { k: 'List',     sub: 'Generate quality options',  color: '#6b8275', bg: '#dfe7e1', icon: 'format_list_bulleted' },
  { k: 'Optimize', sub: 'Pick and sharpen the best', color: '#c9933a', bg: '#f3e2b9', icon: 'tune' },
  { k: 'Win',      sub: 'Drive durable outcomes',    color: '#a878d6', bg: '#ecdeff', icon: 'emoji_events' },
] as const

/* ── Module static fallback ─────────────────────────────────────── */

const MODULES_STATIC = [
  { slug: 'flow-framework',     name: 'The FLOW Framework',     tagline: 'How product decisions get made.',            cover_color: '#1e3528', accent_color: '#7ee099', chapter_count: 8,  est_minutes: 90,  difficulty: 'beginner'     },
  { slug: 'product-sense',      name: 'Product Sense',          tagline: 'Developing taste and judgment.',             cover_color: '#172240', accent_color: '#7aa7ff', chapter_count: 7,  est_minutes: 75,  difficulty: 'intermediate' },
  { slug: 'agentic-pm',         name: 'Agentic PM',             tagline: 'Managing AI systems end-to-end.',            cover_color: '#25143a', accent_color: '#c89df5', chapter_count: 6,  est_minutes: 80,  difficulty: 'advanced'     },
  { slug: 'metrics-tradeoffs',  name: 'Metrics & Trade-offs',   tagline: 'The numbers that drive real decisions.',     cover_color: '#301a0a', accent_color: '#f5a76c', chapter_count: 5,  est_minutes: 60,  difficulty: 'intermediate' },
  { slug: 'stakeholder-comms',  name: 'Stakeholder Comms',      tagline: 'Making decisions land with the right people.', cover_color: '#1a2034', accent_color: '#85c1e9', chapter_count: 4,  est_minutes: 45,  difficulty: 'beginner'     },
  { slug: 'strategy-execution', name: 'Strategy & Execution',   tagline: 'Closing the gap between plans and outcomes.', cover_color: '#1a1a1a', accent_color: '#a8d8a8', chapter_count: 6,  est_minutes: 70,  difficulty: 'advanced'     },
] as const

/* ── Domain card palettes & SVG art ─────────────────────────────── */

const DOMAIN_PALETTES = [
  { bg: '#cfe3d3', accent: '#4a7c59', fg: '#1a2e20' },
  { bg: '#f3e2b9', accent: '#c9933a', fg: '#3a2a0a' },
  { bg: '#ecdeff', accent: '#8b46d4', fg: '#2e1458' },
  { bg: '#e1ecff', accent: '#3b6ed4', fg: '#1a2e58' },
  { bg: '#fbe1d0', accent: '#c9602a', fg: '#3a1a0a' },
  { bg: '#dfe7e1', accent: '#6b8275', fg: '#1e2e28' },
]

function DomainArtWaves({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 220 140" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} aria-hidden>
      {[30, 50, 70, 90, 110, 130].map((y, i) => (
        <path key={i}
          d={`M-10 ${y} C 30 ${y - 12}, 80 ${y + 12}, 130 ${y} C 180 ${y - 12}, 210 ${y + 8}, 230 ${y}`}
          stroke={color} strokeWidth="1.6" fill="none" opacity={0.09 + i * 0.03}
        />
      ))}
    </svg>
  )
}

function DomainArtDots({ color }: { color: string }) {
  const dots: { cx: number; cy: number; r: number; op: number }[] = []
  for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) {
    const t = (r * 8 + c) / 47
    dots.push({ cx: 16 + c * 28, cy: 14 + r * 22, r: 1.5 + t * 3, op: 0.07 + t * 0.15 })
  }
  return (
    <svg viewBox="0 0 240 140" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} aria-hidden>
      {dots.map((d, i) => <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={color} opacity={d.op} />)}
    </svg>
  )
}

function DomainArtChevrons({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 220 140" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} aria-hidden>
      {[0, 1, 2, 3].map(i => (
        <path key={i}
          d={`M ${40 + i * 36} 130 L ${90 + i * 36} 60 L ${140 + i * 36} 130`}
          stroke={color} strokeWidth="10" fill="none" strokeLinecap="round"
          opacity={0.10 + i * 0.03}
        />
      ))}
    </svg>
  )
}

function DomainArtCircles({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 220 140" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} aria-hidden>
      {[25, 50, 75, 100, 125].map((r, i) => (
        <circle key={i} cx={200} cy={20} r={r} stroke={color} strokeWidth="1.2" fill="none" opacity={0.08 + i * 0.03} />
      ))}
    </svg>
  )
}

const DOMAIN_ARTS = [DomainArtWaves, DomainArtDots, DomainArtChevrons, DomainArtCircles]

/* ── Page ────────────────────────────────────────────────────────── */

export default async function ExplorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [studyPlansRaw, showcaseProducts, modulesRaw, domains, challengeCount, personalisedPlan] = await Promise.all([
    getStudyPlanSummaries(4).catch(() => [] as StudyPlan[]),
    getShowcaseProducts().catch(() => [] as AutopsyProduct[]),
    getLearnModuleSummaries(6).catch(() => [] as LearnModule[]),
    getDomainsWithProgress().catch(() => [] as DomainWithProgress[]),
    (async () => {
      try {
        const { count } = await supabase
          .from('challenges')
          .select('id', { count: 'exact', head: true })
          .eq('is_published', true)
        return count ?? 0
      } catch { return 0 }
    })(),
    (async (): Promise<PersonalisedPlan | null> => {
      if (!user) return null
      try {
        const admin = createAdminClient()
        const { data } = await admin
          .from('user_study_plan_enrollments')
          .select('plan_id, study_plans(id, slug, title, description, move_tag)')
          .eq('user_id', user.id)
          .order('enrolled_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (!data) return null
        const plan = (data as unknown as { study_plans: PersonalisedPlan | null }).study_plans
        return plan
      } catch { return null }
    })(),
  ])

  const plans: PlanItem[] = studyPlansRaw.length > 0
    ? studyPlansRaw.map((p, i) => ({
        title: p.title,
        sub: `${p.estimated_hours} hrs`,
        diff: (p as unknown as { difficulty?: string }).difficulty ?? 'Intermediate',
        color: PLANS_STATIC[i % PLANS_STATIC.length].color,
        bg: PLANS_STATIC[i % PLANS_STATIC.length].bg,
        enrolled: (p as unknown as { participant_count?: number }).participant_count ?? 0,
        icon: PLANS_STATIC[i % PLANS_STATIC.length].icon,
        slug: p.slug,
      }))
    : PLANS_STATIC

  const modules = modulesRaw.length > 0 ? modulesRaw : MODULES_STATIC

  return (
    <div
      className="animate-fade-in-up"
      style={{ maxWidth: 1440, margin: '0 auto', padding: '28px 32px 120px' }}
    >

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3528 0%, #14241c 55%, #0e1a14 100%)',
        borderRadius: 32,
        padding: '36px 40px 32px',
        position: 'relative', overflow: 'hidden',
        marginBottom: 48,
      }}>
        {/* Dot grid bg */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse 70% 100% at 70% 50%, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 100% at 70% 50%, black 40%, transparent 80%)',
        }} />
        {/* Green glow */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(600px 500px at 80% 50%, rgba(78,180,120,0.18), transparent 60%)',
        }} />
        <SpiralSVG color="#7ee099" />

        <div style={{ position: 'relative' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
              padding: '5px 14px', borderRadius: 999,
              fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: '#9ee0b8',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7ee099', flexShrink: 0 }} />
              {challengeCount} challenges · 4 paradigms
            </div>
            <h1 style={{
              margin: '0 0 10px',
              fontFamily: 'var(--font-headline)', fontWeight: 700,
              fontSize: 40, lineHeight: 1.05, letterSpacing: '-0.025em',
              color: '#f3ede0',
            }}>
              Explore the full<br />
              <span style={{
                background: 'linear-gradient(90deg, #7ee099, #c9e86e)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>challenge library.</span>
            </h1>
            <p style={{ margin: '0 0 22px', fontSize: 15, lineHeight: 1.55, color: 'rgba(243,237,224,0.72)', maxWidth: 520 }}>
              Real scenarios from real companies. Pick a paradigm, follow a structured plan, or let Luma choose for you.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Link
                href="/challenges"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#f3ede0', color: '#1e1b14',
                  padding: '10px 20px', borderRadius: 999,
                  fontWeight: 700, fontSize: 13, textDecoration: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>explore</span>
                Browse all {challengeCount}
              </Link>
              <Link
                href="/explore/plans"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.08)', color: '#f3ede0',
                  border: '1px solid rgba(255,255,255,0.14)',
                  padding: '10px 20px', borderRadius: 999,
                  fontWeight: 700, fontSize: 13, textDecoration: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>route</span>
                View study plans
              </Link>
              {personalisedPlan && (
                <Link
                  href={`/explore/plans/${personalisedPlan.slug}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    background: 'rgba(126,224,153,0.12)',
                    border: '1px solid rgba(126,224,153,0.25)',
                    padding: '10px 16px', borderRadius: 999,
                    fontWeight: 700, fontSize: 13, textDecoration: 'none',
                    color: '#7ee099',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  Your plan, built by Luma
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── PARADIGMS ─────────────────────────────────────────── */}
      <SectionHeading eyebrow="The four formats" title="Formats." href="/challenges" linkLabel="View all challenges" />
      <ParadigmGrid />

      {/* ── FLOW FRAMEWORK STRIP ─────────────────────────────── */}
      <div style={{
        background: '#1e1b14',
        borderRadius: 32,
        padding: '44px 48px',
        position: 'relative', overflow: 'hidden',
        marginBottom: 48,
      }}>
        <div aria-hidden style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'var(--font-headline)', fontSize: 200, fontWeight: 800,
          letterSpacing: '-0.04em', lineHeight: 1,
          color: '#fff', opacity: 0.03,
          whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none',
        }}>FLOW</div>

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '360px 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(243,237,224,0.45)', marginBottom: 10 }}>
              The reasoning framework
            </div>
            <h2 style={{ margin: '0 0 14px', fontFamily: 'var(--font-headline)', fontSize: 42, fontWeight: 700, letterSpacing: '-0.025em', color: '#f3ede0', lineHeight: 1.05 }}>
              The FLOW<br />Framework
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: 15, lineHeight: 1.6, color: 'rgba(243,237,224,0.65)' }}>
              Every HackProduct challenge is structured around four moves that compound into product judgment. The more you practice, the more automatic they become.
            </p>
            <Link
              href="/explore/flow"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#f3ede0', color: '#1e1b14',
                padding: '14px 24px', borderRadius: 999,
                fontWeight: 700, fontSize: 15, textDecoration: 'none',
              }}
            >
              Learn how FLOW works
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {FLOW_MOVES.map(m => (
              <div key={m.k} style={{
                background: m.bg, borderRadius: 24, padding: '22px 20px',
                position: 'relative', overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.04)',
              }}>
                <div aria-hidden style={{
                  position: 'absolute', right: -4, bottom: -8,
                  fontFamily: 'var(--font-headline)', fontSize: 86, fontWeight: 800,
                  color: m.color, opacity: 0.10, lineHeight: 1, userSelect: 'none',
                  letterSpacing: '-0.04em', pointerEvents: 'none',
                }}>{m.k[0]}</div>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, background: m.color,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
                  }}>
                    <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 18, fontVariationSettings: "'FILL' 1, 'wght' 500" }}>{m.icon}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-headline)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>{m.k}</div>
                  <div style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.65)', marginTop: 2 }}>{m.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── COURSE MODULES ───────────────────────────────────── */}
      <SectionHeading eyebrow="Deep learning" title="Guides." href="/explore/modules" linkLabel="All guides" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 48 }}>
        {modules.map(m => (
          <Link
            key={m.slug}
            href={`/explore/modules/${m.slug}`}
            style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              background: m.cover_color,
              borderRadius: 24,
              padding: '28px 24px 22px',
              minHeight: 200,
              position: 'relative', overflow: 'hidden',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Faint dot grid */}
            <div aria-hidden style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '18px 18px',
              maskImage: 'radial-gradient(ellipse 80% 80% at 80% 80%, black, transparent)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 80% 80%, black, transparent)',
            }} />

            {/* Chapter count watermark */}
            <div aria-hidden style={{
              position: 'absolute', right: -6, bottom: -10,
              fontFamily: 'var(--font-headline)', fontSize: 100, fontWeight: 800,
              color: m.accent_color, opacity: 0.07, lineHeight: 1,
              userSelect: 'none', pointerEvents: 'none', letterSpacing: '-0.04em',
            }}>{m.chapter_count}</div>

            <div style={{ position: 'relative' }}>
              {/* Difficulty chip */}
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)',
                padding: '3px 10px', borderRadius: 999, marginBottom: 14,
                fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                color: m.accent_color,
              }}>
                {m.difficulty}
              </div>
              <div style={{
                fontFamily: 'var(--font-headline)', fontSize: 22, fontWeight: 700,
                letterSpacing: '-0.015em', lineHeight: 1.15, color: '#f3ede0',
                marginBottom: 6,
              }}>
                {m.name}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, color: 'rgba(243,237,224,0.6)' }}>
                {m.tagline}
              </div>
            </div>

            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(243,237,224,0.55)' }}>
                {m.chapter_count} chapters · {m.est_minutes} min
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)',
                color: '#f3ede0', padding: '7px 14px', borderRadius: 999,
                fontWeight: 700, fontSize: 12.5,
              }}>
                Start
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── PRODUCT AUTOPSIES ─────────────────────────────────── */}
      {showcaseProducts.length > 0 && (
        <>
          <SectionHeading eyebrow="Case studies" title="Product autopsies." href="/explore/showcase" linkLabel="View all" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 48 }}>
            {showcaseProducts.slice(0, 4).map(product => {
              const bg = product.cover_color ?? '#1e1b14'
              return (
                <Link
                  key={product.slug}
                  href={`/explore/showcase/${product.slug}`}
                  style={{
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    background: bg, borderRadius: 24, padding: '22px 20px',
                    minHeight: 180, textDecoration: 'none',
                    border: '1px solid rgba(255,255,255,0.07)',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {/* Dark overlay to tame vivid cover colors */}
                  <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.32)', borderRadius: 24, pointerEvents: 'none' }} />

                  {/* Giant emoji watermark */}
                  {product.logo_emoji && (
                    <div aria-hidden style={{
                      position: 'absolute', right: -4, bottom: -8,
                      fontSize: 90, lineHeight: 1, opacity: 0.12,
                      userSelect: 'none', pointerEvents: 'none',
                    }}>{product.logo_emoji}</div>
                  )}

                  <div style={{ position: 'relative' }}>
                    {/* Emoji + industry */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      {product.logo_emoji && (
                        <div style={{
                          width: 40, height: 40, borderRadius: 12,
                          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.20)',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 22,
                        }}>{product.logo_emoji}</div>
                      )}
                      {product.industry && (
                        <div style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                          color: 'rgba(255,255,255,0.80)',
                        }}>{product.industry}</div>
                      )}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-headline)', fontSize: 20, fontWeight: 700,
                      letterSpacing: '-0.01em', color: '#ffffff', marginBottom: 4,
                    }}>{product.name}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.82)', lineHeight: 1.45 }}>
                      {product.tagline}
                    </div>
                  </div>

                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.70)' }}>
                      {product.decision_count} decisions
                    </div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.28)',
                      color: '#ffffff', padding: '6px 12px', borderRadius: 999,
                      fontWeight: 700, fontSize: 12,
                    }}>
                      Explore
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_forward</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}

      {/* ── DOMAINS ───────────────────────────────────────────── */}
      {domains.length > 0 && (
        <>
          <SectionHeading eyebrow="Topic areas" title="Explore by domain." href="/domains" linkLabel="All domains" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 48 }}>
            {domains.slice(0, 8).map((d, i) => {
              const palette = DOMAIN_PALETTES[i % DOMAIN_PALETTES.length]
              const DomainArt = DOMAIN_ARTS[i % DOMAIN_ARTS.length]
              return (
                <Link
                  key={d.slug}
                  href={`/domains/${d.slug}`}
                  style={{
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    background: palette.bg,
                    borderRadius: 20,
                    padding: '18px 18px 16px',
                    minHeight: 140,
                    textDecoration: 'none',
                    border: '1px solid rgba(0,0,0,0.05)',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {/* SVG art background */}
                  <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <DomainArt color={palette.accent} />
                  </div>

                  {/* Progress bar at bottom */}
                  {d.progress_percentage > 0 && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0,
                      height: 3, background: palette.accent,
                      width: `${d.progress_percentage}%`,
                      borderRadius: '0 0 0 999px',
                    }} />
                  )}

                  <div style={{ position: 'relative' }}>
                    {d.icon && (
                      <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: palette.accent,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 10,
                        boxShadow: `0 3px 10px -3px ${palette.accent}66`,
                      }}>
                        <span className="material-symbols-outlined" style={{
                          fontSize: 18, color: '#fff',
                          fontVariationSettings: "'FILL' 1, 'wght' 500",
                        }}>{d.icon}</span>
                      </div>
                    )}
                    <div style={{
                      fontFamily: 'var(--font-headline)', fontSize: 16, fontWeight: 700,
                      letterSpacing: '-0.01em', color: palette.fg,
                      marginBottom: 3,
                    }}>{d.title}</div>
                    {d.description && (
                      <div style={{
                        fontSize: 12, fontWeight: 600, color: palette.fg, opacity: 0.65,
                        lineHeight: 1.45,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>{d.description}</div>
                    )}
                  </div>

                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: palette.fg, opacity: 0.55 }}>
                      {d.challenge_count} challenges
                    </div>
                    {d.progress_percentage > 0 && (
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: palette.accent }}>
                        {Math.round(d.progress_percentage)}%
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}

      {/* ── STUDY PLANS ──────────────────────────────────────── */}
      <SectionHeading eyebrow="Structured learning" title="Study Plans." href="/explore/plans" linkLabel="All plans" />
      <StudyPlanGrid plans={plans} personalisedPlan={personalisedPlan} />
    </div>
  )
}

/* ── Shared section heading ─────────────────────────────────────── */

function SectionHeading({ eyebrow, title, href, linkLabel }: {
  eyebrow: string
  title: string
  href: string
  linkLabel: string
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-on-surface-muted)', marginBottom: 6 }}>
          {eyebrow}
        </div>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: 38, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
          {title}
        </h2>
      </div>
      <Link
        href={href}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: 'var(--color-primary)', fontWeight: 700, fontSize: 13,
          background: 'transparent', border: 'none', textDecoration: 'none',
          letterSpacing: '0.04em',
        }}
      >
        {linkLabel}{' '}
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
      </Link>
    </div>
  )
}

/* ── Static SVG (server-renderable) ────────────────────────────── */

function SpiralSVG({ color }: { color: string }) {
  const pts: string[] = []
  for (let t = 0; t < 8 * Math.PI; t += 0.08) {
    const r = 6 + t * 5
    pts.push(`${130 + r * Math.cos(t)},${100 + r * Math.sin(t)}`)
  }
  return (
    <svg viewBox="0 0 260 200" style={{ position: 'absolute', bottom: -20, right: -20, width: '80%', height: '80%', pointerEvents: 'none', zIndex: 0 }}>
      <polyline points={pts.join(' ')} stroke={color} strokeWidth="1.8" fill="none" opacity={0.14} />
    </svg>
  )
}
