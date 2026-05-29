import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  CtaBand,
  DirectoryHero,
  DirectorySection,
  DirectoryShell,
} from '@/components/directory/DirectoryChrome'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl, SITE_NAME, SITE_URL } from '@/lib/seo/site'
import { getGlossaryTerm, getSkill, GLOSSARY_DIRECTORIES } from '@/lib/seo/directory-content'

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
    <DirectoryShell>
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
      <DirectoryHero
        eyebrow="Glossary term"
        title={term.term}
        description={term.definition}
        ctaHref="/practice"
        ctaLabel="Practice related skills"
      />
      <DirectorySection title="Why it matters">
        <p className="max-w-3xl text-lg leading-8 text-on-surface-variant">{term.whyItMatters}</p>
      </DirectorySection>
      <DirectorySection shaded title="Example">
        <blockquote className="max-w-4xl rounded-2xl bg-surface-container-lowest p-6 font-headline text-2xl font-semibold leading-snug ring-1 ring-outline-variant/35">
          {term.example}
        </blockquote>
      </DirectorySection>
      <DirectorySection title="Related concepts">
        <div className="flex flex-wrap gap-3">
          {term.related.map((slug) => (
            <Link
              key={slug}
              href={relatedHref(slug)}
              className="rounded-full bg-primary-fixed/70 px-4 py-2 text-sm font-bold text-on-primary-fixed no-underline hover:bg-primary-fixed"
            >
              {slug.replace(/-/g, ' ')}
            </Link>
          ))}
        </div>
      </DirectorySection>
      <CtaBand />
    </DirectoryShell>
  )
}
