import { getDomainBySlug } from '@/lib/data/domains'
import { getChallenges } from '@/lib/data/challenges'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChallengeAccordion } from '@/components/challenges/ChallengeAccordion'
import type { AccordionChapter } from '@/components/challenges/ChallengeAccordion'

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

  // Group by difficulty
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
