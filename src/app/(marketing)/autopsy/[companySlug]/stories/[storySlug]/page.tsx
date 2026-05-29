import { redirect } from 'next/navigation'

export default async function LegacySingularAutopsyStoryPage({
  params,
}: {
  params: Promise<{ companySlug: string; storySlug: string }>
}) {
  const { companySlug, storySlug } = await params
  redirect(`/autopsies/${companySlug}/${storySlug}`)
}
