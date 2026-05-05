'use client'

import { useEffect, useState } from 'react'
import { FreemiumUsageSummary } from './FreemiumUsageSummary'

export function BillingUsageFromProfile({ className = '' }: { className?: string }) {
  const [plan, setPlan] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setPlan(data?.plan ?? 'free'))
      .catch(() => setPlan('free'))
  }, [])

  return <FreemiumUsageSummary plan={plan} className={className} />
}
