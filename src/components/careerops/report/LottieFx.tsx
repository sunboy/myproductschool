'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

// lottie-web is ~60KB gz — load it only when an effect actually renders, and
// fetch the animation JSON from /public so it never enters the JS bundle.
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

export type LottieFxName = 'confetti-burst' | 'sparkles-ambient' | 'scan-sweep'

interface LottieFxProps {
  name: LottieFxName
  loop?: boolean
  className?: string
  onComplete?: () => void
}

export function LottieFx({ name, loop = false, className, onComplete }: LottieFxProps) {
  const prefersReducedMotion = useReducedMotion()
  const [data, setData] = useState<object | null>(null)

  useEffect(() => {
    if (prefersReducedMotion) return
    let cancelled = false
    fetch(`/lottie/${name}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json) setData(json)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [name, prefersReducedMotion])

  if (prefersReducedMotion || !data) return null

  return (
    <Lottie
      animationData={data}
      loop={loop}
      autoplay
      onComplete={onComplete}
      className={className}
      aria-hidden
    />
  )
}
