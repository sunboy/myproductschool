import type { Metadata } from 'next';
import { ShowcaseIndexExperience } from '@/components/showcase/index/ShowcaseIndexExperience';
import { getReadableAppCompanies, getReadableAppStories } from '@/lib/autopsies/app-library';
import { getAutopsyCompanies, getQueuedAutopsyStories } from '@/lib/autopsies/queries';
import { getAllReadingPaths } from '@/lib/showcase/reading-paths';

// This route lives under the authed (app) shell, which reads auth cookies during
// render, so Next cannot statically prerender it — attempting to caused
// "Page changed from static to dynamic at runtime ... reason: cookies" errors in
// prod. Declare the dynamic intent explicitly. (The (app) layout is a client
// component, where route-segment config is inert, so this must live on the page.)
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Product Autopsies',
  description: 'Dissect the decisions behind the products everyone uses. Feature autopsies across the companies that shaped modern software.',
  alternates: {
    canonical: '/explore/autopsies',
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
