'use client'

import { ArrowUpRight } from 'lucide-react'
import { HatchImage } from '@/components/redesign/HatchImage'

export function HatchSuggestionCard({ message, prompt }: { message: string; prompt: string }) {
  function ask(question: string) {
    window.dispatchEvent(new CustomEvent('open-ask-hatch', { detail: { prompt: question } }))
  }
  return <section className="learning-hatch-card" aria-labelledby="hatch-suggestion-title">
    <div className="flex items-center gap-3">
      <HatchImage state="thinking" size={43} className="shrink-0" />
      <h2 id="hatch-suggestion-title">A thought from Hatch.</h2>
    </div>
    <p>{message}</p>
    <button type="button" onClick={() => ask(prompt)}>{prompt}<ArrowUpRight size={17} className="shrink-0" /></button>
    <button type="button" onClick={() => ask('Help me choose what to learn next based on my recent work and goals.')}>
      Help me choose what to learn next<ArrowUpRight size={17} className="shrink-0" />
    </button>
  </section>
}
