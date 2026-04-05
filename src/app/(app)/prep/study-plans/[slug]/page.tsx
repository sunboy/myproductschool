import { redirect } from 'next/navigation'
export default function Page({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  // Handle both sync and async params
  const slug = typeof params === 'object' && 'then' in params ? '' : (params as { slug: string }).slug
  redirect(`/learn/plans/${slug}`)
}
