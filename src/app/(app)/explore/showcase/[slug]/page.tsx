import { notFound } from 'next/navigation'
import { getShowcaseProduct, getShowcaseProducts } from '@/lib/data/showcase'
import { ShowcaseDetailClient } from '@/components/showcase/ShowcaseDetailClient'

export async function generateStaticParams() {
  const products = await getShowcaseProducts()
  return products.map(p => ({ slug: p.slug }))
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ShowcaseProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getShowcaseProduct(slug)

  if (!product) notFound()

  return <ShowcaseDetailClient product={product} />
}
