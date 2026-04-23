import { getDomainBySlug } from '@/lib/data/domains'
import { getChallenges } from '@/lib/data/challenges'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { ChallengeAccordion } from '@/components/challenges/ChallengeAccordion'
import type { AccordionChapter } from '@/components/challenges/ChallengeAccordion'

const DIFFICULTY_CHAPTERS: Record<string, { title: string; icon: string }> = {
  warmup:     { title: 'Warm-Up',  icon: 'psychology' },
  standard:   { title: 'Standard', icon: 'monitoring' },
  advanced:   { title: 'Advanced', icon: 'diversity_3' },
  staff_plus: { title: 'Staff+',   icon: 'military_tech' },
}
const DIFFICULTY_ORDER = ['warmup', 'standard', 'advanced', 'staff_plus']

export default async function DomainDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const domain = await getDomainBySlug(slug)
  if (!domain) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const challenges = await getChallenges({ domainId: domain.id })

  let scoreMap: Record<string, number> = {}
  if (user && challenges.length > 0) {
    const ids = challenges.map(c => c.id)
    const { data: attempts } = await supabase
      .from('challenge_attempts')
      .select('challenge_id, total_score')
      .eq('user_id', user.id)
      .in('challenge_id', ids)
      .not('submitted_at', 'is', null)
      .order('total_score', { ascending: false })
    for (const a of attempts ?? []) {
      if (!scoreMap[a.challenge_id] || a.total_score > scoreMap[a.challenge_id]) {
        scoreMap[a.challenge_id] = a.total_score
      }
    }
  }

  const chapterMap = new Map<string, AccordionChapter>()
  for (const diff of DIFFICULTY_ORDER) {
    const meta = DIFFICULTY_CHAPTERS[diff]
    const items = challenges
      .filter(c => c.difficulty === diff)
      .map(c => ({
        id: c.id, slug: c.slug, title: c.title, difficulty: c.difficulty,
        best_score: scoreMap[c.id] ?? null,
        is_completed: c.id in scoreMap,
      }))
    if (items.length > 0) chapterMap.set(diff, { key: diff, title: meta.title, icon: meta.icon, items })
  }
  for (const c of challenges) {
    if (!DIFFICULTY_ORDER.includes(c.difficulty) && !chapterMap.has('other')) {
      chapterMap.set('other', { key: 'other', title: 'Other', icon: 'category', items: [] })
    }
    if (!DIFFICULTY_ORDER.includes(c.difficulty)) {
      chapterMap.get('other')!.items.push({
        id: c.id, slug: c.slug, title: c.title, difficulty: c.difficulty,
        best_score: scoreMap[c.id] ?? null,
        is_completed: c.id in scoreMap,
      })
    }
  }
  const chapters = Array.from(chapterMap.values())

  const completedCount = Object.keys(scoreMap).length
  const progressPct = challenges.length > 0 ? Math.round((completedCount / challenges.length) * 100) : 0
  const firstIncomplete = challenges.find(c => !(c.id in scoreMap))
  const ctaHref = firstIncomplete ? `/workspace/challenges/${firstIncomplete.id}` : `/workspace/challenges/${challenges[0]?.id ?? '#'}`

  const avatarColors = Array.from({ length: 5 }, (_, i) => `hsl(${i * 67 + 110}, 45%, 52%)`)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 64px' }}>

      {/* ── Hero ── */}
      <div style={{
        borderRadius: 32, overflow: 'hidden', marginBottom: 32,
        background: 'linear-gradient(135deg, #1e3528 0%, #0e1a14 100%)',
        padding: '36px 48px', position: 'relative',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Dot grid */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 100% at 70% 50%, black 30%, transparent 75%)',
          maskImage: 'radial-gradient(ellipse 80% 100% at 70% 50%, black 30%, transparent 75%)',
        }} />
        {/* Glow */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(500px 400px at 80% 60%, rgba(78,180,120,0.14), transparent 65%)',
        }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          {/* Left */}
          <div>
            {/* Breadcrumb */}
            <div style={{
              fontFamily: 'var(--font-label)', fontSize: 12, fontWeight: 700,
              color: 'rgba(243,237,224,0.45)',
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20,
            }}>
              <Link href="/explore" style={{ color: 'inherit', textDecoration: 'none' }}>Explore</Link>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>chevron_right</span>
              <Link href="/explore/domains" style={{ color: 'inherit', textDecoration: 'none' }}>Domains</Link>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>chevron_right</span>
              <span style={{ color: 'rgba(243,237,224,0.70)' }}>{domain.title}</span>
            </div>

            {/* Icon + title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18, flexShrink: 0,
                background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ color: '#7ee099', fontSize: 28, fontVariationSettings: "'FILL' 1" }}>
                  {domain.icon ?? 'grid_view'}
                </span>
              </div>
              <h1 style={{
                fontFamily: 'var(--font-headline)',
                fontSize: 38, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1,
                color: '#f3ede0', margin: 0,
              }}>
                {domain.title}
              </h1>
            </div>

            {domain.description && (
              <p style={{
                fontFamily: 'var(--font-label)', fontSize: 14.5, lineHeight: 1.55,
                color: 'rgba(243,237,224,0.72)', maxWidth: 560, margin: '0 0 16px',
              }}>
                {domain.description}
              </p>
            )}

            {progressPct > 0 && (
              <div style={{ maxWidth: 520, marginBottom: 16 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 12, color: 'rgba(243,237,224,0.55)', fontWeight: 700,
                  marginBottom: 6, fontFamily: 'var(--font-label)',
                }}>
                  <span>Your progress</span>
                  <span>{progressPct}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #7ee099, #4a7c59)', borderRadius: 999 }} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <Link
                href={ctaHref}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: '#f3ede0', color: '#1e1b14',
                  padding: '14px 24px', borderRadius: 999,
                  fontFamily: 'var(--font-label)', fontWeight: 700, fontSize: 15,
                  textDecoration: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                {completedCount > 0 ? 'Continue' : 'Start practicing'}
              </Link>
              <Link
                href="/challenges"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: 'rgba(255,255,255,0.08)', color: '#f3ede0',
                  border: '1px solid rgba(255,255,255,0.14)',
                  padding: '14px 24px', borderRadius: 999,
                  fontFamily: 'var(--font-label)', fontWeight: 700, fontSize: 15,
                  textDecoration: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>explore</span>
                Browse all challenges
              </Link>
            </div>
          </div>

          {/* Right: stat pills */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            {[
              { label: 'Challenges', value: String(challenges.length) },
              { label: 'Difficulty tiers', value: String(chapters.length) },
              { label: 'Completed', value: completedCount > 0 ? `${completedCount}/${challenges.length}` : '—' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 18, padding: '10px 18px', minWidth: 150, textAlign: 'right',
              }}>
                <div style={{
                  fontFamily: 'var(--font-label)', fontSize: 10.5, fontWeight: 700,
                  letterSpacing: '0.07em', textTransform: 'uppercase' as const,
                  color: 'rgba(243,237,224,0.40)', marginBottom: 2,
                }}>
                  {stat.label}
                </div>
                <div style={{ fontFamily: 'var(--font-headline)', fontSize: 22, fontWeight: 600, color: '#f3ede0' }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

        {/* Left: Challenges */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{
              fontFamily: 'var(--font-headline)', fontSize: 26, fontWeight: 700,
              letterSpacing: '-0.01em', color: '#1e1b14', margin: 0,
            }}>
              Challenges
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-label)', fontSize: 12, color: '#78715f' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              {completedCount} of {challenges.length} completed
            </div>
          </div>

          {chapters.length > 0 ? (
            <ChallengeAccordion chapters={chapters} defaultOpenIndex={0} />
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0', fontFamily: 'var(--font-label)', fontSize: 14, color: '#78715f' }}>
              No challenges in this domain yet.
            </div>
          )}
        </div>

        {/* Right: Sticky sidebar */}
        <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Domain Overview */}
          <div style={{ background: '#fdfbf6', border: '1px solid #e7dfc9', borderRadius: 24, padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: 17, fontWeight: 700, color: '#1e1b14', marginBottom: 14 }}>
              Domain Overview
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Total challenges', value: String(challenges.length) },
                { label: 'Difficulty tiers', value: String(chapters.length) },
                { label: 'Completed', value: `${completedCount}/${challenges.length}` },
                ...(progressPct > 0 ? [{ label: 'Progress', value: `${progressPct}%`, isProgress: true }] : []),
              ].map((row, i, arr) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: 13.5,
                  borderBottom: i < arr.length - 1 ? '1px solid #e7dfc9' : 'none',
                  paddingBottom: i < arr.length - 1 ? 10 : 0,
                }}>
                  <span style={{ fontFamily: 'var(--font-label)', color: '#78715f' }}>{row.label}</span>
                  {'isProgress' in row && row.isProgress ? (
                    <span style={{
                      fontFamily: 'var(--font-label)', fontSize: 11.5, fontWeight: 800,
                      letterSpacing: '0.05em', textTransform: 'uppercase' as const,
                      background: '#cfe3d3', color: '#0f3d1f', padding: '3px 10px', borderRadius: 999,
                    }}>
                      {row.value}
                    </span>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-label)', fontWeight: 700, color: '#1e1b14' }}>{row.value}</span>
                  )}
                </div>
              ))}
            </div>
            <Link
              href={ctaHref}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                background: '#4a7c59', color: '#fff', borderRadius: 999, padding: '12px',
                fontFamily: 'var(--font-label)', fontSize: 14, fontWeight: 700,
                marginTop: 16, textDecoration: 'none', width: '100%', boxSizing: 'border-box' as const,
              }}
            >
              {completedCount > 0 ? 'Continue' : 'Start practicing'}
            </Link>
          </div>

          {/* Luma's Coaching */}
          <div style={{ background: '#cfe3d3', borderRadius: 24, padding: 18, border: '1px solid rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <LumaGlyph size={36} state="speaking" className="flex-shrink-0" />
              <div>
                <div style={{
                  fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 800,
                  letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                  color: '#0f3d1f', opacity: 0.7, marginBottom: 5,
                }}>
                  Luma&rsquo;s Coaching
                </div>
                <p style={{ fontFamily: 'var(--font-label)', fontSize: 13, lineHeight: 1.55, color: '#0f3d1f', margin: 0 }}>
                  Work through each difficulty tier in order. Warm-Up challenges build intuition; Advanced ones test your judgment under real constraints. Don&rsquo;t skip ahead.
                </p>
              </div>
            </div>
          </div>

          {/* Social proof */}
          <div style={{ background: '#fdfbf6', border: '1px solid #e7dfc9', borderRadius: 24, padding: 16 }}>
            <div style={{
              fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 800,
              letterSpacing: '0.06em', textTransform: 'uppercase' as const,
              color: '#78715f', marginBottom: 10,
            }}>
              Practicing this domain
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {avatarColors.map((bg, i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: '2px solid #fdfbf6', background: bg, color: '#fff',
                  fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-label)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginLeft: i === 0 ? 0 : -8, zIndex: 5 - i, position: 'relative',
                }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              <span style={{ fontFamily: 'var(--font-label)', fontSize: 13, color: '#4e4a3f', marginLeft: 14 }}>
                {challenges.length * 12}+ engineers
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
