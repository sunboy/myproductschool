'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

const STEP_PILLS = [
  { id: 'frame', label: 'Frame', active: true },
  { id: 'list', label: 'List', active: false },
  { id: 'optimize', label: 'Optimize', active: false },
  { id: 'win', label: 'Win', active: false },
]

export default function CalibrationFramePage() {
  const router = useRouter()
  const [assumptions, setAssumptions] = useState('')
  const [reframe, setReframe] = useState('')
  const [seconds, setSeconds] = useState(522) // 08:42
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleNext = async () => {
    setIsSubmitting(true)
    try {
      await fetch('/api/onboarding/calibration/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          move: 'frame',
          answers: { assumptions, reframe },
        }),
      })
    } catch {
      // Non-fatal — proceed regardless
    } finally {
      setIsSubmitting(false)
      router.push('/onboarding/results')
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface overflow-x-hidden">
      {/* Top Bar */}
      <header className="flex justify-between items-center w-full px-6 h-12 sticky top-0 z-50 bg-background border-b border-outline-variant shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-headline text-primary font-bold text-sm tracking-tight">
            Calibration Challenge
          </span>
        </div>

        {/* Center Step Pills */}
        <nav className="hidden md:flex items-center gap-5 relative">
          {STEP_PILLS.map((step, i) => (
            <div key={step.id} className="relative z-10 flex items-center">
              <div
                className={`flex items-center justify-center w-[100px] h-[36px] rounded-full text-xs font-bold ${
                  step.active
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant font-medium'
                }`}
              >
                {step.label}
              </div>
              {i < STEP_PILLS.length - 1 && (
                <div className="absolute left-full top-1/2 w-5 h-[2px] bg-outline-variant -translate-y-1/2 z-0" />
              )}
            </div>
          ))}
        </nav>

        {/* Right Side Stats */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end leading-none">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
              Step 1 of 4
            </span>
            <div className="flex items-center gap-1 text-primary font-mono font-bold">
              <span className="material-symbols-outlined text-sm">timer</span>
              <span>{formatTime(seconds)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center px-4 py-8 w-full max-w-screen-xl mx-auto overflow-y-auto pb-32">
        <div className="w-full max-w-[800px]">
          {/* Hatch Intro Banner */}
          <div className="bg-surface-container-low rounded-xl p-5 mb-6 flex items-start gap-4 border border-outline-variant/30">
            <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
              <HatchGlyph size={40} state="listening" className="text-primary" />
            </div>
            <div className="flex-grow">
              <p className="text-sm text-on-surface font-medium leading-relaxed">
                &ldquo;I&apos;ll assess how you <span className="text-primary font-bold">Frame</span> the problem space. There are no right answers — I&apos;m looking at how you think, not what you know.&rdquo;
              </p>
            </div>
          </div>

          {/* Challenge Prompt Card */}
          <section className="bg-surface-container-lowest shadow-sm rounded-xl border border-outline-variant/20 p-6 mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                AI-Assisted
              </span>
              <span className="bg-primary-fixed text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Product Strategy
              </span>
              <span className="bg-tertiary-container text-tertiary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                B2C
              </span>
            </div>
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-3 leading-tight">
              Spotify is seeing a 15% drop in podcast listening among 25-34 year olds
            </h2>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              You&apos;re the PM. What&apos;s the real problem here — and how would you frame it for your team?
            </p>
          </section>

          {/* Question Area */}
          <div className="space-y-8">
            {/* Question 1 */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-xs">
                  1
                </span>
                What assumptions are baked into the way this problem was stated?
              </label>
              <div className="relative">
                <textarea
                  value={assumptions}
                  onChange={(e) => setAssumptions(e.target.value.slice(0, 500))}
                  className="w-full bg-surface-container border border-outline-variant/50 rounded-lg p-4 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-on-surface-variant/40 resize-none"
                  placeholder="Think about what the data does and doesn't tell you..."
                  rows={6}
                />
                <div className="absolute bottom-3 right-4 text-[10px] font-bold text-on-surface-variant/60 uppercase">
                  {assumptions.length} / 500
                </div>
              </div>
            </div>

            {/* Question 2 */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-xs">
                  2
                </span>
                How would you reframe this problem to open up more solution space?
              </label>
              <div className="relative">
                <textarea
                  value={reframe}
                  onChange={(e) => setReframe(e.target.value.slice(0, 500))}
                  className="w-full bg-surface-container border border-outline-variant/50 rounded-lg p-4 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-on-surface-variant/40 resize-none"
                  placeholder="A good reframe changes what solutions become possible..."
                  rows={6}
                />
                <div className="absolute bottom-3 right-4 text-[10px] font-bold text-on-surface-variant/60 uppercase">
                  {reframe.length} / 500
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Bar */}
      <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-between items-center px-8 py-4 bg-background border-t border-outline-variant shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        {/* Left: Back (disabled on first step) */}
        <button
          className="flex items-center gap-2 text-secondary opacity-50 cursor-not-allowed font-label text-sm font-bold"
          disabled
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Back</span>
        </button>

        {/* Center: Hatch Tip */}
        <div className="hidden lg:flex items-center gap-3 max-w-md">
          <HatchGlyph size={24} state="none" className="text-on-surface-variant opacity-70 grayscale" />
          <span className="text-xs text-on-surface-variant italic">
            &ldquo;Take your time. Hatch sees your reasoning, not just keywords.&rdquo;
          </span>
        </div>

        {/* Right: Primary Next Action */}
        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className="bg-primary text-on-primary rounded-full px-10 py-3 font-label font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-70"
        >
          <span>{isSubmitting ? 'Saving...' : 'Next: List'}</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </footer>
    </div>
  )
}
