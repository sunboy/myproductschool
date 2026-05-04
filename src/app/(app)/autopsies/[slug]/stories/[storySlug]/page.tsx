import { redirect } from 'next/navigation'

export default async function AutopsyStoryAliasPage({
  params,
}: {
  params: Promise<{ slug: string; storySlug: string }>
}) {
  const { slug, storySlug } = await params
  redirect(`/explore/showcase/${slug}/stories/${storySlug}`)
}
