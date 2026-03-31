'use client'

import { useEffect, useState } from 'react'

const WORDS = ['Engineers', 'PMs', 'Students']
const INTERVAL = 2500

export function CyclingText() {
  const [index, setIndex] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimating(true)
      setTimeout(() => {
        setIndex(i => (i + 1) % WORDS.length)
        setAnimating(false)
      }, 300)
    }, INTERVAL)
    return () => clearInterval(timer)
  }, [])

  return (
    <span className="inline-block relative align-bottom" style={{ minWidth: '5ch' }}>
      <span
        className={`inline-block text-primary transition-all duration-300 ${
          animating
            ? 'opacity-0 -translate-y-3'
            : 'opacity-100 translate-y-0'
        }`}
      >
        {WORDS[index]}
      </span>
    </span>
  )
}
