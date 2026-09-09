import Image from 'next/image'
import { cn } from '@/lib/utils'

/** Tight wordmark at natural aspect (1524×137). Height sets the cap height. */
export function Wordmark({ tone = 'default', className, priority }: { tone?: 'default' | 'inverse'; className?: string; priority?: boolean }) {
  return (
    <Image
      src="/images/wordmark-tight.png"
      alt="HackProduct"
      width={1524}
      height={137}
      priority={priority}
      sizes="160px"
      className={cn('h-wordmark w-auto', tone === 'inverse' && 'brightness-0 invert', className)}
    />
  )
}

/** HP monogram cropped from the logo (600×470). */
export function Mark({ tone = 'default', className, priority }: { tone?: 'default' | 'inverse'; className?: string; priority?: boolean }) {
  return (
    <Image
      src="/images/logo-mark.png"
      alt="HackProduct"
      width={600}
      height={470}
      priority={priority}
      sizes="32px"
      className={cn('h-mark w-auto', tone === 'inverse' && 'brightness-0 invert', className)}
    />
  )
}

export const Brand = { Wordmark, Mark }
