import type { Transition, Variants } from 'framer-motion'

export const motionDurations = {
  instant: 0.12,
  fast: 0.18,
  base: 0.26,
  slow: 0.42,
} as const

export const motionSprings = {
  soft: { type: 'spring', stiffness: 220, damping: 28, mass: 0.9 } satisfies Transition,
  layout: { type: 'spring', stiffness: 360, damping: 36, mass: 0.8 } satisfies Transition,
  panel: { type: 'spring', stiffness: 260, damping: 32, mass: 0.95 } satisfies Transition,
  pop: { type: 'spring', stiffness: 420, damping: 24, mass: 0.7 } satisfies Transition,
} as const

export const motionEasing = {
  standard: [0.16, 1, 0.3, 1] as const,
  exit: [0.7, 0, 0.84, 0] as const,
} as const

export const motionVariants = {
  page: {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: motionDurations.base, ease: motionEasing.standard },
    },
  } satisfies Variants,
  section: {
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: motionDurations.base, ease: motionEasing.standard },
    },
  } satisfies Variants,
  card: {
    hidden: { opacity: 0, y: 8, scale: 0.985 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: motionSprings.soft,
    },
    exit: {
      opacity: 0,
      y: 6,
      scale: 0.985,
      transition: { duration: motionDurations.fast, ease: motionEasing.exit },
    },
  } satisfies Variants,
  list: {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.035, delayChildren: 0.02 },
    },
  } satisfies Variants,
  listItem: {
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: motionSprings.soft,
    },
    exit: {
      opacity: 0,
      y: 6,
      transition: { duration: motionDurations.fast, ease: motionEasing.exit },
    },
  } satisfies Variants,
  panel: {
    hidden: { opacity: 0, y: 10, scale: 0.985 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: motionSprings.panel,
    },
    exit: {
      opacity: 0,
      y: 8,
      scale: 0.985,
      transition: { duration: motionDurations.fast, ease: motionEasing.exit },
    },
  } satisfies Variants,
} as const

export const motionTokens = {
  durations: motionDurations,
  easing: motionEasing,
  spring: motionSprings,
  variants: motionVariants,
} as const
