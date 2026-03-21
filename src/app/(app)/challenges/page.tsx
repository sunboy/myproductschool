import { getChallenges } from '@/lib/data/challenges'
import { getDomains } from '@/lib/data/domains'
import Link from 'next/link'
import type { ChallengeWithDomain } from '@/lib/types'

interface ChallengesPageProps {
  searchParams: Promise<{ domain?: string; difficulty?: string }>
}

export default async function ChallengesPage({ searchParams }: ChallengesPageProps) {
  const { domain, difficulty } = await searchParams
  const [domains, challenges] = await Promise.all([
    getDomains(),
    getChallenges({ difficulty }),
  ])

  // Filter by domain slug if provided
  const filteredChallenges = domain
    ? challenges.filter(c => c.domain.slug === domain)
    : challenges

  const difficultyOptions = ['beginner', 'intermediate', 'advanced']

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-bold text-on-surface">Practice Hub</h1>
        <p className="text-on-surface-variant mt-1">Choose a challenge and pick your mode.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/challenges"
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!domain && !difficulty ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline-variant'}`}
          >
            All
          </Link>
          {domains.map(d => (
            <Link
              key={d.id}
              href={`/challenges?domain=${d.slug}${difficulty ? `&difficulty=${difficulty}` : ''}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${domain === d.slug ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline-variant'}`}
            >
              {d.title}
            </Link>
          ))}
        </div>
        <div className="flex gap-2">
          {difficultyOptions.map(d => (
            <Link
              key={d}
              href={`/challenges?${domain ? `domain=${domain}&` : ''}difficulty=${d}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${difficulty === d ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline-variant'}`}
            >
              {d}
            </Link>
          ))}
        </div>
      </div>

      {/* Challenge list */}
      <div className="space-y-3">
        {filteredChallenges.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-3 block">search_off</span>
            <p>No challenges match your filters.</p>
          </div>
        ) : filteredChallenges.map(challenge => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>
    </div>
  )
}

function ChallengeCard({ challenge }: { challenge: ChallengeWithDomain }) {
  return (
    <Link
      href={`/challenges/${challenge.id}`}
      className="flex items-start gap-4 p-5 bg-surface-container rounded-2xl border border-outline-variant hover:bg-surface-container-high hover:border-primary/30 transition-all"
    >
      <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-primary">{challenge.domain.icon ?? 'fitness_center'}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-1">
          <h3 className="font-medium text-on-surface flex-1">{challenge.title}</h3>
          {challenge.is_completed && (
            <span className="flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-on-surface-variant">{challenge.domain.title}</span>
          <span className="text-on-surface-variant">·</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            challenge.difficulty === 'beginner' ? 'bg-primary-container text-on-primary-container' :
            challenge.difficulty === 'intermediate' ? 'bg-tertiary-container text-on-tertiary-container' :
            'bg-error-container text-on-error-container'
          }`}>{challenge.difficulty}</span>
          <span className="text-on-surface-variant">·</span>
          <span className="text-xs text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-base">schedule</span>
            ~{challenge.estimated_minutes} min
          </span>
        </div>
      </div>
      <span className="material-symbols-outlined text-on-surface-variant flex-shrink-0 mt-0.5">chevron_right</span>
    </Link>
  )
}
