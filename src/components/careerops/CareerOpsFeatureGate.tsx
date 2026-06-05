'use client'
// Client wrapper that hides a UI entry point when its CareerOps feature flag (or
// chain) is off. Keeps the flag check consistent with the server guard so the
// same edge is enforced in both layers.

import type { ReactNode } from 'react'
import { isCareerOpsFeatureEnabled, type CareerOpsFeature } from '@/lib/careerops/flags'

interface CareerOpsFeatureGateProps {
  feature: CareerOpsFeature
  children: ReactNode
  fallback?: ReactNode
}

export function CareerOpsFeatureGate({ feature, children, fallback = null }: CareerOpsFeatureGateProps) {
  if (!isCareerOpsFeatureEnabled(feature)) return <>{fallback}</>
  return <>{children}</>
}
