'use client'

import { useEffect } from 'react'
import { useHatchSonics, type HatchSound } from '@/hooks/useHatchSonics'

const VALID_SOUNDS = new Set<HatchSound>([
  'open',
  'close',
  'send',
  'reply',
  'draw',
  'nudge',
  'submit',
  'success',
  'error',
])

function isDisabled(element: HTMLElement) {
  if (element.getAttribute('aria-disabled') === 'true') return true
  if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) {
    return element.disabled
  }
  return false
}

export function HatchSonicSurface() {
  const { play } = useHatchSonics()

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented) return

      const target = event.target as HTMLElement | null
      const element = target?.closest<HTMLElement>('[data-hatch-sound]')
      if (!element || isDisabled(element)) return

      const sound = element.dataset.hatchSound as HatchSound | undefined
      if (!sound || !VALID_SOUNDS.has(sound)) return

      play(sound)
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [play])

  return null
}
