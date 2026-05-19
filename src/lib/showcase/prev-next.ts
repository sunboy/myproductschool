import { unstable_cache } from 'next/cache';
import { getAllReadingPaths, type ReadingPathItem } from './reading-paths';

export interface PrevNextStory {
  companySlug: string;
  storySlug: string;
  pathSlug: string;
  pathTitle: string;
  position: number;
  total: number;
}

export interface PrevNextResult {
  prev: PrevNextStory | null;
  next: PrevNextStory | null;
  /** The first reading path that contains this story (for display context). */
  currentPath: { slug: string; title: string; position: number; total: number } | null;
}

/**
 * Given a story identified by companySlug + storySlug, return the prev and next
 * story within the same reading path. If the story belongs to multiple paths,
 * the first path (by DB insertion order) wins.
 *
 * Cached for 5 minutes — the path data it delegates to is also cached.
 */
export const getPrevNext = unstable_cache(
  async (companySlug: string, storySlug: string): Promise<PrevNextResult> => {
    const paths = await getAllReadingPaths();

    for (const path of paths) {
      const idx = path.items.findIndex(
        (item: ReadingPathItem) => item.companySlug === companySlug && item.storySlug === storySlug,
      );
      if (idx === -1) continue;

      const total = path.items.length;
      const prevItem = idx > 0 ? path.items[idx - 1] : null;
      const nextItem = idx < total - 1 ? path.items[idx + 1] : null;

      const toStory = (item: ReadingPathItem): PrevNextStory => ({
        companySlug: item.companySlug,
        storySlug: item.storySlug,
        pathSlug: path.slug,
        pathTitle: path.title,
        position: item.position,
        total,
      });

      return {
        prev: prevItem ? toStory(prevItem) : null,
        next: nextItem ? toStory(nextItem) : null,
        currentPath: {
          slug: path.slug,
          title: path.title,
          position: path.items[idx].position,
          total,
        },
      };
    }

    return { prev: null, next: null, currentPath: null };
  },
  ['autopsy-prev-next'],
  { revalidate: 300 },
);
