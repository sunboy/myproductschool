import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';

export interface ReadingPathItem {
  position: number;
  companySlug: string;
  storySlug: string;
}

export interface ReadingPath {
  id: string;
  slug: string;
  title: string;
  dek: string;
  coverEmoji: string;
  items: ReadingPathItem[];
}

interface ReadingPathRowItem {
  position: number;
  company_slug: string;
  story_slug: string;
}

/**
 * Fetch all reading paths with their ordered items.
 * Cached for 5 minutes — paths change rarely.
 */
export const getAllReadingPaths = unstable_cache(
  async (): Promise<ReadingPath[]> => {
    const supabase = createAdminClient();

    const { data: paths, error } = await supabase
      .from('autopsy_reading_paths')
      .select(`
        id,
        slug,
        title,
        dek,
        cover_emoji,
        autopsy_reading_path_items (
          position,
          company_slug,
          story_slug
        )
      `)
      .order('created_at', { ascending: true });

    if (error || !paths) return [];

    return paths.map(p => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      dek: p.dek,
      coverEmoji: p.cover_emoji,
      items: ((p.autopsy_reading_path_items ?? []) as ReadingPathRowItem[])
        .sort((a, b) => a.position - b.position)
        .map(item => ({
          position: item.position,
          companySlug: item.company_slug,
          storySlug: item.story_slug,
        })),
    }));
  },
  ['autopsy-reading-paths'],
  { revalidate: 300 },
);

/**
 * Fetch a single reading path by slug.
 */
export async function getReadingPath(slug: string): Promise<ReadingPath | null> {
  const paths = await getAllReadingPaths();
  return paths.find(p => p.slug === slug) ?? null;
}
