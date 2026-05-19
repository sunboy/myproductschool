import type { Metadata } from 'next';
import { ShowcaseIndexExperience } from '@/components/showcase/index/ShowcaseIndexExperience';
import { getReadableAppCompanies, getReadableAppStories } from '@/lib/autopsies/app-library';
import { getAutopsyCompanies, getQueuedAutopsyStories } from '@/lib/autopsies/queries';
import { getAllReadingPaths } from '@/lib/showcase/reading-paths';

export const metadata: Metadata = {
  title: 'Product Autopsies',
  description: 'Dissect the decisions behind the products everyone uses. Feature autopsies across the companies that shaped modern software.',
  alternates: {
    canonical: '/explore/showcase',
  },
};

export default async function ShowcasePage() {
  const [companies, stories, readingPaths] = await Promise.all([
    getAutopsyCompanies(),
    getQueuedAutopsyStories(),
    getAllReadingPaths().catch(() => []),
  ]);

  const readableCompanies = getReadableAppCompanies(companies);
  const readableStories = getReadableAppStories(stories);

  return (
    <ShowcaseIndexExperience
      companies={readableCompanies}
      stories={readableStories}
      readingPaths={readingPaths}
    />
  );
}
