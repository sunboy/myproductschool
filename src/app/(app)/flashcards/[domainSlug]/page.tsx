import { getDomainBySlug } from '@/lib/data/domains'
import { notFound } from 'next/navigation'
import { FlashcardSession } from '@/components/learning/FlashcardSession'

export default async function FlashcardDeckPage({ params }: { params: Promise<{ domainSlug: string }> }) {
  const { domainSlug } = await params
  const domain = await getDomainBySlug(domainSlug)
  if (!domain) notFound()

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <FlashcardSession domain={domain} domainSlug={domainSlug} />
    </div>
  )
}
