import { createAdminClient } from '@/lib/supabase/admin'
import { getChallengeCounts, type CountDiscipline } from '@/lib/data/challenges'
import { getLearnModuleSummaries } from '@/lib/data/learn-modules'
import { getPublishedAutopsyStories, getAutopsyCompanies } from '@/lib/autopsies/queries'
import { getUserBookmarks } from '@/lib/showcase/bookmarks'

export interface PracticeArea { discipline: Exclude<CountDiscipline, 'all'>; label: string; href: string; seed: string; artIndex: number }
export const PRACTICE_AREAS: PracticeArea[] = [
  { discipline: 'algorithm',     label: 'Coding / DSA',  href: '/challenges?discipline=algorithm',     seed: 'area-coding',  artIndex: 7 },
  { discipline: 'sql',           label: 'SQL & Data',    href: '/challenges?discipline=sql',           seed: 'area-sql',     artIndex: 3 },
  { discipline: 'system_design', label: 'System Design', href: '/challenges?discipline=system_design', seed: 'area-sd',      artIndex: 0 },
  { discipline: 'data_modeling', label: 'Data Modeling', href: '/challenges?discipline=data_modeling', seed: 'area-dm',      artIndex: 6 },
  { discipline: 'analytics',     label: 'AI Analytics',  href: '/challenges?discipline=analytics',     seed: 'area-ai',      artIndex: 5 },
  { discipline: 'product_sense', label: 'Product Sense', href: '/challenges?discipline=product_sense', seed: 'area-ps',      artIndex: 2 },
]

export function areaPct(completed: number, total: number) { return total > 0 ? Math.round((completed / total) * 100) : 0 }

export interface EditorialItem { kind: 'autopsy' | 'module'; id: string; title: string; href: string; readMins: number; eyebrow: string; sub?: string }

export function pickEditorial(src: { inProgress: EditorialItem[]; saved: EditorialItem[]; newest: EditorialItem[] }, n: number): EditorialItem[] {
  const out: EditorialItem[] = []; const seen = new Set<string>()
  for (const list of [src.inProgress, src.saved, src.newest]) for (const it of list) { if (out.length >= n) break; if (!seen.has(it.id)) { seen.add(it.id); out.push(it) } }
  return out
}

export interface AreaStat { discipline: PracticeArea['discipline']; total: number; completed: number }

/** Counts per discipline plus the user's completed count per discipline (challenge_attempts.status='completed'). */
export async function getAreaStats(userId: string): Promise<AreaStat[]> {
  const admin = createAdminClient()
  const [counts, { data: done }] = await Promise.all([
    getChallengeCounts({}),
    admin.from('challenge_attempts').select('challenge_id, challenges!inner(challenge_type)').eq('user_id', userId).eq('status', 'completed'),
  ])
  const typeToDiscipline = (t: string): PracticeArea['discipline'] | null =>
    t === 'algorithm' ? 'algorithm' : t === 'sql' ? 'sql' : t === 'system_design' ? 'system_design' : t === 'data_modeling' ? 'data_modeling' : ['flow', 'freeform', 'quick_take'].includes(t) ? 'product_sense' : t?.startsWith('cc') || t === 'analytics' ? 'analytics' : null
  const completedBy = new Map<string, Set<string>>()
  for (const row of (done ?? []) as unknown as Array<{ challenge_id: string; challenges: { challenge_type: string } | { challenge_type: string }[] | null }>) {
    const challengeType = Array.isArray(row.challenges) ? row.challenges[0]?.challenge_type : row.challenges?.challenge_type
    const d = typeToDiscipline(challengeType ?? ''); if (!d) continue
    if (!completedBy.has(d)) completedBy.set(d, new Set()); completedBy.get(d)!.add(row.challenge_id)
  }
  return PRACTICE_AREAS.map(a => ({ discipline: a.discipline, total: (counts as Record<string, number>)[a.discipline] ?? 0, completed: completedBy.get(a.discipline)?.size ?? 0 }))
}

/** Recent reading rows joined to titles. */
export async function getContinueReading(userId: string): Promise<{ kind: 'module' | 'autopsy'; title: string; sub: string; href: string; progress: number } | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('reading_progress').select('content_type, parent_id, content_id, progress').eq('user_id', userId).gt('progress', 0).lt('progress', 0.98).order('updated_at', { ascending: false }).limit(1).maybeSingle()
  if (!data) return null
  if (data.content_type === 'module_chapter') {
    const { data: mod } = await admin.from('learn_modules').select('id, name, chapter_count').eq('slug', data.parent_id).maybeSingle()
    if (!mod) return null
    const { data: ch } = await admin.from('learn_chapters').select('title, sort_order').eq('module_id', mod.id).eq('slug', data.content_id).maybeSingle()
    if (!ch) return null
    // learn_chapters has no per-chapter estimate; use a fixed 8-minute baseline (matches other card estimates in this pass).
    const left = Math.max(1, Math.round(8 * (1 - Number(data.progress))))
    return { kind: 'module', title: ch.title, sub: `${mod.name} · chapter ${ch.sort_order} of ${mod.chapter_count} · ${left} min left`, href: `/explore/modules/${data.parent_id}?chapter=${data.content_id}`, progress: Number(data.progress) }
  }
  const stories = await getPublishedAutopsyStories()
  const story = stories.find(s => s.companySlug === data.parent_id && s.slug === data.content_id)
  if (!story) return null
  return { kind: 'autopsy', title: story.title, sub: `Autopsy · ${story.estimatedReadTime}`, href: `/explore/autopsies/${data.parent_id}/stories/${data.content_id}`, progress: Number(data.progress) }
}

export async function getEditorialShelf(userId: string): Promise<{ featured: EditorialItem | null; items: EditorialItem[] }> {
  const admin = createAdminClient()
  const [stories, companies, bookmarks, modules, { data: recent }] = await Promise.all([
    getPublishedAutopsyStories(), getAutopsyCompanies(), getUserBookmarks(false).catch(() => []), getLearnModuleSummaries().catch(() => []),
    admin.from('reading_progress').select('content_type, parent_id, content_id, progress').eq('user_id', userId).gt('progress', 0).lt('progress', 0.98).order('updated_at', { ascending: false }).limit(6),
  ])
  const companyName = (slug: string) => companies.find(c => c.slug === slug)?.name ?? slug
  const mins = (s: string | undefined) => Number((s ?? '').match(/\d+/)?.[0] ?? 6)
  const toAutopsy = (s: (typeof stories)[number]): EditorialItem => ({ kind: 'autopsy', id: `a:${s.companySlug}/${s.slug}`, title: s.title, href: `/explore/autopsies/${s.companySlug}/stories/${s.slug}`, readMins: mins(s.estimatedReadTime), eyebrow: `Autopsy · ${companyName(s.companySlug)}`, sub: s.dek })
  const savedSet = new Set(bookmarks.map(b => `${b.companySlug}/${b.storySlug}`))
  const inProgress: EditorialItem[] = []
  for (const r of recent ?? []) {
    if (r.content_type === 'autopsy_story') { const s = stories.find(x => x.companySlug === r.parent_id && x.slug === r.content_id); if (s) inProgress.push(toAutopsy(s)) }
    else { const m = modules.find(x => x.slug === r.parent_id); if (m) inProgress.push({ kind: 'module', id: `m:${m.slug}/${r.content_id}`, title: m.name, href: `/explore/modules/${m.slug}?chapter=${r.content_id}`, readMins: 9, eyebrow: `Module · in progress` }) }
  }
  const saved = stories.filter(s => savedSet.has(`${s.companySlug}/${s.slug}`)).map(toAutopsy)
  const newest = [...stories.slice(0, 6).map(toAutopsy), ...modules.slice(0, 3).map(m => ({ kind: 'module' as const, id: `m:${m.slug}`, title: m.name, href: `/explore/modules/${m.slug}`, readMins: m.est_minutes ?? 30, eyebrow: `Module · ${m.chapter_count} chapters`, sub: m.tagline }))]
  const featured = saved[0] ?? newest.find(i => i.kind === 'autopsy') ?? null
  const items = pickEditorial({ inProgress, saved: saved.filter(s => s.id !== featured?.id), newest: newest.filter(s => s.id !== featured?.id) }, 3)
  return { featured, items }
}
