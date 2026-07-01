import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl, SITE_NAME, SITE_URL } from '@/lib/seo/site'
import { getRoleTransition, ROLE_TRANSITION_DIRECTORIES } from '@/lib/seo/directory-content'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CardGrid, V3Card, V3CtaBand } from '@/components/landing-v3/sections'

type Props = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return ROLE_TRANSITION_DIRECTORIES.map((entry) => ({ slug: entry.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const entry = getRoleTransition(slug)
  if (!entry) return {}
  return buildMetadata({
    title: entry.metaTitle,
    description: entry.metaDescription,
    path: `/role-transitions/${entry.slug}`,
    keywords: entry.keywords,
  })
}

export default async function RoleTransitionDetailPage({ params }: Props) {
  const { slug } = await params
  const entry = getRoleTransition(slug)
  if (!entry) notFound()

  const path = `/role-transitions/${entry.slug}`

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entry.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  }

  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: SITE_NAME, path: SITE_URL },
            { name: 'Role transitions', path: canonicalUrl('/role-transitions') },
            { name: entry.shortTitle, path: canonicalUrl(path) },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: entry.metaTitle,
            description: entry.metaDescription,
            url: canonicalUrl(path),
          },
          faqJsonLd,
        ]}
      />

      <V3PageHero
        eyebrow={entry.eyebrow}
        title={entry.heroTitle}
        subtitle={entry.heroSubtitle}
        ctas={[
          { label: entry.ctaLabel, href: entry.ctaHref },
          { label: entry.secondaryLabel, href: entry.secondaryHref },
        ]}
      />

      <V3Section
        eyebrow="What actually changes"
        title="The transition is not a vocabulary problem"
        subtitle="Most of the mechanics carry over. What is missing is reps at the reasoning underneath the decision."
      >
        <V3CardGrid>
          {entry.whatChanges.map((item) => (
            <V3Card key={item.title} title={item.title} body={item.body} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section
        eyebrow="FLOW"
        title="Four moves, trained in order"
        subtitle="Every product decision breaks into the same four moves. HackProduct scores each one separately so you know which move is costing you."
      >
        <V3CardGrid>
          {entry.flowTracks.map((item) => (
            <V3Card key={item.title} eyebrow={item.eyebrow} title={item.title} body={item.body} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section
        eyebrow="Why HackProduct"
        title="Built for people who already think in systems"
        subtitle="This is not a course that starts from zero. It routes existing technical judgment toward the decision."
      >
        <V3CardGrid>
          {entry.proofPoints.map((item) => (
            <V3Card key={item.title} title={item.title} body={item.body} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section eyebrow="Who this is for" title="Built for engineers, not just candidates">
        <V3CardGrid>
          {entry.audience.map((item) => (
            <V3Card key={item.title} title={item.title} body={item.body} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section eyebrow="FAQ" title={`Questions about ${entry.shortTitle.toLowerCase()}`}>
        <V3CardGrid>
          {entry.faqs.map((faq) => (
            <V3Card key={faq.q} title={faq.q} body={faq.a} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3CtaBand
        title={entry.summary}
        subtitle="A short diagnostic maps your current strengths across the six competencies HackProduct tracks, then points you at the reps built for the gap."
        ctas={[
          { label: entry.ctaLabel, href: entry.ctaHref },
          { label: entry.secondaryLabel, href: entry.secondaryHref },
        ]}
      />
    </V3PageShell>
  )
}
