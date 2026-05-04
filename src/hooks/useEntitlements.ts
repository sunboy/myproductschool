'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Entitlements {
  isPro: boolean
  isAdmin: boolean
  canViewModelAnswer: boolean
  canAccessSimulation: boolean
  dailyChallengesRemaining: number
  loading: boolean
}

export function useEntitlements(): Entitlements {
  const [isPro, setIsPro] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function checkPlan() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, role')
        .eq('id', user.id)
        .single()

      setIsPro(profile?.plan === 'pro')
      setIsAdmin(profile?.role === 'admin')
      setLoading(false)
    }

    checkPlan()
  }, [supabase])

  const hasPaidAccess = isPro || isAdmin
  return {
    isPro,
    isAdmin,
    canViewModelAnswer: hasPaidAccess,
    canAccessSimulation: hasPaidAccess,
    dailyChallengesRemaining: isAdmin ? Infinity : (isPro ? 80 : 3),
    loading,
  }
}
