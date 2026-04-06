'use client'

import { cn } from '@/lib/utils'
import type { IllustrationConfig } from '@/lib/types'
import { IllustrationStatic } from './illustrations/IllustrationStatic'
import { IllustrationAnimated } from './illustrations/IllustrationAnimated'

interface Props {
  config: IllustrationConfig
  isVisible?: boolean
  className?: string
}

export function Illustration({ config, isVisible = false, className }: Props) {
  const mode = process.env.NEXT_PUBLIC_ILLUSTRATION_MODE ?? 'static'
  if (mode === 'animated') {
    return <IllustrationAnimated config={config} isVisible={isVisible} className={className} />
  }
  return <IllustrationStatic config={config} isVisible={isVisible} className={className} />
}
