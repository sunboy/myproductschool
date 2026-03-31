import { getDomains } from '@/lib/data/domains'
import Link from 'next/link'

export default async function FlashcardsPage() {
  const domains = await getDomains()

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold text-on-surface">Flashcards</h1>
        <p className="text-on-surface-variant mt-1">Reinforce concepts with spaced repetition.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {domains.map(domain => (
          <Link
            key={domain.id}
            href={`/flashcards/${domain.slug}`}
            className="group flex flex-col p-5 bg-surface-container rounded-2xl border border-outline-variant hover:bg-surface-container-high hover:border-primary/30 transition-all"
          >
            <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary">{domain.icon ?? 'style'}</span>
            </div>
            <h3 className="font-headline font-bold text-on-surface mb-1">{domain.title}</h3>
            <p className="text-sm text-on-surface-variant flex-1 mb-4">Master key concepts</p>
            <div className="flex items-center gap-2 text-xs text-primary">
              <span className="material-symbols-outlined text-base">style</span>
              <span>Start deck →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
