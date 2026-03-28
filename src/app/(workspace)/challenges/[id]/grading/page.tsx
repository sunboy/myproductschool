'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

const flowMoves = [
  { icon: 'stat_0', label: 'FRAME', key: 'frame' },
  { icon: 'view_in_ar', label: 'LENS', key: 'lens' },
  { icon: 'speed', label: 'OPTIMIZE', key: 'optimize' },
  { icon: 'auto_awesome', label: 'WIN', key: 'win' },
]

export default function GradingPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const attempt = searchParams.get('attempt') ?? 'mock'

  const [progress, setProgress] = useState<Record<string, number>>({
    frame: 0,
    lens: 0,
    optimize: 0,
    win: 0,
  })

  // Animate progress bars sequentially
  useEffect(() => {
    const keys = ['frame', 'lens', 'optimize', 'win']
    const timers: ReturnType<typeof setTimeout>[] = []

    keys.forEach((key, i) => {
      // Start each one staggered
      const startDelay = i * 800
      timers.push(
        setTimeout(() => {
          // Animate from 0 to ~80% quickly
          setProgress(prev => ({ ...prev, [key]: 65 }))
        }, startDelay),
        setTimeout(() => {
          setProgress(prev => ({ ...prev, [key]: 85 }))
        }, startDelay + 400),
        setTimeout(() => {
          setProgress(prev => ({ ...prev, [key]: 100 }))
        }, startDelay + 900),
      )
    })

    // Navigate to feedback after all complete
    const navTimer = setTimeout(() => {
      router.push(`/challenges/${id}/feedback?attempt=${attempt}`)
    }, 5000)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(navTimer)
    }
  }, [id, attempt, router])

  return (
    <div className="bg-signature-gradient min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full mx-auto text-center">
        {/* Challenge title chip */}
        <div className="inline-flex items-center bg-white/20 rounded-full px-3 py-1 mb-3">
          <span className="text-xs font-label font-semibold text-white">The Feature That Backfired</span>
        </div>

        <p className="text-xs text-white/70 font-label mb-6">Submitted just now</p>

        {/* Luma mascot with glow animation */}
        <div className="relative mx-auto w-24 h-24 mb-6">
          <div className="p-3 rounded-full bg-white/10 mx-auto w-fit animate-bounce-slow">
            <LumaGlyph size={72} className="text-white animate-luma-glow mx-auto" state="reviewing" />
          </div>
        </div>

        {/* Main headline */}
        <h1 className="font-headline text-2xl font-bold text-white leading-tight mb-1">
          Luma is grading your answer
        </h1>

        {/* Dot pulse loader */}
        <div className="dot-pulse flex items-center justify-center gap-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
        </div>

        {/* Progress items */}
        <div className="space-y-3 text-left">
          {flowMoves.map((move) => (
            <div key={move.key} className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-white flex-shrink-0"
                style={{
                  fontSize: 20,
                  fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                }}
              >
                {move.icon}
              </span>
              <span className="font-label font-semibold text-white text-xs w-20 flex-shrink-0">
                {move.label}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500 ease-out"
                  style={{ width: `${progress[move.key]}%` }}
                />
              </div>
              <span className="text-xs font-label text-white/60 flex-shrink-0 w-16 text-right">
                {progress[move.key] < 100 ? 'analyzing...' : 'done'}
              </span>
            </div>
          ))}
        </div>

        {/* Insight box */}
        <div className="mt-6 bg-white/15 rounded-2xl p-4 text-left">
          <div className="flex items-start gap-2">
            <span
              className="material-symbols-outlined text-white flex-shrink-0 mt-0.5"
              style={{
                fontSize: 18,
                fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
              }}
            >
              lightbulb
            </span>
            <p className="font-body text-xs text-white leading-relaxed">
              Engineers who explicitly segment users score 23% higher on the Lens move on average.
            </p>
          </div>
        </div>

        {/* Timing hint */}
        <p className="mt-4 text-xs text-white/50 font-label">
          This usually takes 5–10 seconds
        </p>
      </div>

      {/* Bounce animation */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
