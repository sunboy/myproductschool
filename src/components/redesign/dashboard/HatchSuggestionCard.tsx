'use client'

import { MessageCircle } from 'lucide-react'
import { HatchImage } from '@/components/redesign/HatchImage'

export function HatchSuggestionCard({ message, prompt }: { message: string; prompt: string }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-gold/30 bg-amber-soft p-5" aria-labelledby="hatch-suggestion-title">
      <div aria-hidden className="absolute -bottom-12 -right-10 size-36 rounded-full bg-gold/20 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <HatchImage state="thinking" size={54} className="shrink-0 drop-shadow-sm" />
        <div className="min-w-0">
          <p className="font-label text-xs font-extrabold uppercase tracking-[.11em] text-flame">A suggestion from Hatch</p>
          <h2 id="hatch-suggestion-title" className="mt-1 font-headline text-xl font-semibold text-ink-strong">Make today’s choice easier.</h2>
        </div>
      </div>
      <p className="relative mt-3 text-base leading-relaxed text-ink-secondary">{message}</p>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('open-ask-hatch', { detail: { prompt } }))}
        className="relative mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-forest-800 px-4 py-2.5 text-sm font-extrabold text-white transition-transform hover:-translate-y-0.5"
      >
        <MessageCircle size={14} /> Ask Hatch
      </button>
    </section>
  )
}
