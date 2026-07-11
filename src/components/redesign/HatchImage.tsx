'use client'

import { useState } from 'react'
import Image from 'next/image'

/**
 * @deprecated HatchGlyph (src/components/shell/HatchGlyph.tsx) is retired for
 * rendering in redesigned surfaces (Stage B, founder override documented in
 * docs/redesign/round4-codex-direction/LOOP.md, "B0. Hatch asset system").
 * Every Hatch render in the redesign uses real generated images via
 * <HatchImage /> below. Do NOT import HatchGlyph in anything under
 * src/components/redesign/ or in any page/route touched by the redesign
 * phases — it stays only for legacy (pre-redesign) pages until their phase
 * lands.
 */

export type HatchImageState =
  | 'idle'
  | 'wave'
  | 'listening'
  | 'reviewing'
  | 'speaking'
  | 'celebrating'
  | 'thinking'
  | 'reading'
  | 'writing'
  | 'presenting'
  | 'pointing'
  | 'avatar'

/**
 * Fallback asset to use for a given v2 state until its generated PNG lands in
 * public/hatch/v2/. Keyed to the pre-existing statics referenced in the
 * round4 previews (docs/redesign/previews/round4/*.html) — avatar.png,
 * pose-thinking.png, pose-reading.png, pose-writing.png, pose-chart.png.
 */
const HATCH_FALLBACK_MAP: Record<HatchImageState, string> = {
  idle: '/hatch/avatar.png',
  wave: '/hatch/pose-chart.png',
  listening: '/hatch/pose-reading.png',
  reviewing: '/hatch/pose-thinking.png',
  speaking: '/hatch/avatar.png',
  celebrating: '/hatch/pose-chart.png',
  thinking: '/hatch/pose-thinking.png',
  reading: '/hatch/pose-reading.png',
  writing: '/hatch/pose-writing.png',
  presenting: '/hatch/pose-chart.png',
  pointing: '/hatch/pose-chart.png',
  avatar: '/hatch/avatar.png',
}

/**
 * Canonical state -> /hatch/v2/{state}.png map. Exported so later phases
 * (B12 Hatch contextuality sweep, no-stub/no-mock audits) can grep every
 * state this component knows how to render and cross-check it against real
 * usages instead of re-deriving the list by hand.
 */
export const HATCH_STATE_MAP: Record<HatchImageState, { v2Src: string; fallbackSrc: string }> =
  (Object.keys(HATCH_FALLBACK_MAP) as HatchImageState[]).reduce(
    (map, state) => {
      map[state] = {
        v2Src: `/hatch/v2/${state}.png`,
        fallbackSrc: HATCH_FALLBACK_MAP[state],
      }
      return map
    },
    {} as Record<HatchImageState, { v2Src: string; fallbackSrc: string }>
  )

export interface HatchImageProps {
  /** Which Hatch pose to render. */
  state: HatchImageState
  /** Square render size in px (width and height). Defaults to 48. */
  size?: number
  className?: string
  /** Forwarded to next/image; set true for above-the-fold hero mascots. */
  priority?: boolean
  /** Alt text override. Defaults to a state-derived description. */
  alt?: string
}

const DEFAULT_ALT: Record<HatchImageState, string> = {
  idle: 'Hatch, standing idle',
  wave: 'Hatch waving',
  listening: 'Hatch listening',
  reviewing: 'Hatch reviewing',
  speaking: 'Hatch speaking',
  celebrating: 'Hatch celebrating',
  thinking: 'Hatch thinking',
  reading: 'Hatch reading',
  writing: 'Hatch writing',
  presenting: 'Hatch presenting',
  pointing: 'Hatch pointing',
  avatar: 'Hatch',
}

/**
 * Renders a Hatch pose as a real generated image (public/hatch/v2/{state}.png).
 * Until the v2 asset generation batch (Codex/gpt-image-1, see
 * docs/redesign/round4-codex-direction/generate-hatch-assets.mjs) finishes
 * landing all 12 files, any state whose v2 PNG isn't present yet falls back
 * to the pre-existing statics (avatar.png / pose-*.png) via an onError swap.
 * This makes rendering robust to generation timing — no build-time check,
 * no manifest to keep in sync.
 */
export function HatchImage({ state, size = 48, className = '', priority = false, alt }: HatchImageProps) {
  const { v2Src, fallbackSrc } = HATCH_STATE_MAP[state]
  const [src, setSrc] = useState(v2Src)

  return (
    <Image
      key={state}
      src={src}
      alt={alt ?? DEFAULT_ALT[state]}
      width={size}
      height={size}
      priority={priority}
      unoptimized
      className={`shrink-0 object-contain ${className}`}
      onError={() => {
        if (src !== fallbackSrc) setSrc(fallbackSrc)
      }}
    />
  )
}
