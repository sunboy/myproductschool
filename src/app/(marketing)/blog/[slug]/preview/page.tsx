import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPostBySlugAnyStatus } from '@/lib/blog/queries'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { BlogBody } from '@/components/blog/BlogBody'
import { HatchByline } from '@/components/blog/HatchByline'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Draft preview | HackProduct',
  robots: { index: false, follow: false },
}

interface PreviewPageProps {
  params: Promise<{ slug: string }>
}

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()

  return profile?.role === 'admin' ? user : null
}

export default async function BlogPreviewPage({ params }: PreviewPageProps) {
  const { slug } = await params
  const admin = await assertAdmin()
  if (!admin) notFound()

  const post = await getPostBySlugAnyStatus(slug)
  if (!post) notFound()

  return (
    <V3PageShell>
      <div className="bg-tertiary-container py-3 text-center">
        <p className="font-label text-sm font-bold uppercase tracking-wide text-on-surface">
          Draft preview · status: {post.status}
        </p>
      </div>

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
          </div>
        </div>
      </article>
    </V3PageShell>
  )
}
