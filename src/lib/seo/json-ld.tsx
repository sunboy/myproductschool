type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue }

export type JsonLd = { [key: string]: JsonLdValue }

export function stringifyJsonLd(data: JsonLd | JsonLd[]) {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export function JsonLdScript({ data }: { data: JsonLd | JsonLd[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: stringifyJsonLd(data) }}
    />
  )
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path,
    })),
  }
}

/**
 * BlogPosting structured data for a blog post detail page. Author is always
 * the Organization, never a fake human byline — Hatch is presented in UI
 * copy as the narrator, but JSON-LD author identity stays HackProduct for
 * E-E-A-T (see docs on the blog plan's Hatch guardrails).
 */
export function articleJsonLd(post: {
  headline: string
  description?: string | null
  url: string
  image?: string | null
  datePublished: string
  dateModified?: string | null
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.headline,
    ...(post.description ? { description: post.description } : {}),
    ...(post.image ? { image: [post.image] } : {}),
    datePublished: post.datePublished,
    dateModified: post.dateModified ?? post.datePublished,
    author: {
      '@type': 'Organization',
      name: 'HackProduct',
      url: 'https://www.hackproduct.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'HackProduct',
      url: 'https://www.hackproduct.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': post.url,
    },
  }
}
