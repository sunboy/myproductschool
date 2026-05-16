import type { Metadata } from 'next'

export const SITE_NAME = 'HackProduct'
export const SITE_URL = 'https://hackproduct.dev'
export const OG_IMAGE_PATH = '/brand/og-image-1200x630.png'
export const DEFAULT_TITLE = 'HackProduct | Practice Gym for Product and Technical Judgment'
export const DEFAULT_DESCRIPTION =
  'HackProduct is the AI-native practice gym for career-changing product and technical judgment. Train interviews, role transitions, promotion readiness, and salary negotiation proof with Hatch and FLOW.'

export function canonicalUrl(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${normalized === '/' ? '' : normalized}`
}

export function imageUrl(path = OG_IMAGE_PATH) {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function buildMetadata({
  title,
  description,
  path,
  keywords = [],
}: {
  title: string
  description: string
  path: string
  keywords?: string[]
}): Metadata {
  const url = canonicalUrl(path)
  return {
    title: {
      absolute: title,
    },
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      images: [
        {
          url: imageUrl(),
          width: 1200,
          height: 630,
          alt: 'HackProduct AI-native learning platform',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl()],
      creator: '@hackproduct',
    },
  }
}
