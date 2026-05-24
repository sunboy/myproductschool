import Image from 'next/image'
import type { CSSProperties } from 'react'

type BrandImageProps = {
  className?: string
  priority?: boolean
  sizes?: string
  style?: CSSProperties
}

export function HackProductWordmark({ className, priority, sizes = '220px', style }: BrandImageProps) {
  return (
    <Image
      src="/images/wordmark.png"
      alt="HackProduct"
      width={2172}
      height={724}
      className={className}
      priority={priority}
      sizes={sizes}
      style={style}
    />
  )
}

export function HackProductLogoMark({ className, priority, sizes = '64px', style }: BrandImageProps) {
  return (
    <Image
      src="/images/logo.png"
      alt="HackProduct logo"
      width={1254}
      height={1254}
      className={className}
      priority={priority}
      sizes={sizes}
      style={style}
    />
  )
}
