import Link from 'next/link';
import { StoryVisual } from '@/components/showcase/StoryVisual';
import type { FeatureAutopsy } from '@/lib/autopsies/types';

interface StoryTileProps {
  story: FeatureAutopsy;
  companyName: string;
  companyAccent?: string;
  index?: number;
  size?: 'compact' | 'regular' | 'large';
  showCompany?: boolean;
}

function storyKindLabel(story: FeatureAutopsy) {
  return story.storyType === 'company_teardown' ? 'Company teardown' : 'Feature autopsy';
}

function getStoryHref(story: FeatureAutopsy) {
  return `/explore/showcase/${story.companySlug}/stories/${story.slug}`;
}

export function StoryTile({
  story,
  companyName,
  companyAccent,
  size = 'regular',
  showCompany = true,
}: StoryTileProps) {
  return (
    <Link href={getStoryHref(story)} className="sc-tile">
      <div className="sc-tile-art">
        <StoryVisual
          story={story}
          company={{ name: companyName, slug: story.companySlug, accent: companyAccent ?? '#4a7c59' }}
          variant={size === 'large' ? 'hero' : 'tile'}
        />
        <div className="sc-tile-art-fade" />
        <span className="sc-tile-corner">
          <span
            className="sc-dot"
            style={{ background: companyAccent ?? 'var(--sc-accent)' }}
            aria-hidden="true"
          />
          {storyKindLabel(story)}
        </span>
      </div>
      <div className="sc-tile-body">
        <div className="sc-tile-meta">
          {showCompany && (
            <>
              <span style={{ color: companyAccent ?? 'var(--sc-accent)' }}>{companyName}</span>
              <span className="dot" />
            </>
          )}
          <span>{story.estimatedReadTime}</span>
        </div>
        <div className="sc-tile-title" style={{ fontSize: size === 'large' ? 24 : undefined }}>
          {story.title}
        </div>
        {size !== 'compact' && <div className="sc-tile-dek">{story.dek}</div>}
      </div>
    </Link>
  );
}

interface StoryRowProps {
  story: FeatureAutopsy;
  companyName: string;
  companyAccent?: string;
}

export function StoryRow({ story, companyName, companyAccent }: StoryRowProps) {
  return (
    <Link href={getStoryHref(story)} className="sc-row-tile">
      <div className="sc-row-tile-art">
        <StoryVisual
          story={story}
          company={{ name: companyName, slug: story.companySlug, accent: companyAccent ?? '#4a7c59' }}
          variant="rail"
        />
      </div>
      <div className="sc-row-tile-body">
        <div className="sc-row-tile-meta">
          <span style={{ color: companyAccent ?? 'var(--sc-accent)' }}>{companyName}</span>
          <span aria-hidden="true">·</span>
          <span>{storyKindLabel(story)}</span>
        </div>
        <h3 className="sc-row-tile-title">{story.title}</h3>
        <p className="sc-row-tile-dek">{story.dek}</p>
      </div>
      <div className="sc-row-tile-right">
        <span>{story.estimatedReadTime}</span>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18 }}
          aria-hidden="true"
        >
          arrow_forward
        </span>
      </div>
    </Link>
  );
}
