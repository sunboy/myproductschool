import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLdScript, articleJsonLd, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl, imageUrl } from '@/lib/seo/site'
import { getPostBySlug, getPublishedSlugs, getRelatedPosts } from '@/lib/blog/queries'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { BlogBody } from '@/components/blog/BlogBody'
import { HatchByline } from '@/components/blog/HatchByline'
import { RelatedPosts } from '@/components/blog/RelatedPosts'
import { SubscribeBox } from '@/components/blog/SubscribeBox'

export const revalidate = 3600

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}

  const title = post.seo_title ?? post.title
  const description = post.seo_description ?? post.dek ?? undefined
  const canonical = post.canonical_url ?? canonicalUrl(`/blog/${post.slug}`)
  const ogImage = post.og_image_url ?? canonicalUrl(`/blog/${post.slug}/opengraph-image`)

  const base = buildMetadata({
    title,
    description: description ?? '',
    path: `/blog/${post.slug}`,
    keywords: post.seo_keywords.length > 0 ? post.seo_keywords : post.tags,
  })

  return {
    ...base,
    alternates: { canonical },
    openGraph: {
      ...base.openGraph,
      type: 'article',
      url: canonical,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      ...base.twitter,
      images: [ogImage],
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const relatedPosts = await getRelatedPosts(post)
  const canonical = post.canonical_url ?? canonicalUrl(`/blog/${post.slug}`)
  const ogImage = post.og_image_url ?? imageUrl(`/blog/${post.slug}/opengraph-image`)

  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'Home', path: canonicalUrl('/') },
            { name: 'Blog', path: canonicalUrl('/blog') },
            { name: post.title, path: canonical },
          ]),
          articleJsonLd({
            headline: post.title,
            description: post.dek,
            url: canonical,
            image: ogImage,
            datePublished: post.published_at ?? post.created_at,
            dateModified: post.updated_at,
          }),
        ]}
      />

      <article className="v3-section">
        <div className="shell">
          <div className="mx-auto max-w-2xl">
            {post.tags.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-secondary-container px-3 py-1 font-label text-xs font-semibold text-on-secondary-container"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}

            <h1 className="font-headline text-3xl font-bold leading-tight text-on-surface md:text-4xl">
              {post.title}
            </h1>
            {post.dek ? (
              <p className="mt-3 font-body text-lg leading-relaxed text-on-surface-variant">{post.dek}</p>
            ) : null}

            <div className="mt-6 border-b border-outline-variant pb-6">
              <HatchByline publishedAt={post.published_at} readingMinutes={post.reading_minutes} />
            </div>

            {post.hero_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- author-supplied
              // hero URLs are not known ahead of time for next/image remotePatterns.
              <img
                src={post.hero_image_url}
                alt=""
                className="mt-8 w-full rounded-xl border border-outline-variant"
              />
            ) : null}

            <div className="mt-8">
              <BlogBody markdown={post.body_markdown} />
            </div>

            <div className="mt-12">
              <SubscribeBox source="blog" />
            </div>

            <RelatedPosts posts={relatedPosts} />
          </div>
        </div>
      </article>
    </V3PageShell>
  )
}
