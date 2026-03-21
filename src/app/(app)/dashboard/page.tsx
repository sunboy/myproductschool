import { getDomains } from '@/lib/data/domains'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

export default async function DashboardPage() {
  const domains = await getDomains()

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Welcome */}
      <section>
        <h1 className="font-headline text-3xl font-bold text-on-surface">Good morning</h1>
        <p className="text-on-surface-variant mt-1">Ready to sharpen your product instincts?</p>
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/challenges', icon: 'fitness_center', label: 'Practice', color: 'bg-primary-container text-on-primary-container' },
          { href: '/flashcards', icon: 'style', label: 'Flashcards', color: 'bg-secondary-container text-on-secondary-container' },
          { href: '/vocabulary', icon: 'book_2', label: 'Vocabulary', color: 'bg-tertiary-container text-on-tertiary-container' },
          { href: '/interview-prep', icon: 'workspace_premium', label: 'Interview Prep', color: 'bg-surface-container-high text-on-surface' },
        ].map(action => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${action.color} hover:opacity-90 transition-opacity`}
          >
            <span className="material-symbols-outlined text-2xl">{action.icon}</span>
            <span className="text-sm font-medium">{action.label}</span>
          </Link>
        ))}
      </section>

      {/* Luma coach card */}
      <section className="p-5 bg-primary-container rounded-2xl flex items-center gap-4">
        <LumaGlyph size={40} className="text-primary flex-shrink-0" animated />
        <div className="flex-1">
          <p className="font-medium text-on-primary-container">Luma is ready to coach you</p>
          <p className="text-sm text-primary mt-0.5">Start a challenge to get AI-powered feedback on your product thinking.</p>
        </div>
        <Link href="/challenges" className="px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-xl hover:opacity-90 transition-opacity flex-shrink-0">
          Start
        </Link>
      </section>

      {/* Domains */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-xl font-bold text-on-surface">Domains</h2>
          <Link href="/domains" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {domains.slice(0, 6).map(domain => (
            <Link
              key={domain.id}
              href={`/domains/${domain.slug}`}
              className="flex items-center gap-3 p-4 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors border border-outline-variant"
            >
              <span className="material-symbols-outlined text-primary text-2xl">{domain.icon ?? 'grid_view'}</span>
              <div>
                <div className="font-medium text-on-surface text-sm">{domain.title}</div>
                <div className="text-xs text-on-surface-variant">{domain.challenge_count} challenges</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
