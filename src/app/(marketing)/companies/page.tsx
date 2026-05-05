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
import { COMPANY_DIRECTORIES, itemListJsonLd } from '@/lib/seo/directory-content'

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
    <DirectoryShell>
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
      <DirectoryHero
        eyebrow="Company prep"
        title="Practice the interview style behind each top tech loop."
        description="Public company pages organize product sense, systems, data, SQL, and coding practice around the signals each interview loop tends to reward."
      />
      <DirectorySection title="Company directories">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {COMPANY_DIRECTORIES.map((company) => (
            <DirectoryCard
              key={company.slug}
              href={`/companies/${company.slug}`}
              title={company.name}
              description={company.summary}
              meta={company.roles.slice(0, 2).join(' · ')}
            />
          ))}
        </div>
      </DirectorySection>
      <CtaBand />
    </DirectoryShell>
  )
}
