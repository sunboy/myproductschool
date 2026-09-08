'use client'
import { ArrowUpRight } from 'lucide-react'
import { HatchImage } from '@/components/redesign/HatchImage'

export interface HatchPrompt { label: string; prompt?: string; event?: 'start-intro-tour' }

export function HatchThoughtCard({ message, prompts }: { message: string; prompts: HatchPrompt[] }) {
  const run = (p: HatchPrompt) => {
    if (p.event) { window.dispatchEvent(new Event(p.event)); return }
    window.dispatchEvent(new CustomEvent('open-ask-hatch', { detail: { prompt: p.prompt ?? p.label } }))
  }
  return (
    <div data-testid="hatch-thought" data-hatch-target="dashboard-hatch" className="flex h-full flex-col rounded-[14px] border border-hairline bg-card-bright px-3.5 py-3">
      <div className="flex items-center gap-2"><HatchImage state="thinking" size={28} /><div className="font-headline text-[15px] font-bold">A thought from Hatch.</div></div>
      <p className="mt-2 text-[11px] leading-[1.4] text-ink-secondary">{message}</p>
      <div className="mt-auto flex flex-col gap-1.5 border-t border-hairline pt-2">
        {prompts.map(p => (
          <button key={p.label} type="button" onClick={() => run(p)} data-testid="hatch-prompt" className="flex items-center justify-between text-left text-[11px] font-semibold text-ink-strong hover:text-primary">
            <span>{p.label}</span><ArrowUpRight size={14} aria-hidden />
          </button>
        ))}
      </div>
    </div>
  )
}
