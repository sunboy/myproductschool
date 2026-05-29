import type { MetadataRoute } from 'next'
import { PUBLIC_DIRECTORY_PATHS } from '@/lib/seo/directory-content'
import { canonicalUrl } from '@/lib/seo/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return PUBLIC_DIRECTORY_PATHS.map((path) => {
    const depth = path === '/' ? 0 : path.split('/').filter(Boolean).length
    return {
      url: canonicalUrl(path),
      lastModified: now,
      changeFrequency: depth <= 1 ? 'weekly' : 'monthly',
      priority: path === '/' ? 1 : depth === 1 ? 0.85 : 0.72,
    }
  })
}
