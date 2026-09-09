import { Suspense } from 'react'
import { EditorialCard } from '@/components/density/EditorialCard'
import { Text } from '@/design'
import { LibraryChips } from './LibraryChips'
import { LibraryShelf } from './LibraryShelf'
import { buildLibraryShelves, filterByType, readMins, type LibraryInput, type LibraryType } from '@/lib/data/library-density'

export function LibraryV2({ input, type, q }: { input: LibraryInput; type: LibraryType; q: string | null }) {
  const filtered = filterByType(type, input)
  const query = (q ?? '').trim().toLowerCase()
  const match = (t: string) => !query || t.toLowerCase().includes(query)
  const unfiltered = type === 'all' && !query
  const shelves = buildLibraryShelves({ ...input, guides: filtered.guides.filter(g => match(`${g.title} ${g.tagline}`)), plans: filtered.plans.filter(p => match(p.title)), stories: filtered.stories.filter(s => match(`${s.title} ${s.dek} ${s.company}`)) }, { extractFeatured: unfiltered })
  // Chip counts always describe the whole library, not the current filter.
  const totalCounts = buildLibraryShelves(input).counts
  const showFeatured = unfiltered && shelves.featured
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-4 sm:px-6">
      <div className="mb-2.5 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <Text variant="h2" as="h1" className="leading-none">Library{query ? <span className="ml-2 font-body text-body font-text text-ink-secondary">results for &ldquo;{q}&rdquo;</span> : null}</Text>
        <Suspense><LibraryChips counts={totalCounts} /></Suspense>
      </div>
      {showFeatured && <EditorialCard href={shelves.featured!.href} eyebrow={`Saved for you · Autopsies`} title={shelves.featured!.title} sub={shelves.featured!.dek} meta={`${shelves.featured!.company} · ${readMins(shelves.featured!.readTime)} min read`} className="mb-3" testId="lib-featured" />}
      <LibraryShelf testId="shelf-learning" title="Your learning" moreHref="/explore/modules" moreLabel="Continue where you left off →" items={shelves.yourLearning} />
      <LibraryShelf testId="shelf-plans" title="Study plans" moreHref="/explore/plans" moreLabel={`All ${shelves.counts.plans} →`} items={shelves.studyPlans} />
      <LibraryShelf testId="shelf-modules" title="Modules" moreHref="/explore/modules" moreLabel="All guides →" items={shelves.modules} />
      <LibraryShelf testId="shelf-autopsies" title="Autopsies" moreHref="/explore/autopsies" moreLabel={`All ${shelves.counts.autopsies} →`} items={shelves.autopsies} />
      {shelves.counts.all === 0 && <Text variant="ui" tone="secondary" className="py-10 text-center">Nothing matches. Try another word or clear the filter.</Text>}
    </div>
  )
}
