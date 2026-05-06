import { getDomainBySlug } from '@/lib/data/domains'
import { getChallenges } from '@/lib/data/challenges'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChallengeAccordion } from '@/components/challenges/ChallengeAccordion'
import type { AccordionChapter } from '@/components/challenges/ChallengeAccordion'
import { getTechniqueLabelAny } from '@/lib/data/taxonomy'

const DIFFICULTY_CHAPTERS: Record<string, { title: string; icon: string }> = {
  warmup:     { title: 'Warm-Up',   icon: 'psychology' },
  standard:   { title: 'Standard',  icon: 'monitoring' },
  advanced:   { title: 'Advanced',  icon: 'diversity_3' },
  staff_plus: { title: 'Staff+',    icon: 'military_tech' },
}

const DIFFICULTY_ORDER = ['warmup', 'standard', 'advanced', 'staff_plus']

export default async function DomainDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const domain = await getDomainBySlug(slug)
  if (!domain) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const challenges = await getChallenges({ domainId: domain.id })

  // Build score map from user's attempts
  const scoreMap: Record<string, number> = {}
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

  // ── Technique breakdown ────────────────────────────────────────────────────
  // Aggregate technique_tags across all challenges in this domain.
  // Top 8 by frequency, filtered to those we can resolve a label for.
  const techniqueCount = new Map<string, number>()
  for (const c of challenges) {
    for (const t of c.technique_tags ?? []) {
      techniqueCount.set(t, (techniqueCount.get(t) ?? 0) + 1)
    }
  }
  const topTechniques = Array.from(techniqueCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([slug, count]) => ({ slug, count, label: getTechniqueLabelAny(slug) }))
    .filter(t => t.label !== undefined) as { slug: string; count: number; label: string }[]

  // ── Real interview challenges ──────────────────────────────────────────────
  const realInterviewChallenges = challenges.filter(
    c => c.is_real_interview && (c.company_tags ?? []).length > 0
  )

  // ── Group by difficulty for accordion ─────────────────────────────────────
  const chapterMap = new Map<string, AccordionChapter>()
  for (const diff of DIFFICULTY_ORDER) {
    const meta = DIFFICULTY_CHAPTERS[diff]
    const items = challenges
      .filter(c => c.difficulty === diff)
      .map(c => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        difficulty: c.difficulty,
        best_score: scoreMap[c.id] ?? null,
        is_completed: c.id in scoreMap,
        topic_tags: c.topic_tags ?? [],
        technique_tags: c.technique_tags ?? [],
        is_real_interview: c.is_real_interview ?? false,
        company_tags: c.company_tags ?? [],
      }))
    if (items.length > 0) {
      chapterMap.set(diff, { key: diff, title: meta.title, icon: meta.icon, items })
    }
  }
  // Any uncategorised difficulties
  for (const c of challenges) {
    if (!DIFFICULTY_ORDER.includes(c.difficulty) && !chapterMap.has('other')) {
      chapterMap.set('other', { key: 'other', title: 'Other', icon: 'category', items: [] })
    }
    if (!DIFFICULTY_ORDER.includes(c.difficulty)) {
      chapterMap.get('other')!.items.push({
        id: c.id,
        slug: c.slug,
        title: c.title,
        difficulty: c.difficulty,
        best_score: scoreMap[c.id] ?? null,
        is_completed: c.id in scoreMap,
        topic_tags: c.topic_tags ?? [],
        technique_tags: c.technique_tags ?? [],
        is_real_interview: c.is_real_interview ?? false,
        company_tags: c.company_tags ?? [],
      })
    }
  }
  const chapters = Array.from(chapterMap.values())

  const completedCount = Object.keys(scoreMap).length
  const progressPct = challenges.length > 0 ? Math.round((completedCount / challenges.length) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5 font-label text-xs text-on-surface-variant">
        <Link href="/explore/domains" className="hover:text-primary transition-colors">Domains</Link>
        <span>/</span>
        <span className="text-on-surface font-bold">{domain.title}</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-fixed flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>{domain.icon ?? 'grid_view'}</span>
          </div>
          <h1 className="font-headline text-2xl font-extrabold text-on-surface leading-tight">{domain.title}</h1>
        </div>
        {domain.description && (
          <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-4">{domain.description}</p>
        )}
        <div className="flex items-center gap-5 font-label text-xs text-on-surface-variant font-medium">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 0" }}>layers</span>
            {challenges.length} challenges
          </span>
          {completedCount > 0 && (
            <span className="flex items-center gap-1.5 text-primary font-bold">
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              {completedCount}/{challenges.length} completed
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {challenges.length > 0 && completedCount > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-[11px] font-bold text-on-surface-variant mb-1.5">
            <span className="font-label">Progress</span>
            <span className="font-label tabular-nums">{progressPct}%</span>
          </div>
          <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* ── Technique breakdown ────────────────────────────────────────────── */}
      {topTechniques.length > 0 && (
        <div className="mb-6 bg-surface-container rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>schema</span>
            <h2 className="font-headline text-sm font-bold text-on-surface">Techniques in this domain</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {topTechniques.map(({ slug, label, count }) => (
              <Link
                key={slug}
                href={`/challenges?technique=${slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high hover:bg-primary-fixed transition-colors group"
              >
                <span className="text-xs font-label font-semibold text-on-surface group-hover:text-primary transition-colors">
                  {label}
                </span>
                <span className="text-[10px] font-label text-on-surface-variant tabular-nums">
                  {count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Real interview questions ───────────────────────────────────────── */}
      {realInterviewChallenges.length > 0 && (
        <div className="mb-6 bg-tertiary-container/30 border border-outline-variant rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[18px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <h2 className="font-headline text-sm font-bold text-on-surface">Real interview questions</h2>
            <span className="ml-auto text-[10px] font-label font-bold px-2 py-0.5 rounded-full bg-tertiary-container text-on-secondary-container">
              {realInterviewChallenges.length}
            </span>
          </div>
          <p className="font-body text-xs text-on-surface-variant mb-3">
            These challenges were sourced from actual interview loops at top companies.
          </p>
          <div className="flex flex-col gap-1">
            {realInterviewChallenges.slice(0, 5).map(c => (
              <Link
                key={c.id}
                href={`/workspace/challenges/${c.slug ?? c.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container transition-colors group"
              >
                <span className="material-symbols-outlined text-[14px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="flex-1 text-xs font-label font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                  {c.title}
                </span>
                {(c.company_tags ?? []).length > 0 && (
                  <span className="text-[10px] font-label text-on-surface-variant shrink-0">
                    {c.company_tags![0]}
                  </span>
                )}
              </Link>
            ))}
            {realInterviewChallenges.length > 5 && (
              <Link
                href={`/challenges?domain=${domain.slug}&real_interview=true`}
                className="text-xs font-label font-semibold text-primary hover:underline mt-1 px-3"
              >
                View all {realInterviewChallenges.length} real interview questions →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Challenge accordion */}
      {chapters.length > 0 ? (
        <ChallengeAccordion chapters={chapters} defaultOpenIndex={0} />
      ) : (
        <div className="text-center py-12 text-on-surface-variant text-sm">
          No challenges in this domain yet.
        </div>
      )}
    </div>
  )
}
