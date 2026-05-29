'use client'

import type { CSSProperties } from 'react'
import type { HatchAnimation } from '@/context/HatchContext'

interface MaskoAvatarProps {
  size?: number
  className?: string
  style?: CSSProperties
  animation?: HatchAnimation
}

type MaskoAsset = {
  webm: string
  hevc?: string
  png: string
}

const DEFAULT_MASKO_ASSET: MaskoAsset = {
  webm: 'https://assets.masko.ai/abe42b/gradie-1e03/enthusiastic-wave-c1ee6c4e.webm',
  png: 'https://assets.masko.ai/abe42b/gradie-1e03/enthusiastic-wave-08bacd74.png',
}

export const HATCH_MASKO_ANIMATION_ASSETS: Record<HatchAnimation, MaskoAsset> = {
  'idle-hover': DEFAULT_MASKO_ASSET,
  listening: DEFAULT_MASKO_ASSET,
  thinking: DEFAULT_MASKO_ASSET,
  reviewing: DEFAULT_MASKO_ASSET,
  celebrating: DEFAULT_MASKO_ASSET,
  wake: DEFAULT_MASKO_ASSET,
  peek: DEFAULT_MASKO_ASSET,
  point: DEFAULT_MASKO_ASSET,
  guide: DEFAULT_MASKO_ASSET,
  dance: DEFAULT_MASKO_ASSET,
  spin: DEFAULT_MASKO_ASSET,
  'stuck-check': DEFAULT_MASKO_ASSET,
  observing: DEFAULT_MASKO_ASSET,
  drawing: DEFAULT_MASKO_ASSET,
  caution: DEFAULT_MASKO_ASSET,
  nudging: DEFAULT_MASKO_ASSET,
  wave: DEFAULT_MASKO_ASSET,
  lead: DEFAULT_MASKO_ASSET,
  land: DEFAULT_MASKO_ASSET,
}

export function MaskoAvatar({
  size = 120,
  className = '',
  style,
  animation = 'wave',
}: MaskoAvatarProps) {
  const asset = HATCH_MASKO_ANIMATION_ASSETS[animation] ?? DEFAULT_MASKO_ASSET

  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', ...style }}
      data-hatch-masko-state={animation}
    >
      <source
        src={asset.webm}
        type="video/webm"
      />
      {asset.hevc && <source src={asset.hevc} type='video/mp4; codecs="hvc1"' />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.png}
        alt="Hatch mascot"
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
      />
    </video>
  )
}
