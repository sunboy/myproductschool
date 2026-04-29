'use client'

import { useState } from 'react'
import type { LiveInterviewPersona } from '@/lib/mock-live-interviews'
import type { ScenarioBrief } from './page'
import { EntryModeCards } from '@/components/live-interviews/EntryModeCards'
import { DisciplineFilterStrip, type InterviewDiscipline } from '@/components/live-interviews/DisciplineFilterStrip'
import FilteredPersonaGrid from './FilteredPersonaGrid'
import PastInterviews from './PastInterviews'

export function LiveInterviewsShell({
  personas,
  scenarios,
}: {
  personas: LiveInterviewPersona[]
  scenarios: ScenarioBrief[]
}) {
  const [disciplineFilter, setDisciplineFilter] = useState<InterviewDiscipline>('all')

  return (
    <section className="flex flex-col gap-6">
      <EntryModeCards />
      <div>
        <h2 className="font-headline font-bold text-on-surface text-sm mb-3">Or pick a persona directly</h2>
        <DisciplineFilterStrip active={disciplineFilter} onChange={setDisciplineFilter} />
      </div>
      <FilteredPersonaGrid personas={personas} scenarios={scenarios} disciplineFilter={disciplineFilter} />
      <PastInterviews />
    </section>
  )
}
