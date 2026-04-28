import { getChallenges, getFeaturedChallenges } from '@/lib/data/challenges'
import Link from 'next/link'
import { ChallengeCard } from './ChallengeCard'
import { ChallengeSearch } from './ChallengeSearch'
import { HatchPick } from './HatchPick'
import { FilteredChallengesView } from './FilteredChallengesView'

export interface FreePracticeContentProps {
  searchParams: Promise<{ paradigm?: string; role?: string; difficulty?: string; company?: string; tab?: string; view?: string; q?: string; type?: string }>
}

const PARADIGM_DISPLAY: Record<string, string> = {
  traditional: 'Traditional',
  ai_assisted: 'AI-Assisted',
  agentic: 'Agentic',
  ai_native: 'AI-Native',
}

function getParadigmLabel(paradigm?: string | null): string {
  return (paradigm && PARADIGM_DISPLAY[paradigm]) ?? 'Traditional'
}

export async function FreePracticeContent({ searchParams }: FreePracticeContentProps) {
  const { q } = await searchParams

  const [challenges, featuredChallenges] = await Promise.all([
    getChallenges({ q }),
    getFeaturedChallenges(),
  ])

  const paradigmMap: Record<string, string> = {}
  challenges.forEach((c) => {
    paradigmMap[c.id] = getParadigmLabel(c.paradigm ?? undefined)
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-6">
        <p className="text-[15px] text-on-surface-variant font-body">Real scenarios from real companies. Pick what fits your role.</p>
        <ChallengeSearch total={challenges.length} />
      </div>

      {/* Hatch's Pick */}
      <HatchPick />

      {/* Featured Challenges — only when editorially pinned challenges exist and no search query */}
      {featuredChallenges.length > 0 && !q && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1", color: '#c9933a' }}>star</span>
              <h2 className="font-headline text-[22px] font-[500] text-on-surface m-0">Featured</h2>
            </div>
            <span className="text-[12px] text-on-surface-variant font-label">Curated picks</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredChallenges.map((challenge) => (
              <ChallengeCard
                key={`featured-${challenge.id}`}
                challenge={challenge}
                paradigm={getParadigmLabel(challenge.paradigm)}
              />
            ))}
          </div>
          <div className="border-t border-outline-variant/20 mt-6 mb-6" />
        </div>
      )}

      {/* Discipline tabs + contextual filter dropdowns + challenge grid */}
      <FilteredChallengesView challenges={challenges} paradigms={paradigmMap} />
    </div>
  )
}
