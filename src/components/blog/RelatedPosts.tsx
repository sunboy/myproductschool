import type { BlogPostCard } from '@/lib/blog/queries'
import { BlogCard } from '@/components/blog/BlogCard'

interface RelatedPostsProps {
  posts: BlogPostCard[]
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null

  return (
    <section className="mt-16">
      <h2 className="font-headline text-xl font-bold text-on-surface">More from the Letter</h2>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  )
}
