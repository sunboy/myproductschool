import { getChallenges } from '@/lib/data/challenges'
import { getDomains } from '@/lib/data/domains'
import Link from 'next/link'
import type { ChallengeWithDomain } from '@/lib/types'

interface ChallengesPageProps {
  searchParams: Promise<{ domain?: string; difficulty?: string; company?: string }>
}

const COMPANY_TAGS = ['Meta', 'Google', 'Stripe', 'Airbnb', 'Uber', 'DoorDash']

const DIFFICULTY_CONFIG: Record<string, { activeClass: string; label: string }> = {
  beginner: { activeClass: 'bg-primary text-on-primary', label: 'Easy' },
  intermediate: { activeClass: 'bg-tertiary text-on-tertiary', label: 'Medium' },
  advanced: { activeClass: 'bg-error text-on-error', label: 'Hard' },
}

// Deterministic participant counts based on challenge index
function getParticipantCount(index: number): number {
  const counts = [312, 487, 198, 563, 241, 89, 410, 175]
  return counts[index % counts.length]
}

export default async function ChallengesPage({ searchParams }: ChallengesPageProps) {
  const { domain, difficulty, company } = await searchParams
  const [domains, challenges] = await Promise.all([
    getDomains(),
    getChallenges({ difficulty }),
  ])

  // Filter by domain slug if provided
  const filteredChallenges = domain
    ? challenges.filter(c => c.domain.slug === domain)
    : challenges

  // Split into free (first 3) and premium (rest)
  const freeChallenges = filteredChallenges.slice(0, 3)
  const premiumChallenges = filteredChallenges.slice(3)

  const buildHref = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    if (params.domain) p.set('domain', params.domain)
    if (params.difficulty) p.set('difficulty', params.difficulty)
    if (params.company) p.set('company', params.company)
    const s = p.toString()
    return s ? `/challenges?${s}` : '/challenges'
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-bold text-on-surface">Practice Hub</h1>
        <p className="text-on-surface-variant mt-1">Choose a challenge and pick your mode.</p>
      </div>

      {/* Filter bar */}
      <div className="space-y-3">
        {/* Difficulty pills */}
        <div className="flex gap-2 flex-wrap items-center">
          <Link
            href={buildHref({ domain, company })}
            className={`px-4 py-1.5 rounded-full text-sm font-label font-semibold transition-colors ${
              !difficulty
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            All
          </Link>
          {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
            <Link
              key={key}
              href={buildHref({ domain, difficulty: key, company })}
              className={`px-4 py-1.5 rounded-full text-sm font-label font-semibold transition-colors ${
                difficulty === key
                  ? cfg.activeClass
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {cfg.label}
            </Link>
          ))}
        </div>

        {/* Domain dropdown row */}
        <div className="flex gap-2 flex-wrap">
          <Link
            href={buildHref({ difficulty, company })}
            className={`px-3 py-1 rounded-full text-sm font-label transition-colors border ${
              !domain
                ? 'border-primary text-primary bg-primary-container'
                : 'border-outline-variant text-on-surface-variant bg-surface-container hover:bg-surface-container-high'
            }`}
          >
            All Domains
          </Link>
          {domains.map(d => (
            <Link
              key={d.id}
              href={buildHref({ domain: d.slug, difficulty, company })}
              className={`px-3 py-1 rounded-full text-sm font-label transition-colors border ${
                domain === d.slug
                  ? 'border-primary text-primary bg-primary-container'
                  : 'border-outline-variant text-on-surface-variant bg-surface-container hover:bg-surface-container-high'
              }`}
            >
              {d.title}
            </Link>
          ))}
        </div>

        {/* Company tag chips */}
        <div className="flex gap-2 flex-wrap">
          {COMPANY_TAGS.map(tag => (
            <Link
              key={tag}
              href={buildHref({ domain, difficulty, company: company === tag ? undefined : tag })}
              className={`px-3 py-1 rounded-full text-xs font-label cursor-pointer transition-colors ${
                company === tag
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>

      {/* Free Challenges */}
      <div>
        <h2 className="font-headline text-xl text-on-surface mb-4">Free Challenges</h2>
        {freeChallenges.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-2 block">search_off</span>
            <p>No free challenges match your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {freeChallenges.map((challenge, idx) => (
              <ChallengeCard key={challenge.id} challenge={challenge} participantCount={getParticipantCount(idx)} />
            ))}
          </div>
        )}
      </div>

      {/* Pro Access Banner */}
      <div className="bg-secondary-container rounded-2xl p-5 flex items-center justify-between my-6 gap-4">
        <div>
          <h3 className="font-label font-semibold text-on-secondary-container">Unlock Pro Access</h3>
          <p className="text-sm text-on-secondary-container mt-0.5">Get unlimited challenges, model answers, and Luma&apos;s deeper coaching.</p>
        </div>
        <a
          href="/pricing"
          className="bg-primary text-on-primary rounded-full px-5 py-2 text-sm font-label font-semibold whitespace-nowrap hover:opacity-90 transition-opacity"
        >
          Upgrade →
        </a>
      </div>

      {/* Premium Challenges */}
      {premiumChallenges.length > 0 && (
        <div>
          <h2 className="font-headline text-xl text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>lock</span>
            Premium Challenges
          </h2>
          <div className="space-y-3">
            {premiumChallenges.map((challenge, idx) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                participantCount={getParticipantCount(idx + 3)}
                locked
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ChallengeCard({
  challenge,
  participantCount,
  locked = false,
}: {
  challenge: ChallengeWithDomain
  participantCount: number
  locked?: boolean
}) {
  const CardWrapper = locked ? 'div' : Link
  const cardProps = locked
    ? { className: 'relative flex items-start gap-4 p-5 bg-surface-container rounded-2xl border border-outline-variant opacity-75 cursor-default' }
    : {
        href: `/challenges/${challenge.id}`,
        className: 'relative flex items-start gap-4 p-5 bg-surface-container rounded-2xl border border-outline-variant hover:bg-surface-container-high hover:border-primary/30 transition-all',
      }

  return (
    // @ts-expect-error - polymorphic component
    <CardWrapper {...cardProps}>
      {locked && (
        <div className="absolute inset-0 rounded-2xl flex items-center justify-end pr-5 pointer-events-none">
          <span className="material-symbols-outlined text-on-surface-variant text-2xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>lock</span>
        </div>
      )}
      <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-primary">{challenge.domain.icon ?? 'fitness_center'}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-1">
          <h3 className="font-label font-medium text-on-surface flex-1">{challenge.title}</h3>
          {challenge.is_completed && (
            <span className="flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>check_circle</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-on-surface-variant">{challenge.domain.title}</span>
          <span className="text-on-surface-variant">·</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            challenge.difficulty === 'beginner'
              ? 'bg-primary-container text-on-primary-container'
              : challenge.difficulty === 'intermediate'
              ? 'bg-tertiary-container text-on-tertiary-container'
              : 'bg-error-container text-on-error-container'
          }`}>{challenge.difficulty}</span>
          <span className="text-on-surface-variant">·</span>
          <span className="text-xs text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-base">schedule</span>
            ~{challenge.estimated_minutes} min
          </span>
          <span className="text-on-surface-variant">·</span>
          <span className="text-xs text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">group</span>
            {participantCount} attempts
          </span>
        </div>
      </div>
      {!locked && (
        <span className="material-symbols-outlined text-on-surface-variant flex-shrink-0 mt-0.5">chevron_right</span>
      )}
    </CardWrapper>
  )
}
