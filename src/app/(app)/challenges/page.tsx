import { getChallenges } from '@/lib/data/challenges'
import { getDomains } from '@/lib/data/domains'
import { getTopics } from '@/lib/data/topics'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { ChallengeCard } from '@/components/challenge/ChallengeCard'

interface ChallengesPageProps {
  searchParams: Promise<{ domain?: string; difficulty?: string; company?: string; topic?: string; status?: string }>
}

const COMPANY_TAGS = [
  'Meta', 'Google', 'Stripe', 'Airbnb', 'Uber', 'DoorDash',
  'Netflix', 'Spotify', 'Figma', 'Linear', 'Notion', 'Shopify',
]

const DIFFICULTY_CONFIG: Record<string, { activeClass: string; label: string }> = {
  beginner: { activeClass: 'bg-primary text-on-primary', label: 'Easy' },
  intermediate: { activeClass: 'bg-tertiary text-on-tertiary', label: 'Medium' },
  advanced: { activeClass: 'bg-error text-on-error', label: 'Hard' },
}

const STATUS_OPTIONS = [
  { value: undefined, label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'attempted', label: 'Attempted' },
  { value: 'completed', label: 'Completed' },
]

const TOPIC_DISPLAY_LIMIT = 6

export default async function ChallengesPage({ searchParams }: ChallengesPageProps) {
  const { domain, difficulty, company, topic, status } = await searchParams
  const [domains, challenges, topics] = await Promise.all([
    getDomains(),
    getChallenges({ difficulty }),
    getTopics(),
  ])

  // Filter by domain slug if provided
  let filteredChallenges = domain
    ? challenges.filter(c => c.domain.slug === domain)
    : challenges

  // Filter by company tag if provided
  if (company) {
    filteredChallenges = filteredChallenges.filter(c =>
      Array.isArray(c.tags) && (c.tags as string[]).some(t => t.toLowerCase() === company.toLowerCase())
    )
  }

  // Filter by topic slug if provided
  // (topic filtering is best-effort on tags since ChallengeWithDomain doesn't carry topic relations)
  if (topic) {
    filteredChallenges = filteredChallenges.filter(c =>
      Array.isArray(c.tags) && (c.tags as string[]).some(t => t.toLowerCase().replace(/\s+/g, '-') === topic)
    )
  }

  // Split into free (first 3) and premium (rest)
  const freeChallenges = filteredChallenges.slice(0, 3)
  const premiumChallenges = filteredChallenges.slice(3)

  const buildHref = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    if (params.domain) p.set('domain', params.domain)
    if (params.difficulty) p.set('difficulty', params.difficulty)
    if (params.company) p.set('company', params.company)
    if (params.topic) p.set('topic', params.topic)
    if (params.status) p.set('status', params.status)
    const s = p.toString()
    return s ? `/challenges?${s}` : '/challenges'
  }

  const visibleTopics = topics.slice(0, TOPIC_DISPLAY_LIMIT)
  const extraTopicCount = topics.length > TOPIC_DISPLAY_LIMIT ? topics.length - TOPIC_DISPLAY_LIMIT : 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      {/* Luma's Pick — compact row */}
      <div className="bg-primary-fixed rounded-xl p-3 flex items-center gap-3">
        <LumaGlyph size={32} className="text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Luma&apos;s Pick</span>
          <span className="mx-2 text-on-surface-variant text-xs">·</span>
          <span className="text-sm font-medium text-on-surface">Spotify podcast discovery drop</span>
        </div>
        <Link
          href="/challenges/c1000000-0000-0000-0000-000000000001"
          className="flex-shrink-0 inline-flex items-center gap-1 px-4 py-1.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Start <span className="material-symbols-outlined text-base leading-none">arrow_forward</span>
        </Link>
      </div>

      <div>
        <h1 className="font-headline text-3xl font-bold text-on-surface">Practice Hub</h1>
        <p className="text-on-surface-variant mt-1">Choose a challenge and pick your mode.</p>
      </div>

      {/* Filter bar */}
      <div className="space-y-2">
        {/* Difficulty pills */}
        <div className="flex gap-2 flex-wrap items-center">
          <Link
            href={buildHref({ domain, company, topic, status })}
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
              href={buildHref({ domain, difficulty: key, company, topic, status })}
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

        {/* Status filter pills */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-on-surface-variant font-label font-semibold mr-1">Status:</span>
          {STATUS_OPTIONS.map(opt => (
            <Link
              key={opt.label}
              href={buildHref({ domain, difficulty, company, topic, status: opt.value })}
              className={`px-3 py-1 rounded-full text-xs font-label transition-colors ${
                status === opt.value
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        {/* Domain pills */}
        <div className="flex gap-2 flex-wrap">
          <Link
            href={buildHref({ difficulty, company, topic, status })}
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
              href={buildHref({ domain: d.slug, difficulty, company, topic, status })}
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

        {/* Topic pills */}
        {visibleTopics.length > 0 && (
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs text-on-surface-variant font-label font-semibold mr-1">Topics:</span>
            <Link
              href={buildHref({ domain, difficulty, company, status })}
              className={`px-3 py-1 rounded-full text-xs font-label transition-colors border ${
                !topic
                  ? 'border-primary text-primary bg-primary-container'
                  : 'border-outline-variant text-on-surface-variant bg-surface-container hover:bg-surface-container-high'
              }`}
            >
              All
            </Link>
            {visibleTopics.map(t => (
              <Link
                key={t.id}
                href={buildHref({ domain, difficulty, company, topic: t.slug === topic ? undefined : t.slug, status })}
                className={`px-3 py-1 rounded-full text-xs font-label transition-colors border ${
                  topic === t.slug
                    ? 'border-primary text-primary bg-primary-container'
                    : 'border-outline-variant text-on-surface-variant bg-surface-container hover:bg-surface-container-high'
                }`}
              >
                {t.title}
              </Link>
            ))}
            {extraTopicCount > 0 && (
              <span className="text-xs text-on-surface-variant font-label">+{extraTopicCount} more</span>
            )}
          </div>
        )}

        {/* Company tag chips */}
        <div className="flex gap-2 flex-wrap">
          {COMPANY_TAGS.map(tag => (
            <Link
              key={tag}
              href={buildHref({ domain, difficulty, company: company === tag ? undefined : tag, topic, status })}
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
              <ChallengeCard key={challenge.id} challenge={challenge} index={idx} />
            ))}
          </div>
        )}
      </div>

      {/* Pro Access Banner */}
      <div className="bg-secondary-container rounded-2xl p-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-label font-semibold text-on-secondary-container">Unlock Pro Access</h3>
          <p className="text-sm text-on-secondary-container mt-0.5">
            Get unlimited challenges, model answers, and Luma&apos;s deeper coaching.
          </p>
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
            <span
              className="material-symbols-outlined text-on-surface-variant text-xl"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
            >
              lock
            </span>
            Premium Challenges
          </h2>
          <div className="space-y-3">
            {premiumChallenges.map((challenge, idx) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                index={idx + 3}
                locked
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
