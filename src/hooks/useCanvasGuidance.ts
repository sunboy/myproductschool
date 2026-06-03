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
}: UseCanvasGuidanceArgs): GuidanceState {
  return useMemo(
    () => deriveGuidance(challengeType, scene, fields),
    [challengeType, scene, fields]
  )
}

export default useCanvasGuidance
