'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getOnboardingState } from '@/lib/onboarding/state-client'

export function OnboardingStateGate() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    getOnboardingState()
      .then(state => {
        if (cancelled || !state) return
        if (state.step !== pathname) router.replace(state.step)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [pathname, router])

  return null
}
