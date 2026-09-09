import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppFlag } from '@/lib/config/app-flags'
import { getLearnModuleSummaries } from '@/lib/data/learn-modules'
import { getStudyPlans, getStudyPlanSummaries } from '@/lib/data/study-plans'
import { getReadableAppCompanies, getReadableAppStories } from '@/lib/autopsies/app-library'
import { getAutopsyCompanies, getPublishedAutopsyStories } from '@/lib/autopsies/queries'
import { getUserBookmarks } from '@/lib/showcase/bookmarks'
import { LibraryCatalog, type LibraryItem } from './LibraryCatalog'
import { LibraryV2 } from '@/components/density/library/LibraryV2'
import type { LibraryInput, LibraryType } from '@/lib/data/library-density'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Library',
  description: 'Guides, product autopsies, and focused study plans for stronger product and engineering interviews.',
  alternates: { canonical: '/explore' },
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ type?: string; q?: string }> }) {
  const { type, q } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const density = await getAppFlag('ui_density_v1', false)
  const [modulesResult, planCatalogResult, planDetailsResult, companiesResult, storiesResult, bookmarksResult, guideProgressResult] = await Promise.allSettled([
    getLearnModuleSummaries(),
    getStudyPlanSummaries(),
    getStudyPlans(user?.id),
    getAutopsyCompanies(),
    getPublishedAutopsyStories(),
    getUserBookmarks(true),
    user ? supabase.from('user_learn_progress').select('module_id').eq('user_id', user.id) : Promise.resolve({ data: [], error: null }),
  ])
  const modules = modulesResult.status === 'fulfilled' ? modulesResult.value : []
  const planCatalog = planCatalogResult.status === 'fulfilled' ? planCatalogResult.value : []
  const planDetails = planDetailsResult.status === 'fulfilled' ? planDetailsResult.value : []
  // getStudyPlans enriches progress but currently treats some Supabase errors as
  // empty results. Keep the throwing summary query as the availability signal and
  // fall back to its real catalog rows if enrichment returns nothing.
  const plans = planDetails.length > 0 || planCatalog.length === 0
    ? planDetails
    : planCatalog.map(plan => ({
        ...plan,
        items: [],
        item_count: plan.challenge_count ?? 0,
        chapter_count: 0,
        completed_count: 0,
        progress_percentage: 0,
        is_enrolled: false,
      }))
  const companies = companiesResult.status === 'fulfilled' ? companiesResult.value : []
  const stories = storiesResult.status === 'fulfilled' ? storiesResult.value : []
  const bookmarks = bookmarksResult.status === 'fulfilled' ? bookmarksResult.value : []
  const unavailableKinds = [
    modulesResult.status === 'rejected' ? 'guide' : null,
    planCatalogResult.status === 'rejected' ? 'plan' : null,
    storiesResult.status === 'rejected' ? 'autopsy' : null,
  ].filter(Boolean) as Array<'guide' | 'autopsy' | 'plan'>

  const completedByModule = new Map<string, number>()
  const guideProgress = guideProgressResult.status === 'fulfilled' && !guideProgressResult.value.error ? guideProgressResult.value.data ?? [] : []
  for (const row of guideProgress) completedByModule.set(row.module_id, (completedByModule.get(row.module_id) ?? 0) + 1)

  const readableCompanies = getReadableAppCompanies(companies)
  const companyBySlug = new Map(readableCompanies.map(company => [company.slug, company]))
  const savedStories = new Set(bookmarks.map(item => `${item.companySlug}/${item.storySlug}`))

  const guideItems: LibraryItem[] = modules.map(module => ({
    id: `guide:${module.id}`,
    kind: 'guide',
    progress: completedByModule.has(module.id) && module.chapter_count > 0 ? Math.min(100, Math.round((completedByModule.get(module.id)! / module.chapter_count) * 100)) : undefined,
    title: module.name,
    description: module.tagline,
    href: `/explore/modules/${module.slug}`,
    eyebrow: module.difficulty,
    meta: `${module.chapter_count} chapters · ${module.est_minutes} min`,
    accent: module.accent_color || '#2f6b4f',
    searchText: [module.name, module.tagline, module.difficulty, module.track].filter(Boolean).join(' '),
  }))

  const autopsyItems: LibraryItem[] = getReadableAppStories(stories).map(story => {
    const company = companyBySlug.get(story.companySlug)
    return {
      id: `autopsy:${story.companySlug}/${story.slug}`,
      kind: 'autopsy',
      title: story.title,
      description: story.dek,
      href: `/explore/autopsies/${story.companySlug}/stories/${story.slug}`,
      eyebrow: company?.name ?? story.companySlug.replaceAll('-', ' '),
      meta: story.estimatedReadTime,
      accent: company?.accent || '#c48a2c',
      bookmarked: savedStories.has(`${story.companySlug}/${story.slug}`),
      progressKey: `hp_reader_${story.companySlug}/${story.slug}`,
      searchText: [story.title, story.dek, company?.name, ...story.tags].filter(Boolean).join(' '),
    }
  })

  const planItems: LibraryItem[] = plans.map(plan => ({
    id: `plan:${plan.id}`,
    kind: 'plan',
    title: plan.title,
    description: plan.description ?? 'A focused sequence of lessons and practice challenges.',
    href: `/explore/plans/${plan.slug}`,
    eyebrow: plan.is_enrolled ? 'Enrolled' : (plan.difficulty || 'Study plan'),
    meta: [plan.estimated_hours ? `${plan.estimated_hours} hours` : null, plan.challenge_count ? `${plan.challenge_count} challenges` : null].filter(Boolean).join(' · '),
    accent: '#8c6830',
    progress: plan.is_enrolled ? Math.round(plan.progress_percentage ?? 0) : undefined,
    searchText: [plan.title, plan.description, plan.difficulty, ...(plan.role_tags ?? []), ...(plan.disciplines ?? [])].filter(Boolean).join(' '),
  }))

  if (density) {
    const readingProgress = user
      ? await createAdminClient()
          .from('reading_progress')
          .select('content_type, parent_id, content_id, progress')
          .eq('user_id', user.id)
          .gt('progress', 0)
          .limit(20)
          .then(r => r.data ?? [])
      : []

    const input: LibraryInput = {
      guides: modules.map(module => ({
        kind: 'guide',
        id: module.id,
        slug: module.slug,
        title: module.name,
        href: `/explore/modules/${module.slug}`,
        chapters: module.chapter_count,
        completed: completedByModule.get(module.id) ?? 0,
        minutes: module.est_minutes,
        tagline: module.tagline,
      })),
      plans: plans.map(plan => ({
        kind: 'plan',
        id: plan.id,
        slug: plan.slug,
        title: plan.title,
        href: `/explore/plans/${plan.slug}`,
        reps: plan.item_count ?? plan.challenge_count ?? 0,
        done: plan.completed_count ?? 0,
        move: plan.move_tag ?? null,
        enrolled: !!plan.is_enrolled,
      })),
      stories: getReadableAppStories(stories).map(story => {
        const company = companyBySlug.get(story.companySlug)
        return {
          kind: 'autopsy' as const,
          id: `${story.companySlug}/${story.slug}`,
          companySlug: story.companySlug,
          storySlug: story.slug,
          title: story.title,
          dek: story.dek,
          href: `/explore/autopsies/${story.companySlug}/stories/${story.slug}`,
          readTime: story.estimatedReadTime,
          company: company?.name ?? story.companySlug.replaceAll('-', ' '),
          saved: savedStories.has(`${story.companySlug}/${story.slug}`),
          progress: 0,
        }
      }),
      readingProgress,
    }
    return <LibraryV2 input={input} type={(type as LibraryType) ?? 'all'} q={q ?? null} />
  }

  return <LibraryCatalog items={[...guideItems, ...autopsyItems, ...planItems]} unavailableKinds={unavailableKinds} savedUnavailable={bookmarksResult.status === 'rejected'} />
}
