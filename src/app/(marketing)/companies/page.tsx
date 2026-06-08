import type { Metadata } from 'next'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl } from '@/lib/seo/site'
import { COMPANY_DIRECTORIES, itemListJsonLd } from '@/lib/seo/directory-content'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CardGrid, V3Card, V3CtaBand } from '@/components/landing-v3/sections'

export const metadata: Metadata = buildMetadata({
  title: 'Company Interview Prep Directory | HackProduct',
  description:
    'Browse company-specific interview prep for Meta, Google, Amazon, Stripe, Microsoft, and product-minded technical roles.',
  path: '/companies',
  keywords: ['company interview prep', 'Meta product sense interview', 'Google system design interview', 'Stripe engineering interview'],
})

export default function CompaniesDirectoryPage() {
  const items = COMPANY_DIRECTORIES.map((company) => ({
    label: company.name,
    href: `/companies/${company.slug}`,
    description: company.summary,
  }))

  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'HackProduct', path: canonicalUrl('/') },
            { name: 'Companies', path: canonicalUrl('/companies') },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Company interview prep directory',
            description: 'Public HackProduct directory for company-specific interview practice.',
            url: canonicalUrl('/companies'),
          },
          itemListJsonLd('HackProduct company interview directories', items),
        ]}
      />

      <V3PageHero
        eyebrow="Company prep"
        title="Practice the interview style behind each top tech loop."
        subtitle="Public company pages organize product sense, systems, data, SQL, and coding practice around the signals each interview loop tends to reward."
      />

      <V3Section title="Company directories">
        <V3CardGrid>
          {COMPANY_DIRECTORIES.map((company) => (
            <V3Card
              key={company.slug}
              href={`/companies/${company.slug}`}
              eyebrow={company.roles.slice(0, 2).join(' · ')}
              title={company.name}
              body={company.summary}
            />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3CtaBand
        title="Start training for your next career move."
        subtitle="Public previews show the map. The app gives you reps, Hatch follow-ups, FLOW feedback, weak-move drills, and saved proof of progress."
        ctas={[{ label: 'Start a free rep', href: '/login' }]}
      />
    </V3PageShell>
  )
}
