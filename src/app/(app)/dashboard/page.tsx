import { getDomains } from '@/lib/data/domains'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const domains = await getDomains()

  // Fetch authenticated user and profile for onboarding gate
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isOnboarded = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed_at')
      .eq('id', user.id)
      .single()
    isOnboarded = !!profile?.onboarding_completed_at
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Welcome */}
      <section>
        <h1 className="font-headline text-3xl font-bold text-on-surface">Good morning</h1>
        <p className="text-on-surface-variant mt-1">Ready to sharpen your product instincts?</p>
      </section>

      {/* Orientation card — only show for users who have not completed onboarding */}
      {!isOnboarded && (
        <div className="p-6 bg-gradient-to-r from-primary to-primary/80 rounded-2xl text-on-primary mb-6">
          <div className="flex items-start gap-4">
            <LumaGlyph size={40} className="flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="font-headline text-xl font-bold">Welcome! Let&apos;s find your starting point.</h2>
              <p className="text-on-primary/80 mt-1 text-sm">Your first challenge takes ~5 minutes. Luma will walk you through everything and establish your baseline.</p>
              <Link href="/challenges/orientation" className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-on-primary text-primary rounded-full font-semibold text-sm hover:opacity-90 transition-opacity">
                Start Orientation
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Digest */}
      <div className="flex gap-4 p-5 bg-surface-container rounded-2xl border border-outline-variant mb-6">
        <LumaGlyph size={28} className="text-primary flex-shrink-0 mt-0.5" animated />
        <div>
          <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Luma&apos;s Weekly Insight</div>
          <p className="text-sm text-on-surface leading-relaxed">You completed 5 challenges this week. Your Diagnostic Accuracy improved +1.2. Your biggest win: you stopped listing metrics without explaining why they matter.</p>
        </div>
      </div>

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
