import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  BulletGrid,
  CtaBand,
  DirectoryHero,
  DirectorySection,
  DirectoryShell,
  PillList,
} from '@/components/directory/DirectoryChrome'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl } from '@/lib/seo/site'
import { COMPANY_DIRECTORIES, getCompany } from '@/lib/seo/directory-content'

type Props = {
  params: Promise<{ slug: string }>
}

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
    <DirectoryShell>
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
      <DirectoryHero
        eyebrow={`${company.name} interview prep`}
        title={`Practice for ${company.name}-style product and technical interviews.`}
        description={`${company.summary} ${company.interviewStyle}`}
        secondaryHref="/practice"
        secondaryLabel="Browse practice previews"
      />
      <DirectorySection title="Roles and signals">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 font-headline text-2xl font-semibold">Common roles</h2>
            <PillList items={company.roles} />
          </div>
          <div>
            <h2 className="mb-3 font-headline text-2xl font-semibold">Practice areas</h2>
            <PillList items={company.practiceAreas} />
          </div>
        </div>
      </DirectorySection>
      <DirectorySection shaded eyebrow="Sample prompts" title={`Representative ${company.name} questions`}>
        <BulletGrid items={company.sampleQuestions} />
      </DirectorySection>
      <DirectorySection title="Recommended HackProduct hubs">
        <div className="grid gap-3 md:grid-cols-3">
          <Link className="rounded-xl bg-surface-container-lowest p-5 no-underline ring-1 ring-outline-variant/35 hover:ring-primary/35" href="/skills/product-sense">
            <div className="font-headline text-xl font-semibold text-on-surface">Product sense</div>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">Practice ambiguous product decisions and metric diagnosis.</p>
          </Link>
          <Link className="rounded-xl bg-surface-container-lowest p-5 no-underline ring-1 ring-outline-variant/35 hover:ring-primary/35" href="/skills/system-design">
            <div className="font-headline text-xl font-semibold text-on-surface">System design</div>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">Practice architecture, scale, reliability, and trade-offs.</p>
          </Link>
          <Link className="rounded-xl bg-surface-container-lowest p-5 no-underline ring-1 ring-outline-variant/35 hover:ring-primary/35" href="/interviews/live-ai-interviews">
            <div className="font-headline text-xl font-semibold text-on-surface">Live AI interviews</div>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">Run voice-to-voice mock interviews with Hatch follow-ups.</p>
          </Link>
        </div>
      </DirectorySection>
      <CtaBand title={`Train for ${company.name} with live feedback.`} />
    </DirectoryShell>
  )
}
