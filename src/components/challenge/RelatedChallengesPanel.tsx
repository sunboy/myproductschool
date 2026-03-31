'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface RelatedChallenge {
  id: string
  title: string
  difficulty: string
}

interface Props {
  currentChallengeId: string
}

function getDifficultyColor(d: string) {
  if (d === 'beginner') return 'text-green-600'
  if (d === 'intermediate') return 'text-amber-600'
  return 'text-red-600'
}

export function RelatedChallengesPanel({ currentChallengeId }: Props) {
  const [challenges, setChallenges] = useState<RelatedChallenge[]>([])

  useEffect(() => {
    fetch('/api/challenges/recommended')
      .then(r => r.json())
      .then(data => {
        const items = (data.challenges ?? data ?? [])
          .filter((c: RelatedChallenge) => c.id !== currentChallengeId)
          .slice(0, 3)
        setChallenges(items)
      })
      .catch(() => {})
  }, [currentChallengeId])

  if (challenges.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-outline-variant/20 p-4 shadow-sm">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-sm">explore</span>
        Related Challenges
      </h3>
      <div className="space-y-2">
        {challenges.map(c => (
          <Link
            key={c.id}
            href={`/challenges/${c.id}`}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low transition-colors group"
          >
            <span className="text-xs font-medium text-on-surface group-hover:text-primary transition-colors line-clamp-2">{c.title}</span>
            <span className={`text-[10px] font-bold ml-2 shrink-0 ${getDifficultyColor(c.difficulty)}`}>
              {c.difficulty === 'beginner' ? 'EASY' : c.difficulty === 'intermediate' ? 'MED' : 'HARD'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
