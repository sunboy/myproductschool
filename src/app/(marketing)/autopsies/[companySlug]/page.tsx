import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AutopsyCompanyPage } from '@/components/autopsies/AutopsyPages'
import { getAutopsyAccess } from '@/lib/autopsies/access'
import { getAutopsyCompany, getAutopsyCompanyParams } from '@/lib/autopsies/queries'
import { buildMetadata } from '@/lib/seo/site'

export async function generateStaticParams() {
  return getAutopsyCompanyParams()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ companySlug: string }>
}): Promise<Metadata> {
  const { companySlug } = await params
  const company = await getAutopsyCompany(companySlug)
  if (!company) {
    return buildMetadata({
      title: 'Autopsy Hub Not Found | HackProduct',
      description: 'The requested HackProduct autopsy hub was not found.',
      path: '/autopsies',
    })
  }

  return buildMetadata({
    title: `${company.name} Autopsy Hub | HackProduct`,
    description: company.thesis,
    path: `/autopsies/${company.slug}`,
    keywords: [`${company.name} autopsy`, `${company.name} product strategy`, 'company teardown', 'feature autopsy'],
  })
}

export default async function CompanyAutopsyPage({
  params,
}: {
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params
  const [company, access] = await Promise.all([
    getAutopsyCompany(companySlug),
    getAutopsyAccess(),
  ])

  if (!company) notFound()

  return <AutopsyCompanyPage company={company} access={access} />
}
