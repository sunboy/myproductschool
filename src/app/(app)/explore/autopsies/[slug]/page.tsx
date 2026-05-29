import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppLegacyCompanyHub } from '@/components/autopsy/AppAutopsyShowcase';
import { getReadableAppCompanies, getReadableAppStories } from '@/lib/autopsies/app-library';
import { getAutopsyCompanies, getAutopsyCompany } from '@/lib/autopsies/queries';
import { getShowcaseProduct } from '@/lib/data/showcase';
import { CompanyHubHeader } from '@/components/showcase/company/CompanyHubHeader';
import { CompanyStoryRail } from '@/components/showcase/company/CompanyStoryRail';
import { RelatedCompanies } from '@/components/showcase/company/RelatedCompanies';
import { AppBreadcrumbs } from '@/components/navigation/AppBreadcrumbs';

export async function generateStaticParams() {
  const companies = await getAutopsyCompanies();
  return getReadableAppCompanies(companies).map(company => ({ slug: company.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const company = await getAutopsyCompany(slug);
  if (!company) return {};
  return {
    title: `${company.name} — Product Autopsies`,
    description: company.thesis || company.dek,
    alternates: {
      canonical: `/explore/autopsies/${slug}`,
    },
  };
}

export default async function ShowcaseProductPage({ params }: Props) {
  const { slug } = await params;
  const [company, legacyProduct, allCompanies] = await Promise.all([
    getAutopsyCompany(slug),
    getShowcaseProduct(slug).catch(() => null),
    getAutopsyCompanies(),
  ]);

  // New showcase hub: company has readable feature_autopsy stories
  if (company) {
    const readableStories = getReadableAppStories(company.stories);
    const teardownStories = readableStories.filter(s => s.storyType === 'company_teardown');
    const featureStories = readableStories.filter(s => s.storyType === 'feature_autopsy');

    if (readableStories.length > 0) {
      return (
        <div className="min-h-screen">
          <CompanyHubHeader company={company} storyCount={readableStories.length} />
          <div className="sc-page-narrow">
            <AppBreadcrumbs
              className="mb-6"
              items={[
                { label: 'Explore', href: '/explore' },
                { label: 'Autopsies', href: '/explore/autopsies' },
                { label: company.name },
              ]}
            />
            <CompanyStoryRail
              stories={teardownStories}
              companyName={company.name}
              companyAccent={company.accent}
              eyebrow="Full product"
              title="Teardowns"
              subtitle="The whole product, one read."
              variant="grid"
            />
            <CompanyStoryRail
              stories={featureStories}
              companyName={company.name}
              companyAccent={company.accent}
              eyebrow="One specific feature"
              title="Feature autopsies"
              subtitle="Decisions, mechanisms, evidence, one feature deep."
              variant="rows"
            />
          </div>
          <RelatedCompanies companies={allCompanies} currentSlug={slug} />
        </div>
      );
    }
  }

  // Legacy-only company (no feature_autopsy data)
  if (legacyProduct?.stories?.length) {
    return <AppLegacyCompanyHub product={{ ...legacyProduct, decisions: [] }} />;
  }

  notFound();
}
