'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

const DISCIPLINES = [
  { label: 'Coding', icon: 'data_object', color: '#3b6ed4', copy: 'Implement fast, explain clearly' },
  { label: 'SQL', icon: 'database', color: '#6d4cc2', copy: 'Query the right grain' },
  { label: 'Product sense', icon: 'psychology', color: '#4a7c59', copy: 'Make sharper product calls' },
  { label: 'Data modeling', icon: 'account_tree', color: '#7a5c2e', copy: 'Design durable entities' },
  { label: 'System design', icon: 'hub', color: '#c66a3b', copy: 'Scale with tradeoffs named' },
] as const

const FLOW_STEPS = [
  { letter: 'F', title: 'Frame', icon: 'center_focus_strong', copy: 'What is the real problem?' },
  { letter: 'L', title: 'List', icon: 'format_list_bulleted', copy: 'What options and edges exist?' },
  { letter: 'O', title: 'Optimize', icon: 'tune', copy: 'What is the right tradeoff?' },
  { letter: 'W', title: 'Win', icon: 'emoji_events', copy: 'How do you make it land?' },
] as const

function SignalMesh() {
  return (
    <svg viewBox="0 0 620 360" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
      <path d="M62 256 C150 70, 282 296, 388 104 C450 -8, 508 88, 566 34" stroke="#8ecf9e" strokeWidth="3" strokeLinecap="round" opacity="0.32" />
      <path d="M70 82 C170 142, 204 42, 304 116 C404 190, 480 150, 558 232" stroke="#f0c36a" strokeWidth="2" strokeDasharray="8 10" strokeLinecap="round" opacity="0.28" />
      {[
        [62, 256, '#8ecf9e'],
        [180, 132, '#7aa7ff'],
        [304, 116, '#c89df5'],
        [388, 104, '#f0c36a'],
        [558, 232, '#f5a76c'],
      ].map(([cx, cy, fill], index) => (
        <g key={index}>
          <circle cx={Number(cx)} cy={Number(cy)} r="24" fill={String(fill)} opacity="0.12" />
          <circle cx={Number(cx)} cy={Number(cy)} r="7" fill={String(fill)} />
        </g>
      ))}
    </svg>
  )
}

export default function WelcomePage() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cleanup = () => {}

    import('gsap').then(({ gsap }) => {
      if (!rootRef.current) return
      const ctx = gsap.context(() => {
        gsap.from('[data-gsap="hero"]', {
          opacity: 0,
          y: 18,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.08,
        })
        gsap.from('[data-gsap="discipline"]', {
          opacity: 0,
          y: 24,
          rotate: -2,
          duration: 0.7,
          ease: 'back.out(1.4)',
          stagger: 0.08,
          delay: 0.35,
        })
        gsap.to('[data-gsap="hatch"]', {
          y: -7,
          duration: 2.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      }, rootRef)
      cleanup = () => ctx.revert()
    }).catch(() => {})

    return () => cleanup()
  }, [])

  return (
    <div ref={rootRef} className="min-h-screen overflow-hidden bg-background">
      <header className="fixed top-0 z-40 w-full border-b border-outline-variant/55 bg-background/82 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5">
          <Link href="/dashboard" className="flex items-center gap-2 no-underline">
            <HatchGlyph size={30} state="idle" className="text-primary" />
            <span className="font-headline text-xl font-black text-primary">HackProduct</span>
          </Link>
          <Link href="/dashboard" data-hatch-sound="close" className="text-xs font-label font-bold text-primary no-underline hover:underline">
            Skip for now
          </Link>
        </div>
      </header>

      <main className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-5 pb-16 pt-24 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1fr)] lg:px-8">
        <section className="relative z-10">
          <div data-gsap="hero" className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/18 bg-primary-fixed/70 px-3 py-1 text-[11px] font-label font-black uppercase tracking-[0.12em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            AI-native skill calibration
          </div>

          <h1 data-gsap="hero" className="m-0 max-w-3xl font-headline text-[44px] font-black leading-[0.98] tracking-tight text-on-surface sm:text-[60px] lg:text-[72px]">
            Hatch builds your path across the whole job.
          </h1>

          <p data-gsap="hero" className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-on-surface-variant sm:text-lg">
            Two minutes of choices tells Hatch how you frame, decompose, trade off, and land decisions across product, systems, data, SQL, and code.
          </p>

          <div data-gsap="hero" className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/onboarding/role"
              data-hatch-sound="open"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-label font-black text-on-primary no-underline shadow-[0_16px_34px_-22px_rgba(74,124,89,0.85)] transition-transform hover:scale-[1.02] active:scale-95"
            >
              Start calibration
              <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
            </Link>
            <Link
              href="/calibration"
              data-hatch-sound="open"
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-6 py-3 text-sm font-label font-black text-on-surface no-underline transition-colors hover:bg-surface-container"
            >
              Jump to the quest
              <span className="material-symbols-outlined text-[17px]">bolt</span>
            </Link>
          </div>

          <div data-gsap="hero" className="mt-8 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
            {FLOW_STEPS.map(step => (
              <div key={step.letter} className="rounded-xl border border-outline-variant/55 bg-surface-container-low p-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[11px] font-black text-on-primary">
                    {step.letter}
                  </span>
                  <span className="material-symbols-outlined text-[17px] text-primary">
                    {step.icon}
                  </span>
                </div>
                <div className="mt-3 font-headline text-sm font-bold text-on-surface">{step.title}</div>
                <div className="mt-1 text-[11px] font-semibold leading-tight text-on-surface-variant">{step.copy}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative min-h-[560px]">
          <div className="absolute inset-0 rounded-[36px] border border-outline-variant bg-[#1e3528] shadow-[0_30px_90px_-56px_rgba(30,53,40,0.95)]" />
          <SignalMesh />

          <div data-gsap="hatch" className="absolute left-1/2 top-16 z-10 -translate-x-1/2">
            <div className="relative">
              <HatchGlyph size={118} state="celebrating" className="text-primary-fixed-dim drop-shadow-[0_22px_36px_rgba(0,0,0,0.38)]" />
              <div className="absolute -right-8 top-2 rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-label font-black uppercase tracking-[0.10em] text-[#f3ede0] backdrop-blur">
                Hatch
              </div>
            </div>
          </div>

          <div className="absolute inset-x-5 bottom-5 z-10 grid gap-3 sm:grid-cols-5">
            {DISCIPLINES.map((discipline) => (
              <div
                key={discipline.label}
                data-gsap="discipline"
                className="min-h-[128px] rounded-2xl border border-white/10 bg-white/[0.085] p-4 backdrop-blur-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="material-symbols-outlined text-[24px]" style={{ color: discipline.color, fontVariationSettings: "'FILL' 1" }}>
                    {discipline.icon}
                  </span>
                  <span className="h-2 w-2 rounded-full" style={{ background: discipline.color }} />
                </div>
                <div className="mt-6 font-headline text-[15px] font-bold leading-tight text-[#f3ede0]">
                  {discipline.label}
                </div>
                <div className="mt-1 text-[11px] font-semibold leading-tight text-[#f3ede0]/55">
                  {discipline.copy}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
