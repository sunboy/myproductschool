import type { Metadata } from 'next'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CtaBand } from '@/components/landing-v3/sections'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl } from '@/lib/seo/site'
import { itemListJsonLd, PRACTICE_DIRECTORIES } from '@/lib/seo/directory-content'
import { PracticeCatalogClient, type PracticeCatalogItem } from './PracticeCatalogClient'

export const metadata: Metadata = buildMetadata({
  title: 'Practice Catalog for Career Skills | HackProduct',
  description:
    'Browse public HackProduct challenge previews by discipline. Open the full app for Hatch coaching, scoring, and saved progress.',
  path: '/practice',
  keywords: ['product sense practice questions', 'system design practice questions', 'SQL product analytics practice', 'career skills practice'],
})

export default function PracticeDirectoryPage() {
  const items = PRACTICE_DIRECTORIES.map((practice) => ({
    label: practice.title,
    href: `/practice/${practice.slug}`,
    description: practice.summary,
  }))
  const catalogItems: PracticeCatalogItem[] = PRACTICE_DIRECTORIES.map((practice) => ({
    slug: practice.slug,
    title: practice.title,
    summary: practice.summary,
    discipline: practice.discipline,
    href: `/practice/${practice.slug}`,
  }))

  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'HackProduct', path: canonicalUrl('/') },
            { name: 'Practice', path: canonicalUrl('/practice') },
          ]),
          itemListJsonLd('HackProduct public practice previews', items),
        ]}
      />
      <V3PageHero
        eyebrow="Practice catalog"
        title="Find your next challenge."
        subtitle="Build your skills in product, systems, data, SQL, coding, and AI analytics. Choose a preview, explore the problem, and open the workspace when you are ready."
        ctas={[{ label: 'Start a free challenge', href: '/login?returnTo=/challenges' }]}
      />
      <V3Section
        eyebrow="Explore the problems"
        title="What would you like to work on?"
        subtitle="Read the scenario and see what you will learn. Sign in to work through it with Hatch and save your progress."
      >
        <PracticeCatalogClient items={catalogItems} />
      </V3Section>
      <V3CtaBand
        title="Build skills for your next career move."
        subtitle="Get thoughtful feedback on your work, ask Hatch follow-up questions, and continue from where you left off."
        ctas={[{ label: 'Start a free challenge', href: '/login?returnTo=/challenges' }]}
      />
    </V3PageShell>
  )
}
