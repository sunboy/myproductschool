import { permanentRedirect } from 'next/navigation'

// Legacy route. The canonical domain detail page lives at
// /explore/domains/[slug] (richer body, nested under the Explore hub so its
// breadcrumb trail resolves). 308-redirect so old links and SEO consolidate
// onto the one canonical address.
export default async function LegacyDomainDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  permanentRedirect(`/explore/domains/${slug}`)
}
