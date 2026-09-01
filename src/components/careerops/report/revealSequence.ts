// Single source of truth for the score-reveal choreography. Times in ms,
// delays consumed by framer-motion in seconds (divide by 1000 at call site).

export const reveal = {
  // Hero ink card springs in immediately with the phase container.
  heroDelayMs: 0,
  // Hatch pops in just after the hero lands.
  hatchDelayMs: 150,
  // Gauge sweep + count-up window.
  gaugeDelayMs: 250,
  gaugeDurationMs: 1200,
  // The card cascade below the hero opens once the gauge passes this progress,
  // so the page feels alive before the number settles.
  cascadeStartProgress: 0.6,
  cascadeStaggerSec: 0.08,
  // Per-card inner delays.
  barFillDelayMs: 120,
  chipPopDelaySec: 0.06,
} as const

// Shared hover treatment for bento cards.
export const cardHover = {
  y: -2,
  transition: { type: 'spring' as const, stiffness: 360, damping: 30 },
}
