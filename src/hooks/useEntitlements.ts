'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Entitlements {
  isPro: boolean
  canViewModelAnswer: boolean
  canAccessSimulation: boolean
  dailyChallengesRemaining: number
  loading: boolean
}

export function useEntitlements(): Entitlements {
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function checkPlan() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()

      setIsPro(profile?.plan === 'pro')
      setLoading(false)
    }

    checkPlan()
  }, [supabase])

  return {
    isPro,
    canViewModelAnswer: isPro,
    canAccessSimulation: isPro,
    dailyChallengesRemaining: isPro ? Infinity : 3,
    loading,
  }
}
