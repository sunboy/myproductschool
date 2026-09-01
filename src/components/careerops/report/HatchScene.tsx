'use client'

import { AnimatePresence, motion } from 'framer-motion'

import { HatchMascotSprite, type HatchMascotState } from '@/components/hatch/HatchMascotSprite'
import { motionSprings } from '@/components/motion/tokens'
import { cn } from '@/lib/utils'
import { LottieFx } from './LottieFx'

export type FitScene =
  | 'empty'
  | 'typing'
  | 'loading'
  | 'reveal-high'
  | 'reveal-low'
  | 'reveal-fail'
  | 'gated'

const SCENE_SPRITE: Record<FitScene, HatchMascotState> = {
  empty: 'waiting',
  typing: 'listening',
  loading: 'thinking',
  'reveal-high': 'celebrating',
  'reveal-low': 'speaking',
  'reveal-fail': 'failed',
  gated: 'waiting',
}

const REVEAL_SCENES: FitScene[] = ['reveal-high', 'reveal-low']

interface HatchSceneProps {
  scene: FitScene
  // Override the sprite the scene maps to (e.g. swap celebrating → clapping
  // once the gauge completes).
  spriteOverride?: HatchMascotState
  size?: number
  className?: string
}

// The choreographed mascot: real raster Hatch (sprite frames), pop entrance,
// crossfade between sprite states, ambient sparkle Lottie on reveal scenes.
// The wrapper box is fixed at the sprite's 192:208 ratio so swaps never shift
// layout.
export function HatchScene({ scene, spriteOverride, size = 96, className }: HatchSceneProps) {
  const sprite = spriteOverride ?? SCENE_SPRITE[scene]
  const height = Math.round(size * (208 / 192))
  const ambient = REVEAL_SCENES.includes(scene)

  return (
    <motion.div
      initial={{ scale: 0.4, opacity: 0, y: 8 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={motionSprings.pop}
      className={cn('relative inline-flex shrink-0 items-end justify-center', className)}
      style={{ width: size, height }}
    >
      {ambient && (
        <LottieFx
          name="sparkles-ambient"
          loop
          className="pointer-events-none absolute -inset-4"
        />
      )}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={sprite}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={motionSprings.soft}
        >
          <HatchMascotSprite state={sprite} size={size} />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
