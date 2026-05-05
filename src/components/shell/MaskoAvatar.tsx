'use client'

import type { CSSProperties } from 'react'

interface MaskoAvatarProps {
  size?: number
  className?: string
  style?: CSSProperties
}

export function MaskoAvatar({ size = 120, className = '', style }: MaskoAvatarProps) {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', ...style }}
    >
      <source
        src="https://assets.masko.ai/abe42b/gradie-1e03/enthusiastic-wave-c1ee6c4e.webm"
        type="video/webm"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://assets.masko.ai/abe42b/gradie-1e03/enthusiastic-wave-08bacd74.png"
        alt="Hatch mascot"
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
      />
    </video>
  )
}
