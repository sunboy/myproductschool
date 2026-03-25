'use client'
import Image from 'next/image'

export type LumaState = 'idle' | 'listening' | 'reviewing' | 'speaking' | 'celebrating' | 'none'

interface LumaGlyphProps {
  size?: number
  className?: string
  /** @deprecated Use state='idle' instead */
  animated?: boolean
  state?: LumaState
}

export function LumaGlyph({ size = 32, className = '', animated = false }: LumaGlyphProps) {
  return (
    <Image
      src="/images/hackylogo.png"
      alt="Luma"
      width={size}
      height={size}
      className={`${animated ? 'animate-luma-glow' : ''} ${className}`.trim()}
    />
  )
}
