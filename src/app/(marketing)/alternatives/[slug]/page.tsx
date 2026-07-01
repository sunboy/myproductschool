import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl } from '@/lib/seo/site'
import { getAlternative, ALTERNATIVE_DIRECTORIES } from '@/lib/seo/directory-content'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CardGrid, V3Card, V3CtaBand } from '@/components/landing-v3/sections'

type Props = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return ALTERNATIVE_DIRECTORIES.map((entry) => ({ slug: entry.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const entry = getAlternative(slug)
  if (!entry) return {}
  return buildMetadata({
    title: entry.metaTitle,
    description: entry.metaDescription,
    path: `/alternatives/${entry.slug}`,
    keywords: entry.keywords,
  })
}

export default async function AlternativeDetailPage({ params }: Props) {
  const { slug } = await params
  const entry = getAlternative(slug)
  if (!entry) notFound()

  const path = `/alternatives/${entry.slug}`

  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'HackProduct', path: canonicalUrl('/') },
            { name: 'Alternatives', path: canonicalUrl('/alternatives/leetcode') },
            { name: `${entry.competitor} alternative`, path: canonicalUrl(path) },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: entry.metaTitle,
            description: entry.summary,
            url: canonicalUrl(path),
          },
        ]}
      />

      <V3PageHero
        eyebrow={entry.eyebrow}
        title={entry.heroTitle}
        subtitle={entry.summary}
        ctas={[
          { label: entry.ctaLabel, href: entry.ctaHref },
          { label: entry.secondaryLabel, href: entry.secondaryHref },
        ]}
      />

      <V3Section
        title={`HackProduct vs. ${entry.competitor}`}
        subtitle="Where each tool earns its place across the AI-era interview loop."
      >
        <V3CardGrid>
          {entry.comparisons.map(([dimension, competitor, hackproduct]) => (
            <V3Card
              key={dimension}
              eyebrow={dimension}
              title={`HackProduct: ${hackproduct}`}
              body={`${entry.competitor}: ${competitor}`}
            />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section title="When HackProduct is the better fit">
        <V3CardGrid>
          {entry.betterFit.map((item) => (
            <V3Card key={item} title={item} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3CtaBand
        title={entry.closingTitle}
        subtitle={entry.closingSubtitle}
        ctas={[
          { label: entry.ctaLabel, href: entry.ctaHref },
          { label: entry.secondaryLabel, href: entry.secondaryHref },
        ]}
      />
    </V3PageShell>
  )
}
