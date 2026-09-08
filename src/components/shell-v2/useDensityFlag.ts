'use client'
import { useEffect, useState } from 'react'

/**
 * Client-side flag read for layouts that have no server props (e.g. the
 * (workspace) layout, which is a client component). Server-rendered layouts
 * should prefer `getAppFlag('ui_density_v1', false)` directly.
 */
export function useDensityFlag() {
  const [density, setDensity] = useState<boolean | null>(null)
  useEffect(() => {
    let alive = true
    fetch('/api/config/flags', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { ui_density_v1: false }))
      .then(b => { if (alive) setDensity(!!b.ui_density_v1) })
      .catch(() => { if (alive) setDensity(false) })
    return () => { alive = false }
  }, [])
  return density
}
