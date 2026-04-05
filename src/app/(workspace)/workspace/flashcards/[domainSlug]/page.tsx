import { getDomainBySlug, getDomains } from '@/lib/data/domains'
import { notFound } from 'next/navigation'
import { FlashcardSession } from '@/components/learning/FlashcardSession'

export default async function FlashcardDeckPage({ params }: { params: Promise<{ domainSlug: string }> }) {
  const { domainSlug } = await params
  const [domain, allDomains] = await Promise.all([
    getDomainBySlug(domainSlug),
    getDomains(),
  ])
  if (!domain) notFound()

  return <FlashcardSession domain={domain} domainSlug={domainSlug} allDomains={allDomains} />
}
