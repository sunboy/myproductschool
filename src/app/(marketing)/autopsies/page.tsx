import type { Metadata } from 'next'
import { AutopsyIndexPage } from '@/components/autopsies/AutopsyPages'
import { getAutopsyAccess } from '@/lib/autopsies/access'
import { getAutopsyCompanies, getQueuedAutopsyStories } from '@/lib/autopsies/queries'
import { buildMetadata } from '@/lib/seo/site'

export const metadata: Metadata = buildMetadata({
  title: 'Product Autopsies | HackProduct',
  description:
    'Read public HackProduct product autopsies, company teardowns, source-backed feature stories, and Hatch-led visual product lessons.',
  path: '/autopsies',
  keywords: ['product autopsies', 'company teardowns', 'feature autopsies', 'product strategy examples'],
})

export default async function AutopsiesPage() {
  const [companies, stories, access] = await Promise.all([
    getAutopsyCompanies(),
    getQueuedAutopsyStories(),
    getAutopsyAccess(),
  ])

  return <AutopsyIndexPage companies={companies} stories={stories} access={access} />
}
