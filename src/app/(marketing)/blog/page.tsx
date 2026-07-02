import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl } from '@/lib/seo/site'
import { getPublishedPosts } from '@/lib/blog/queries'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { BlogCard } from '@/components/blog/BlogCard'
import { SubscribeBox } from '@/components/blog/SubscribeBox'

export const revalidate = 300

const PAGE_SIZE = 12

export const metadata: Metadata = buildMetadata({
  title: 'The HackProduct Letter | Product Thinking & AI-Native Engineering',
  description:
    'Hatch on product judgment, AI-native engineering, and the reasoning moves that separate a real answer from a plausible one. New issues on autopilot.',
  path: '/blog',
  keywords: ['product thinking blog', 'AI-native engineering', 'product sense practice', 'HackProduct blog'],
})

interface BlogIndexPageProps {
  searchParams: Promise<{ page?: string; tag?: string }>
}

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const { page: pageParam, tag } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1)
  const { posts, page: currentPage, totalPages } = await getPublishedPosts({ page, pageSize: PAGE_SIZE, tag })

  const hasPosts = posts.length > 0

  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'Home', path: canonicalUrl('/') },
            { name: 'Blog', path: canonicalUrl('/blog') },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'The HackProduct Letter',
            url: canonicalUrl('/blog'),
            description:
              'Product thinking and AI-native engineering, written by Hatch, HackProduct’s coach.',
          },
        ]}
      />

      <section className="v3-page-hero">
        <div className="shell">
          <div className="grid items-center gap-10 py-4 md:grid-cols-[1fr_auto]">
            <div className="v3-page-hero-inner text-left">
              <p className="eyebrow">
                <span className="dot" />
                The HackProduct Letter
              </p>
              <h1>Product judgment, one honest issue at a time.</h1>
              <p className="v3-page-hero-sub">
                Hatch writes about the reasoning moves that separate a real answer from a plausible one:
                framing, tradeoffs, strategy, and the domain calls that only show up once you have shipped
                something real.
              </p>
            </div>
            <Image
              src="/hatch/blog-hero.png"
              alt="Hatch, HackProduct's coach"
              width={240}
              height={240}
              priority
              className="hidden rounded-2xl md:block"
            />
          </div>
        </div>
      </section>

      <section className="v3-section">
        <div className="shell">
          {hasPosts ? (
            <>
              <div className="v3-card-grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>

              {totalPages > 1 ? (
                <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Blog pagination">
                  {currentPage > 1 ? (
                    <Link
                      href={`/blog?page=${currentPage - 1}${tag ? `&tag=${tag}` : ''}`}
                      className="rounded-full bg-secondary-container px-5 py-2 font-label text-sm font-semibold text-on-secondary-container"
                    >
                      Newer
                    </Link>
                  ) : null}
                  <span className="font-label text-sm text-on-surface-variant">
                    Page {currentPage} of {totalPages}
                  </span>
                  {currentPage < totalPages ? (
                    <Link
                      href={`/blog?page=${currentPage + 1}${tag ? `&tag=${tag}` : ''}`}
                      className="rounded-full bg-secondary-container px-5 py-2 font-label text-sm font-semibold text-on-secondary-container"
                    >
                      Older
                    </Link>
                  ) : null}
                </nav>
              ) : null}
            </>
          ) : (
            <div className="mx-auto max-w-xl rounded-xl bg-surface-container p-10 text-center">
              <h2 className="font-headline text-xl font-bold text-on-surface">
                The first issue is on its way.
              </h2>
              <p className="mt-2 font-body text-sm text-on-surface-variant">
                Hatch is still writing. Subscribe now and the first post lands in your inbox the day it
                publishes, no need to check back.
              </p>
              <div className="mt-6">
                <SubscribeBox source="blog" />
              </div>
            </div>
          )}

          {hasPosts ? (
            <div className="mt-16">
              <SubscribeBox source="blog" />
            </div>
          ) : null}
        </div>
      </section>
    </V3PageShell>
  )
}
