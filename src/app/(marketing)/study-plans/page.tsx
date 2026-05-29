import type { Metadata } from 'next'
import {
  CtaBand,
  DirectoryCard,
  DirectoryHero,
  DirectorySection,
  DirectoryShell,
} from '@/components/directory/DirectoryChrome'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl } from '@/lib/seo/site'
import { itemListJsonLd, STUDY_PLAN_DIRECTORIES } from '@/lib/seo/directory-content'

export const metadata: Metadata = buildMetadata({
  title: 'Public Study Plan Directory for AI-Era Tech Skills | HackProduct',
  description:
    'Browse public HackProduct study plan previews for engineer-to-product growth, AI product sense, staff engineering strategy, system design, and data modeling.',
  path: '/study-plans',
  keywords: ['engineer to product study plan', 'AI product sense study plan', 'system design study plan', 'staff engineer product strategy'],
})

export default function StudyPlansDirectoryPage() {
  const items = STUDY_PLAN_DIRECTORIES.map((plan) => ({
    label: plan.title,
    href: `/study-plans/${plan.slug}`,
    description: plan.summary,
  }))

  return (
    <DirectoryShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'HackProduct', path: canonicalUrl('/') },
            { name: 'Study plans', path: canonicalUrl('/study-plans') },
          ]),
          itemListJsonLd('HackProduct public study plans', items),
        ]}
      />
      <DirectoryHero
        eyebrow="Study plans"
        title="Sequenced paths for product-minded technical growth."
        description="Public previews of the role-aware HackProduct plans that turn scattered practice into weekly progress."
      />
      <DirectorySection title="Browse study plan previews">
        <div className="grid gap-4 md:grid-cols-2">
          {STUDY_PLAN_DIRECTORIES.map((plan) => (
            <DirectoryCard
              key={plan.slug}
              href={`/study-plans/${plan.slug}`}
              title={plan.title}
              description={plan.summary}
              meta={`${plan.weeks} weeks · ${plan.level}`}
            />
          ))}
        </div>
      </DirectorySection>
      <CtaBand />
    </DirectoryShell>
  )
}
