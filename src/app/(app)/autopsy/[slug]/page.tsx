import { redirect } from 'next/navigation'

export default async function AutopsySingularProductAliasPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/explore/showcase/${slug}`)
}
