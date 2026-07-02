import Link from 'next/link'
import Image from 'next/image'
import type { BlogPostCard } from '@/lib/blog/queries'

interface BlogCardProps {
  post: BlogPostCard
}

function formatDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function BlogCard({ post }: BlogCardProps) {
  const dateLabel = formatDate(post.published_at)

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="flex flex-col overflow-hidden rounded-xl bg-surface-container transition-shadow hover:shadow-sm"
    >
      {post.hero_image_url ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-container-high">
          <Image
            src={post.hero_image_url}
            alt=""
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-2 p-6">
        {post.tags.length > 0 ? (
          <span className="w-fit rounded-full bg-secondary-container px-3 py-1 font-label text-xs font-semibold text-on-secondary-container">
            {post.tags[0]}
          </span>
        ) : null}
        <h3 className="font-headline text-lg font-bold leading-snug text-on-surface">{post.title}</h3>
        {post.dek ? (
          <p className="line-clamp-2 font-body text-sm text-on-surface-variant">{post.dek}</p>
        ) : null}
        <div className="mt-auto flex items-center gap-2 pt-2 font-label text-xs text-on-surface-variant">
          <span>{post.author_name}</span>
          {dateLabel ? (
            <>
              <span aria-hidden>·</span>
              <span>{dateLabel}</span>
            </>
          ) : null}
          {post.reading_minutes ? (
            <>
              <span aria-hidden>·</span>
              <span>{post.reading_minutes} min read</span>
            </>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
