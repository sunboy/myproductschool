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
import { GLOSSARY_DIRECTORIES, itemListJsonLd } from '@/lib/seo/directory-content'

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
    <DirectoryShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'HackProduct', path: canonicalUrl('/') },
            { name: 'Glossary', path: canonicalUrl('/glossary') },
          ]),
          itemListJsonLd('HackProduct glossary', items),
        ]}
      />
      <DirectoryHero
        eyebrow="Glossary"
        title="A machine-readable map of product-minded tech concepts."
        description="Definitions, examples, and practice links for the vocabulary behind product sense, systems, data, SQL, coding, and AI-era interviews."
      />
      <DirectorySection title="Browse glossary terms">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {GLOSSARY_DIRECTORIES.map((term) => (
            <DirectoryCard
              key={term.slug}
              href={`/glossary/${term.slug}`}
              title={term.term}
              description={term.definition}
            />
          ))}
        </div>
      </DirectorySection>
      <CtaBand />
    </DirectoryShell>
  )
}
