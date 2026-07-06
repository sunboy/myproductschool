'use client'

// FeedbackShell — the tiered feedback layout: a hero band that lands, a
// key-takeaway row, then detail sections. Replaces the wall-of-identical-
// cards with visual rhythm. The entrance timeline is the pattern from
// AnalyticsSessionMirror, extracted (hero first, then sections stagger in).

import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'

interface FeedbackShellProps {
  /** The hero band: ScoreHero + headline + primary CTAs. Rendered loudest. */
  hero: ReactNode
  /** Optional key-takeaway row (top strength / top fix), second loudest. */
  takeaway?: ReactNode
  /** Detail sections, each wrapped in a titled band. */
  children: ReactNode
  className?: string
}

export function FeedbackShell({ hero, takeaway, children, className = '' }: FeedbackShellProps) {
  const rootRef = useFeedbackEntrance()
  return (
    <div ref={rootRef} className={`flex flex-col gap-5 ${className}`}>
      <section
        data-fb-hero
        className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-5 py-6 sm:px-8 editorial-shadow"
      >
        {hero}
      </section>
      {takeaway && (
        <section data-fb-section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {takeaway}
        </section>
      )}
      <div className="flex flex-col gap-5 [&>*]:min-w-0">
        {children}
      </div>
    </div>
  )
}

/** A titled detail band inside the shell (third tier). */
export function FeedbackSection({ title, icon, children, subdued = false }: {
  title: string
  icon?: string
  children: ReactNode
  /** Subdued sections skip the card chrome (e.g. link rows). */
  subdued?: boolean
}) {
  return (
    <section data-fb-section className={subdued ? '' : 'rounded-xl border border-outline-variant bg-surface-container-low p-4 sm:p-5'}>
      <div className="flex items-center gap-2 mb-3">
        {icon && (
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>{icon}</span>
        )}
        <h2 className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">{title}</h2>
      </div>
      {children}
    </section>
  )
}

/** The takeaway card pair (top strength / top fix) used in the second tier. */
export function TakeawayCard({ kind, text }: { kind: 'strength' | 'fix'; text: string }) {
  const strength = kind === 'strength'
  return (
    <div className={`rounded-xl px-4 py-3.5 ${strength ? 'bg-primary-fixed/40' : 'bg-tertiary-container/25'}`}>
      <p className={`font-label text-[10px] font-bold uppercase tracking-wide mb-1 ${strength ? 'text-primary' : 'text-tertiary'}`}>
        {strength ? 'Strongest move' : 'Biggest lever'}
      </p>
      <p className="font-body text-sm text-on-surface leading-relaxed">{text}</p>
    </div>
  )
}

/** The mirror's entrance pattern: hero pops first, sections stagger after. */
export function useFeedbackEntrance() {
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const hero = root.querySelector('[data-fb-hero]')
    const sections = root.querySelectorAll('[data-fb-section]')
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
    if (hero) tl.fromTo(hero, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 })
    if (sections.length) {
      tl.fromTo(sections, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.08 }, '-=0.15')
    }
    return () => { tl.kill() }
  }, [])
  return rootRef
}
