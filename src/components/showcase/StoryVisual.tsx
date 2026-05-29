'use client';

import { useState } from 'react';
import { CompanyArt } from './CompanyArt';
import { getAutopsyImage, getProminentStoryImage } from '@/lib/autopsies/images';
import type { AutopsyCompanyWithStories, AutopsyImage, FeatureAutopsy } from '@/lib/autopsies/types';

interface StoryVisualProps {
  story: FeatureAutopsy;
  company?: Pick<AutopsyCompanyWithStories, 'name' | 'slug' | 'accent'>;
  image?: AutopsyImage;
  variant?: 'hero' | 'tile' | 'rail' | 'inline';
  priority?: boolean;
}

export function StoryVisual({
  story,
  company,
  image,
  variant = 'tile',
  priority = false,
}: StoryVisualProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const visual = image
    ?? (story.storyType === 'feature_autopsy'
      ? getAutopsyImage(story, 'hero') ?? getProminentStoryImage(story)
      : variant === 'hero'
        ? getProminentStoryImage(story)
        : undefined);
  const companyName = company?.name ?? story.companySlug;
  const companySlug = company?.slug ?? story.companySlug;

  if (!visual || imageFailed) {
    return (
      <CompanyArt
        name={companyName}
        slug={companySlug}
        accent={company?.accent}
        variant={variant === 'hero' ? 'hero' : 'tile'}
      />
    );
  }

  return (
    <figure className={`sc-story-visual sc-story-visual--${variant} sc-story-visual--${story.storyType}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={visual.src}
        alt={visual.alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setImageFailed(true)}
      />
      <figcaption className="sr-only">{visual.caption}</figcaption>
    </figure>
  );
}
