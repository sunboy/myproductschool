import type { MetadataRoute } from 'next'
import { canonicalUrl } from '@/lib/seo/site'

const PRIVATE_PATHS = [
  '/admin/',
  '/api/',
  '/dashboard/',
  '/workspace/',
  '/settings/',
  '/profile/',
  '/progress/',
  '/history/',
  '/notes/',
  '/challenges/',
  '/live-interviews/',
  '/simulation/',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: [
          'Googlebot',
          'Bingbot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'GPTBot',
          'Google-Extended',
          'CCBot',
          'ClaudeBot',
          'Claude-User',
          'Claude-SearchBot',
          'anthropic-ai',
          'PerplexityBot',
          'Perplexity-User',
          'Applebot-Extended',
        ],
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: canonicalUrl('/sitemap.xml'),
  }
}
