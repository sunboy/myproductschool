import type { Metadata } from 'next'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl } from '@/lib/seo/site'
import { itemListJsonLd, STUDY_PLAN_DIRECTORIES } from '@/lib/seo/directory-content'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CardGrid, V3Card, V3CtaBand } from '@/components/landing-v3/sections'

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
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'HackProduct', path: canonicalUrl('/') },
            { name: 'Study plans', path: canonicalUrl('/study-plans') },
          ]),
          itemListJsonLd('HackProduct public study plans', items),
        ]}
      />

      <V3PageHero
        eyebrow="Study plans"
        title="Sequenced paths for product-minded technical growth."
        subtitle="Public previews of the role-aware HackProduct plans that turn scattered practice into weekly progress."
      />

      <V3Section title="Browse study plan previews">
        <V3CardGrid>
          {STUDY_PLAN_DIRECTORIES.map((plan) => (
            <V3Card
              key={plan.slug}
              href={`/study-plans/${plan.slug}`}
              eyebrow={`${plan.weeks} weeks · ${plan.level}`}
              title={plan.title}
              body={plan.summary}
            />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3CtaBand
        title="Turn scattered practice into weekly progress."
        subtitle="Pick a plan, run the reps, and let Hatch keep the loop tight."
        ctas={[{ label: 'Get started', href: '/signup' }]}
      />
    </V3PageShell>
  )
}
