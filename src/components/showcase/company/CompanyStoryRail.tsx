import { StoryRow, StoryTile } from '@/components/showcase/index/StoryTile';
import type { FeatureAutopsy } from '@/lib/autopsies/types';

interface CompanyStoryRailProps {
  stories: FeatureAutopsy[];
  companyName: string;
  companyAccent?: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  variant?: 'grid' | 'rows';
}

export function CompanyStoryRail({
  stories,
  companyName,
  companyAccent,
  eyebrow,
  title,
  subtitle,
  variant = 'rows',
}: CompanyStoryRailProps) {
  if (stories.length === 0) return null;

  return (
    <section className="sc-company-section">
      <div className="sc-section-heading">
        <div>
          <div className="sc-eyebrow">{eyebrow}</div>
          <h2 className="sc-h2">{title}</h2>
          <div className="sc-section-subtitle">{subtitle}</div>
        </div>
        <span className="sc-chip sc-chip--ghost">{stories.length} {stories.length === 1 ? 'story' : 'stories'}</span>
      </div>
      {variant === 'grid' ? (
        <div className="sc-company-story-grid">
          {stories.map(story => (
            <StoryTile
              key={story.slug}
              story={story}
              companyName={companyName}
              companyAccent={companyAccent}
              showCompany={false}
            />
          ))}
        </div>
      ) : (
        <div className="sc-company-story-rows">
          {stories.map(story => (
            <StoryRow
              key={story.slug}
              story={story}
              companyName={companyName}
              companyAccent={companyAccent}
            />
          ))}
        </div>
      )}
    </section>
  );
}
