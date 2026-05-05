import { notFound } from 'next/navigation'
import { getShowcaseProduct } from '@/lib/data/showcase'
import { ShowcaseDetailClient } from '@/components/showcase/ShowcaseDetailClient'
import { AutopsyReaderClient } from './AutopsyReaderClient'

export async function generateStaticParams() {
  return []
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ShowcaseProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getShowcaseProduct(slug)

  if (!product) notFound()

  // Products with AARRR-style stories use the editorial reader
  const hasAarrrStory = product.stories?.some(s =>
    s.sections?.some(sec => sec.layout === 'aarrr_stage')
  )
  if (hasAarrrStory) {
    return <AutopsyReaderClient product={product} />
  }

  return <ShowcaseDetailClient product={product} />
}
