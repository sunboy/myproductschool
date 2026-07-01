import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl } from '@/lib/seo/site'
import { COMPANY_DIRECTORIES, getCompany } from '@/lib/seo/directory-content'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import {
  V3PageHero,
  V3Section,
  V3CardGrid,
  V3Card,
  V3ProseSection,
  V3ProseBlock,
  V3CtaBand,
} from '@/components/landing-v3/sections'

type Props = {
  params: Promise<{ slug: string }>
}

const RECOMMENDED_HUBS = [
  {
    href: '/skills/product-sense',
    title: 'Product sense',
    body: 'Practice ambiguous product decisions and metric diagnosis.',
  },
  {
    href: '/skills/system-design',
    title: 'System design',
    body: 'Practice architecture, scale, reliability, and trade-offs.',
  },
  {
    href: '/interviews/live-ai-interviews',
    title: 'Live AI interviews',
    body: 'Run voice-to-voice mock interviews with Hatch follow-ups.',
  },
]

export function generateStaticParams() {
  return COMPANY_DIRECTORIES.map((company) => ({ slug: company.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const company = getCompany(slug)
  if (!company) return {}
  return buildMetadata({
    title: company.metaTitle,
    description: company.metaDescription,
    path: `/companies/${company.slug}`,
    keywords: [`${company.name} interview prep`, `${company.name} product sense`, `${company.name} system design`, `${company.name} SQL interview`],
  })
}

export default async function CompanyDirectoryDetailPage({ params }: Props) {
  const { slug } = await params
  const company = getCompany(slug)
  if (!company) notFound()

  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'HackProduct', path: canonicalUrl('/') },
            { name: 'Companies', path: canonicalUrl('/companies') },
            { name: company.name, path: canonicalUrl(`/companies/${company.slug}`) },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${company.name} interview prep`,
            description: company.summary,
            url: canonicalUrl(`/companies/${company.slug}`),
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: company.practiceAreas.map((area, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: area,
              })),
            },
          },
        ]}
      />

      <V3PageHero
        eyebrow={`${company.name} interview prep`}
        title={`Practice for ${company.name}-style product and technical interviews.`}
        subtitle={`${company.summary} ${company.interviewStyle}`}
        ctas={[
          { label: company.ctaLabel ?? 'Start free', href: company.ctaHref ?? '/login' },
          {
            label: company.secondaryLabel ?? 'Browse practice previews',
            href: company.secondaryHref ?? '/practice',
          },
        ]}
      />

      <V3Section title="Roles and signals">
        <V3ProseSection>
          <V3ProseBlock title="Common roles">
            <ul>
              {company.roles.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </V3ProseBlock>
          <V3ProseBlock title="Practice areas">
            <ul>
              {company.practiceAreas.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </V3ProseBlock>
        </V3ProseSection>
      </V3Section>

      <V3Section eyebrow="Sample prompts" title={`Representative ${company.name} questions`}>
        <V3CardGrid>
          {company.sampleQuestions.map((item) => (
            <V3Card key={item} title={item} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section title="Recommended HackProduct hubs">
        <V3CardGrid>
          {RECOMMENDED_HUBS.map((hub) => (
            <V3Card key={hub.href} href={hub.href} title={hub.title} body={hub.body} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3CtaBand
        title={`Train for ${company.name} with live feedback.`}
        subtitle="Public previews show the map. The app gives you reps, Hatch follow-ups, FLOW feedback, weak-move drills, and saved proof of progress."
        ctas={[{ label: company.ctaLabel ?? 'Start a free rep', href: company.ctaHref ?? '/login' }]}
      />
    </V3PageShell>
  )
}
