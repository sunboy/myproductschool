'use client'
import { Sparkles, Compass, MessageCircle, ArrowUp } from 'lucide-react'
import { HatchImage } from '@/components/redesign/HatchImage'
import { Card, Chip, Text } from '@/design'

export interface HatchPrompt { label: string; prompt?: string; event?: 'start-intro-tour' }

function run(p: HatchPrompt) {
  if (p.event) { window.dispatchEvent(new Event(p.event)); return }
  window.dispatchEvent(new CustomEvent('open-ask-hatch', { detail: { prompt: p.prompt ?? p.label } }))
}

/** Input-shaped trigger that opens the Hatch chat with focus. */
export function AskHatchField({ placeholder = 'Ask Hatch anything…', testId = 'ask-hatch-field' }: { placeholder?: string; testId?: string }) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={() => window.dispatchEvent(new CustomEvent('open-ask-hatch', { detail: { focus: true } }))}
      className="flex h-9 w-full items-center gap-2 rounded-control border border-hairline-strong bg-page-field pl-3 pr-1.5 text-left text-ui font-ui text-ink-muted transition-colors hover:border-primary-fixed hover:bg-card-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <MessageCircle size={16} aria-hidden className="shrink-0 text-ink-secondary" />
      <span className="min-w-0 flex-1 truncate">{placeholder}</span>
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-forest-800 text-white" aria-hidden><ArrowUp size={14} /></span>
    </button>
  )
}

/** "Ask Hatch": the chat's front door on the dashboard. Message, an
 *  input-shaped trigger, and tactile suggestion chips. */
export function HatchThoughtCard({ message, prompts, subtitle = 'Your coach, on this page' }: { message: string; prompts: HatchPrompt[]; subtitle?: string }) {
  return (
    <Card tone="bright" padding="sm" data-testid="hatch-thought" data-hatch-target="dashboard-hatch" className="h-full gap-2.5 px-3.5 py-3">
      <div className="flex items-center gap-2.5">
        <HatchImage state="speaking" size={34} />
        <div className="min-w-0"><Text variant="h4" as="h2" className="text-lede leading-tight">Ask Hatch</Text><Text variant="meta">{subtitle}</Text></div>
      </div>
      <p className="text-ui font-text leading-[1.45] text-on-surface">{message}</p>
      <div className="mt-auto flex flex-col gap-2">
        <AskHatchField />
        <div className="flex flex-wrap gap-1.5">
          {prompts.map(p => (
            <Chip key={p.label} variant="suggestion" data-testid="hatch-prompt" onClick={() => run(p)} icon={p.event === 'start-intro-tour' ? <Compass aria-hidden /> : <Sparkles aria-hidden />} className="max-w-full">
              <span className="truncate">{p.label}</span>
            </Chip>
          ))}
        </div>
      </div>
    </Card>
  )
}
