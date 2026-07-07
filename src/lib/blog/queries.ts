import { createClient as createBareClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Cookie-free anon client for public blog reads. These queries run at build
 * time (generateStaticParams, static page prerenders, sitemap), where the
 * request-scoped cookies() client is unavailable. RLS on blog_posts still
 * restricts reads to published rows.
 */
function publicClient() {
  return createBareClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export type BlogPostStatus = 'draft' | 'published' | 'archived'

export interface BlogPost {
  id: string
  slug: string
  title: string
  dek: string | null
  body_markdown: string
  hero_image_url: string | null
  og_image_url: string | null
  tags: string[]
  author_name: string
  reading_minutes: number | null
  status: BlogPostStatus
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string[]
  canonical_url: string | null
  published_at: string | null
  newsletter_sent_at: string | null
  linear_issue_id: string | null
  created_at: string
  updated_at: string
}

export type BlogPostCard = Pick<
  BlogPost,
  'id' | 'slug' | 'title' | 'dek' | 'hero_image_url' | 'tags' | 'author_name' | 'reading_minutes' | 'published_at'
>

const CARD_COLUMNS = 'id, slug, title, dek, hero_image_url, tags, author_name, reading_minutes, published_at'
const FULL_COLUMNS =
  'id, slug, title, dek, body_markdown, hero_image_url, og_image_url, tags, author_name, reading_minutes, status, seo_title, seo_description, seo_keywords, canonical_url, published_at, newsletter_sent_at, linear_issue_id, created_at, updated_at'

interface GetPublishedPostsParams {
  page?: number
  pageSize?: number
  tag?: string
}

interface GetPublishedPostsResult {
  posts: BlogPostCard[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Paginated published-post listing for the blog index. Uses the anon/SSR
 * client so RLS enforces `status = 'published'` — this function can never
 * accidentally leak a draft, even if a caller forgets to filter.
 */
export async function getPublishedPosts({
  page = 1,
  pageSize = 12,
  tag,
}: GetPublishedPostsParams = {}): Promise<GetPublishedPostsResult> {
  const supabase = publicClient()
  const safePage = Math.max(1, Math.floor(page))
  const safePageSize = Math.min(50, Math.max(1, Math.floor(pageSize)))
  const from = (safePage - 1) * safePageSize
  const to = from + safePageSize - 1

  let query = supabase
    .from('blog_posts')
    .select(CARD_COLUMNS, { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(from, to)

  if (tag) {
    query = query.contains('tags', [tag])
  }

  const { data, error, count } = await query

  if (error) {
    return { posts: [], total: 0, page: safePage, pageSize: safePageSize, totalPages: 0 }
  }

  const total = count ?? 0
  return {
    posts: (data ?? []) as BlogPostCard[],
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.max(1, Math.ceil(total / safePageSize)),
  }
}

/** All published slugs, for generateStaticParams and sitemap.ts. */
export async function getPublishedSlugs(): Promise<string[]> {
  const supabase = publicClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) return []
  return (data ?? []).map((row) => row.slug as string)
}

/** Single published post by slug. RLS enforces published-only. */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = publicClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select(FULL_COLUMNS)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error || !data) return null
  return data as BlogPost
}

/**
 * Single post by slug regardless of status, for the admin-guarded preview
 * route. Uses the service-role client — never call this from a path a
 * non-admin request can reach.
 */
export async function getPostBySlugAnyStatus(slug: string): Promise<BlogPost | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('blog_posts')
    .select(FULL_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) return null
  return data as BlogPost
}

/** Other published posts sharing at least one tag, most recent first. */
export async function getRelatedPosts(
  post: Pick<BlogPost, 'id' | 'tags'>,
  limit = 3
): Promise<BlogPostCard[]> {
  if (!post.tags || post.tags.length === 0) return []

  const supabase = publicClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select(CARD_COLUMNS)
    .eq('status', 'published')
    .neq('id', post.id)
    .overlaps('tags', post.tags)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data ?? []) as BlogPostCard[]
}

/** Latest N published posts, for llms.txt. */
export async function getLatestPublishedPosts(limit = 25): Promise<BlogPostCard[]> {
  const supabase = publicClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select(CARD_COLUMNS)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data ?? []) as BlogPostCard[]
}
