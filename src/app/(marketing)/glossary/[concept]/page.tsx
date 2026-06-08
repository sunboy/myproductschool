import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl, SITE_NAME, SITE_URL } from '@/lib/seo/site'
import { getGlossaryTerm, getSkill, GLOSSARY_DIRECTORIES } from '@/lib/seo/directory-content'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3ProseSection, V3ProseBlock, V3CtaBand } from '@/components/landing-v3/sections'

type Props = {
  params: Promise<{ concept: string }>
}

function relatedHref(slug: string) {
  if (getGlossaryTerm(slug)) return `/glossary/${slug}`
  if (getSkill(slug)) return `/skills/${slug}`
  if (slug === 'sql') return '/skills/sql'
  if (slug === 'system-design') return '/skills/system-design'
  if (slug === 'data-modeling') return '/skills/data-modeling'
  return '/glossary'
}

export function generateStaticParams() {
  return GLOSSARY_DIRECTORIES.map((term) => ({ concept: term.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { concept } = await params
  const term = getGlossaryTerm(concept)
  if (!term) return {}
  return buildMetadata({
    title: term.metaTitle,
    description: term.metaDescription,
    path: `/glossary/${term.slug}`,
    keywords: [term.term, `${term.term} definition`, 'HackProduct glossary'],
  })
}

export default async function GlossaryTermPage({ params }: Props) {
  const { concept } = await params
  const term = getGlossaryTerm(concept)
  if (!term) notFound()

  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'HackProduct', path: canonicalUrl('/') },
            { name: 'Glossary', path: canonicalUrl('/glossary') },
            { name: term.term, path: canonicalUrl(`/glossary/${term.slug}`) },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'DefinedTerm',
            name: term.term,
            description: term.definition,
            url: canonicalUrl(`/glossary/${term.slug}`),
            inDefinedTermSet: {
              '@type': 'DefinedTermSet',
              name: `${SITE_NAME} glossary`,
              url: canonicalUrl('/glossary'),
            },
            publisher: {
              '@type': 'Organization',
              name: SITE_NAME,
              url: SITE_URL,
            },
          },
        ]}
      />

      <V3PageHero
        eyebrow="Glossary term"
        title={term.term}
        subtitle={term.definition}
        ctas={[{ label: 'Practice related skills', href: '/practice' }]}
      />

      <V3ProseSection>
        <V3ProseBlock title="Why it matters">
          <p>{term.whyItMatters}</p>
        </V3ProseBlock>

        <V3ProseBlock title="Example">
          <blockquote>{term.example}</blockquote>
        </V3ProseBlock>

        <V3ProseBlock title="Related concepts">
          <div className="v3-card-grid">
            {term.related.map((slug) => (
              <Link key={slug} className="v3-card" href={relatedHref(slug)}>
                <h3>{slug.replace(/-/g, ' ')}</h3>
              </Link>
            ))}
          </div>
        </V3ProseBlock>
      </V3ProseSection>

      <V3CtaBand
        title="Start training for your next career move."
        subtitle="Run a live loop, get a score, and see the next move."
        ctas={[{ label: 'Get started', href: '/signup' }]}
      />
    </V3PageShell>
  )
}
