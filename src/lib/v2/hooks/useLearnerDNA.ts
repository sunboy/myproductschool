'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Competency } from '@/lib/types'

interface DNACompetency {
  competency: Competency
  score: number
  trend: 'improving' | 'declining' | 'steady' | 'insufficient_data'
}

interface DNAProfile {
  competencies: DNACompetency[]
  weakest_link: Competency | null
  overall_level: 'Expert' | 'Advanced' | 'Developing' | 'Beginner'
}

interface UseLearnerDNAReturn {
  dna: DNAProfile | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useLearnerDNA(): UseLearnerDNAReturn {
  const [dna, setDNA] = useState<DNAProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v2/dna')
      if (!res.ok) throw new Error(`Failed to load DNA: ${res.status}`)
      const data = await res.json()
      setDNA(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { dna, loading, error, refresh }
}
