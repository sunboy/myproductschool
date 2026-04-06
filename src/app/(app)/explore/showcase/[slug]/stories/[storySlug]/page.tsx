import { notFound } from 'next/navigation'
import { getShowcaseProduct } from '@/lib/data/showcase'
import { StoryReader } from '@/components/autopsy/StoryReader'

export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string; storySlug: string }>
}) {
  const { slug, storySlug } = await params
  const product = await getShowcaseProduct(slug)
  if (!product) notFound()
  const story = product.stories.find(s => s.slug === storySlug)
  if (!story) notFound()
  return <StoryReader story={story} productName={product.name} productSlug={slug} />
}
