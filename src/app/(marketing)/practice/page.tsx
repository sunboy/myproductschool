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
import { itemListJsonLd, PRACTICE_DIRECTORIES } from '@/lib/seo/directory-content'

export const metadata: Metadata = buildMetadata({
  title: 'Practice Directory for Product Sense, Systems, SQL, Data, and Coding | HackProduct',
  description:
    'Browse public HackProduct practice previews for product sense, system design, data modeling, SQL, coding, and AI-era interview scenarios.',
  path: '/practice',
  keywords: ['product sense practice questions', 'system design practice questions', 'SQL product analytics practice', 'coding interview practice'],
})

export default function PracticeDirectoryPage() {
  const items = PRACTICE_DIRECTORIES.map((practice) => ({
    label: practice.title,
    href: `/practice/${practice.slug}`,
    description: practice.summary,
  }))

  return (
    <DirectoryShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'HackProduct', path: canonicalUrl('/') },
            { name: 'Practice', path: canonicalUrl('/practice') },
          ]),
          itemListJsonLd('HackProduct public practice previews', items),
        ]}
      />
      <DirectoryHero
        eyebrow="Practice previews"
        title="See the rep before you enter the gym."
        description="Public challenge previews show the scenario, skill focus, and prompts. The gated app adds the workspace, Hatch coaching, grading, and saved progress."
      />
      <DirectorySection title="Browse public practice previews">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PRACTICE_DIRECTORIES.map((practice) => (
            <DirectoryCard
              key={practice.slug}
              href={`/practice/${practice.slug}`}
              title={practice.title}
              description={practice.summary}
              meta={practice.discipline}
            />
          ))}
        </div>
      </DirectorySection>
      <CtaBand />
    </DirectoryShell>
  )
}
