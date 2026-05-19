import Link from 'next/link';
import { CompanyArt } from '@/components/showcase/CompanyArt';
import { getReadableAppCompanies } from '@/lib/autopsies/app-library';
import type { AutopsyCompanyWithStories } from '@/lib/autopsies/types';

interface RelatedCompaniesProps {
  companies: AutopsyCompanyWithStories[];
  currentSlug: string;
}

export function RelatedCompanies({ companies, currentSlug }: RelatedCompaniesProps) {
  const related = getReadableAppCompanies(companies)
    .filter(company => company.slug !== currentSlug)
    .slice(0, 5);

  if (related.length === 0) return null;

  return (
    <section className="sc-related-companies">
      <div className="sc-section-heading">
        <div>
          <div className="sc-eyebrow">Same shelf</div>
          <h2 className="sc-h2">Related companies</h2>
        </div>
      </div>
      <div className="sc-related-grid">
        {related.map(company => (
          <Link key={company.slug} href={`/explore/showcase/${company.slug}`} className="sc-related-card">
            <div className="sc-related-card__art">
              <CompanyArt
                name={company.name}
                slug={company.slug}
                accent={company.accent}
                variant="mini"
              />
            </div>
            <div>
              <strong>
                <span className="sc-dot" style={{ background: company.accent }} aria-hidden="true" />
                {company.name}
              </strong>
              <small>{company.stories.length} {company.stories.length === 1 ? 'story' : 'stories'}</small>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
