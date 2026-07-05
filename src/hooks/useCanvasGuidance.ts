'use client'

import { useMemo } from 'react'

import type { CanvasScene } from '@/lib/hatch/canvas-scene'
import {
  deriveGuidance,
  type CanvasChallengeType,
  type GuidanceField,
  type GuidanceState,
} from '@/lib/hatch/canvasGuidance'

export interface UseCanvasGuidanceArgs {
  challengeType: CanvasChallengeType
  scene: CanvasScene
  fields: GuidanceField[]
  /** Coaching register — open raises the readiness bar (SUN-253). */
  register?: 'scaffolded' | 'guided' | 'open'
}

/**
 * Memoized wrapper over deriveGuidance. Recomputes only when the challenge type,
 * scene, or fields change, so the phase-aware UI (coach card, readiness meter,
 * Hatch opener) reads one stable state per render.
 */
export function useCanvasGuidance({
  challengeType,
  scene,
  fields,
  register = 'guided',
}: UseCanvasGuidanceArgs): GuidanceState {
  return useMemo(
    () => deriveGuidance(challengeType, scene, fields, register),
    [challengeType, scene, fields, register]
  )
}

export default useCanvasGuidance
