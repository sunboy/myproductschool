import type { Metadata } from 'next'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl } from '@/lib/seo/site'
import { GLOSSARY_DIRECTORIES, itemListJsonLd } from '@/lib/seo/directory-content'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CardGrid, V3Card, V3CtaBand } from '@/components/landing-v3/sections'

export const metadata: Metadata = buildMetadata({
  title: 'Product, System Design, SQL, and Data Glossary | HackProduct',
  description:
    'A public glossary for product sense, system design, data modeling, SQL, and AI-era engineering interview concepts.',
  path: '/glossary',
  keywords: ['product sense glossary', 'system design glossary', 'data modeling glossary', 'product analytics glossary'],
})

export default function GlossaryDirectoryPage() {
  const items = GLOSSARY_DIRECTORIES.map((term) => ({
    label: term.term,
    href: `/glossary/${term.slug}`,
    description: term.definition,
  }))

  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'HackProduct', path: canonicalUrl('/') },
            { name: 'Glossary', path: canonicalUrl('/glossary') },
          ]),
          itemListJsonLd('HackProduct glossary', items),
        ]}
      />

      <V3PageHero
        eyebrow="Glossary"
        title="A machine-readable map of product-minded tech concepts."
        subtitle="Definitions, examples, and practice links for the vocabulary behind product sense, systems, data, SQL, coding, and AI-era interviews."
      />

      <V3Section title="Browse glossary terms">
        <V3CardGrid>
          {GLOSSARY_DIRECTORIES.map((term) => (
            <V3Card
              key={term.slug}
              href={`/glossary/${term.slug}`}
              title={term.term}
              body={term.definition}
            />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3CtaBand
        title="Turn vocabulary into judgment."
        subtitle="Run a live loop, get a score, and see the next move."
        ctas={[{ label: 'Get started', href: '/signup' }]}
      />
    </V3PageShell>
  )
}
