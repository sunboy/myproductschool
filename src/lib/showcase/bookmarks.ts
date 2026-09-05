'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface BookmarkState {
  bookmarked: boolean;
}

/**
 * Check whether the current user has bookmarked a specific story.
 * Returns false (not bookmarked) for unauthenticated visitors.
 */
export async function getBookmarkState(
  companySlug: string,
  storySlug: string,
): Promise<BookmarkState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { bookmarked: false };

  const { data } = await supabase
    .from('autopsy_bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('company_slug', companySlug)
    .eq('story_slug', storySlug)
    .maybeSingle();

  return { bookmarked: !!data };
}

/**
 * Toggle the bookmark on a story for the current user.
 * Returns the new bookmark state. Throws if not authenticated.
 */
export async function toggleBookmark(
  companySlug: string,
  storySlug: string,
): Promise<BookmarkState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Must be signed in to bookmark stories.');

  const { data: existing, error: lookupError } = await supabase
    .from('autopsy_bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('company_slug', companySlug)
    .eq('story_slug', storySlug)
    .maybeSingle();

  if (lookupError) throw new Error('Could not load bookmark state. Please try again.');

  if (existing) {
    const { error } = await supabase
      .from('autopsy_bookmarks')
      .delete()
      .eq('id', existing.id)
      .eq('user_id', user.id);
    if (error) throw new Error('Could not remove bookmark. Please try again.');
    revalidatePath('/explore');
    return { bookmarked: false };
  }

  const { error } = await supabase
    .from('autopsy_bookmarks')
    .insert({ user_id: user.id, company_slug: companySlug, story_slug: storySlug });

  if (error) throw new Error('Could not save bookmark. Please try again.');
  revalidatePath('/explore');
  return { bookmarked: true };
}

/**
 * Fetch all story slugs bookmarked by the current user.
 * Returns an empty array for unauthenticated visitors.
 */
export async function getUserBookmarks(): Promise<Array<{ companySlug: string; storySlug: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from('autopsy_bookmarks')
    .select('company_slug, story_slug')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (data ?? []).map(row => ({
    companySlug: row.company_slug,
    storySlug: row.story_slug,
  }));
}
