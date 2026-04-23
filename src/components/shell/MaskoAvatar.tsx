'use client'

interface MaskoAvatarProps {
  size?: number
  className?: string
}

export function MaskoAvatar({ size = 120, className = '' }: MaskoAvatarProps) {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    >
      <source
        src="https://assets.masko.ai/abe42b/gradie-1e03/enthusiastic-wave-c1ee6c4e.webm"
        type="video/webm"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://assets.masko.ai/abe42b/gradie-1e03/enthusiastic-wave-08bacd74.png"
        alt="Luma mascot"
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
      />
    </video>
  )
}
