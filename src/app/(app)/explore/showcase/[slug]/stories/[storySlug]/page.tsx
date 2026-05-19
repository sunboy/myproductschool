import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AutopsyReaderClient } from '../../AutopsyReaderClient';
import { StoryReader } from '@/components/autopsy/StoryReader';
import { CinematicReader } from '@/components/showcase/reader/CinematicReader';
import { getReadableAppStories, isReadableAppAutopsyStory } from '@/lib/autopsies/app-library';
import { featureAutopsyToStory } from '@/lib/autopsies/showcase-adapter';
import { getLegacyCompanyTeardown } from '@/lib/autopsies/legacy-showcase';
import { getAutopsyStory, getQueuedAutopsyStories } from '@/lib/autopsies/queries';
import { getBookmarkState } from '@/lib/showcase/bookmarks';
import { getPrevNext } from '@/lib/showcase/prev-next';

export async function generateStaticParams() {
  const stories = await getQueuedAutopsyStories();
  return getReadableAppStories(stories).map(story => ({
    slug: story.companySlug,
    storySlug: story.slug,
  }));
}

interface Props {
  params: Promise<{ slug: string; storySlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, storySlug } = await params;
  const result = await getAutopsyStory(slug, storySlug);
  if (!result) return {};

  const story = result.story;
  return {
    title: story.title,
    description: story.dek,
    alternates: {
      canonical: `/explore/showcase/${slug}/stories/${storySlug}`,
    },
    openGraph: {
      title: story.title,
      description: story.dek,
      type: 'article',
    },
  };
}

export default async function StoryPage({ params }: Props) {
  const { slug, storySlug } = await params;
  const result = await getAutopsyStory(slug, storySlug);

  // --- feature_autopsy: render CinematicReader ---
  if (result && isReadableAppAutopsyStory(result.story) && result.story.storyType === 'feature_autopsy') {
    const [bookmarkState, prevNext] = await Promise.all([
      getBookmarkState(slug, storySlug),
      getPrevNext(slug, storySlug),
    ]);

    return (
      <CinematicReader
        story={result.story}
        companyName={result.company.name}
        companyAccent={result.company.accent}
        initialBookmarked={bookmarkState.bookmarked}
        prevNext={prevNext}
      />
    );
  }

  // --- company_teardown: AARRR legacy reader ---
  if (result && isReadableAppAutopsyStory(result.story) && result.story.storyType === 'company_teardown') {
    const legacy = await getLegacyCompanyTeardown(slug, storySlug);
    if (legacy?.reader === 'aarrr') {
      return <AutopsyReaderClient product={legacy.product} />;
    }
    if (legacy) {
      return (
        <StoryReader
          story={legacy.story}
          productName={legacy.product.name}
          productSlug={slug}
          backHref={`/explore/showcase/${slug}`}
          sidebarOffset={false}
          forceVisible
        />
      );
    }
  }

  // --- feature_autopsy from result but not yet teardown-branched above ---
  if (result && isReadableAppAutopsyStory(result.story)) {
    return (
      <StoryReader
        story={featureAutopsyToStory(result.story, result.company)}
        productName={result.company.name}
        productSlug={slug}
        backHref={`/explore/showcase/${slug}`}
        sidebarOffset={false}
        forceVisible
      />
    );
  }

  // --- Legacy-only path ---
  const legacy = await getLegacyCompanyTeardown(slug, storySlug);
  if (legacy?.reader === 'aarrr') {
    return <AutopsyReaderClient product={legacy.product} />;
  }
  if (legacy) {
    return (
      <StoryReader
        story={legacy.story}
        productName={legacy.product.name}
        productSlug={slug}
        backHref={`/explore/showcase/${slug}`}
        sidebarOffset={false}
        forceVisible
      />
    );
  }

  notFound();
}
