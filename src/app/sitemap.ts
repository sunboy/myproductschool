import type { MetadataRoute } from 'next'
import { PUBLIC_DIRECTORY_PATHS } from '@/lib/seo/directory-content'
import { canonicalUrl } from '@/lib/seo/site'
import { getPublishedPosts } from '@/lib/blog/queries'

export const revalidate = 3600

const BLOG_SITEMAP_PAGE_SIZE = 500

async function blogEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const { posts } = await getPublishedPosts({ page: 1, pageSize: BLOG_SITEMAP_PAGE_SIZE })
    return posts.map((post) => ({
      url: canonicalUrl(`/blog/${post.slug}`),
      lastModified: post.published_at ? new Date(post.published_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch {
    // Sitemap generation must never fail the build over a transient DB blip —
    // fall back to the static-only sitemap (blog index route is still listed
    // below via PUBLIC_DIRECTORY_PATHS if present, or the entry added here).
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticEntries: MetadataRoute.Sitemap = PUBLIC_DIRECTORY_PATHS.map((path) => {
    const depth = path === '/' ? 0 : path.split('/').filter(Boolean).length
    return {
      url: canonicalUrl(path),
      lastModified: now,
      changeFrequency: depth <= 1 ? 'weekly' : 'monthly',
      priority: path === '/' ? 1 : depth === 1 ? 0.85 : 0.72,
    }
  })

  const blogIndexEntry: MetadataRoute.Sitemap = PUBLIC_DIRECTORY_PATHS.includes('/blog')
    ? []
    : [
        {
          url: canonicalUrl('/blog'),
          lastModified: now,
          changeFrequency: 'daily' as const,
          priority: 0.85,
        },
      ]

  const posts = await blogEntries()

  return [...staticEntries, ...blogIndexEntry, ...posts]
}
