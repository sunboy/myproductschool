'use client'
import { GOAL_OPTIONS, TIMELINE_OPTIONS, CONTEXT_OPTIONS } from '@/components/onboarding/CalibrationFlow'

export function GoalStep({ goal, timeline, context, company, onGoal, onTimeline, onContext, onCompany }: { goal: string | null; timeline: string | null; context: string | null; company: string; onGoal: (v: string) => void; onTimeline: (v: string) => void; onContext: (v: string) => void; onCompany: (v: string) => void }) {
  const chip = (active: boolean) => `rounded-full border px-4 py-2.5 text-body font-semibold ${active ? 'border-forest-800 bg-forest-800 text-white' : 'border-hairline bg-card-bright hover:bg-surface-container'}`
  const reveal = TIMELINE_OPTIONS.find(t => t.id === timeline)?.revealCompany
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-2.5 text-ui font-bold"><span className="text-error">*</span> What does winning look like in the next few months?</div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {GOAL_OPTIONS.map(g => (
            <button key={g.id} type="button" data-testid={`goal-${g.id}`} aria-pressed={goal === g.id} onClick={() => onGoal(g.id)} className={`flex items-center gap-2.5 rounded-xl border px-4 py-3.5 text-left text-body ${goal === g.id ? 'border-forest-800 bg-primary-fixed' : 'border-hairline bg-card-bright'}`}>
              <i className={`block size-[18px] rounded-full border-2 ${goal === g.id ? 'border-forest-800 bg-forest-800' : 'border-outline-variant'}`} />{g.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2.5 text-ui font-bold"><span className="text-error">*</span> Timeline</div>
        <div className="flex flex-wrap gap-2">
          {TIMELINE_OPTIONS.map(t => (
            <button key={t.id} type="button" data-testid={`timeline-${t.id}`} aria-pressed={timeline === t.id} onClick={() => onTimeline(t.id)} className={chip(timeline === t.id)}>{t.label}</button>
          ))}
        </div>
        {reveal && <input data-testid="target-company" value={company} onChange={e => onCompany(e.target.value)} placeholder="Target company (optional)" className="mt-2.5 w-full max-w-[360px] rounded-lg border border-hairline bg-card-bright px-3 py-2 text-body" />}
      </div>
      <div>
        <div className="mb-2.5 text-ui font-bold"><span className="text-error">*</span> Context</div>
        <div className="flex flex-wrap gap-2">
          {CONTEXT_OPTIONS.map(c => (
            <button key={c.id} type="button" data-testid={`context-${c.id}`} aria-pressed={context === c.id} onClick={() => onContext(c.id)} className={chip(context === c.id)}>{c.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
