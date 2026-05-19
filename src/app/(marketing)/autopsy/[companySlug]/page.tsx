import { redirect } from 'next/navigation'

export default async function AutopsySingularCompanyPage({
  params,
}: {
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params
  redirect(`/autopsies/${companySlug}`)
}
