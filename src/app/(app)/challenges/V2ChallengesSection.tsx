'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Challenge } from '@/lib/types'
import { ChallengeCardV2 } from '@/components/v2/ChallengeCardV2'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface V2ChallengeWithMeta extends Challenge {
  attempt_count?: number
  best_score?: number
  is_completed?: boolean
}

interface V2ChallengesSectionProps {
  paradigm?: string
  difficulty?: string
  role?: string
}

export function V2ChallengesSection({ paradigm, difficulty, role }: V2ChallengesSectionProps) {
  const router = useRouter()
  const [challenges, setChallenges] = useState<V2ChallengeWithMeta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (paradigm && paradigm !== 'all') params.set('paradigm', paradigm)
    if (difficulty) params.set('difficulty', difficulty)
    if (role) params.set('role', role)
    setLoading(true)
    fetch(`/api/challenges?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.challenges) setChallenges(data.challenges) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [paradigm, difficulty, role])

  if (!loading && challenges.length === 0) return null

  return (
    <section className="mt-10 space-y-5">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>auto_awesome</span>
        <h2 className="font-headline text-lg text-on-surface">FLOW Challenges</h2>
        <span className="bg-primary text-on-primary rounded-full px-2.5 py-0.5 text-xs font-label font-semibold">New</span>
      </div>
      <p className="font-body text-sm text-on-surface-variant -mt-2">
        Frame → List → Optimize → Win. Structured 4-step challenges with role-lens coaching from Luma.
      </p>
      {loading ? (
        <div className="flex justify-center py-8">
          <LumaGlyph size={40} state="reviewing" className="text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((c) => (
            <ChallengeCardV2
              key={c.id}
              challenge={c}
              onStart={() => router.push(`/workspace/challenges/${c.slug ?? c.id}`)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
