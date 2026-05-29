'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export interface PracticeCatalogItem {
  slug: string
  title: string
  summary: string
  discipline: string
  href: string
  flowMoves: string[]
  goals: string[]
}

const ALL = 'All'

export function PracticeCatalogClient({ items }: { items: PracticeCatalogItem[] }) {
  const [discipline, setDiscipline] = useState(ALL)
  const [flowMove, setFlowMove] = useState(ALL)
  const [goal, setGoal] = useState(ALL)

  const disciplines = useMemo(() => [ALL, ...Array.from(new Set(items.map((item) => item.discipline)))], [items])
  const flowMoves = [ALL, 'Frame', 'List', 'Optimize', 'Win']
  const goals = [
    ALL,
    'Interview prep',
    'Role transition',
    'Promotion readiness',
    'Salary proof',
    'AI-native growth',
  ]

  const filtered = items.filter((item) => {
    const disciplineMatch = discipline === ALL || item.discipline === discipline
    const flowMatch = flowMove === ALL || item.flowMoves.includes(flowMove)
    const goalMatch = goal === ALL || item.goals.includes(goal)
    return disciplineMatch && flowMatch && goalMatch
  })

  return (
    <div className="space-y-8">
      <div className="grid gap-4 rounded-xl bg-surface-container-lowest p-4 ring-1 ring-outline-variant/35 lg:grid-cols-3">
        <FilterGroup label="Discipline" options={disciplines} value={discipline} onChange={setDiscipline} />
        <FilterGroup label="FLOW move" options={flowMoves} value={flowMove} onChange={setFlowMove} />
        <FilterGroup label="Career goal" options={goals} value={goal} onChange={setGoal} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <Card key={item.slug} className="rounded-xl bg-surface-container-lowest shadow-sm ring-1 ring-outline-variant/35">
            <CardContent className="flex h-full flex-col p-5">
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge variant="outline">{item.discipline}</Badge>
                {item.flowMoves.map((move) => (
                  <Badge key={move} className="bg-primary-fixed text-on-primary-fixed">{move}</Badge>
                ))}
              </div>
              <h3 className="font-headline text-xl font-semibold leading-tight text-on-surface">{item.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-on-surface-variant">{item.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {item.goals.map((tag) => (
                  <span key={tag} className="rounded-full bg-surface-container px-2.5 py-1 text-[11px] font-bold text-on-surface-variant">
                    {tag}
                  </span>
                ))}
              </div>
              <Link href={item.href} className="mt-5 text-sm font-bold text-primary no-underline">
                Preview rep
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl bg-surface-container-lowest p-8 text-center ring-1 ring-outline-variant/35">
          <p className="text-sm font-semibold text-on-surface-variant">No public previews match those filters yet.</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => {
              setDiscipline(ALL)
              setFlowMove(ALL)
              setGoal(ALL)
            }}
          >
            Reset filters
          </Button>
        </div>
      )}
    </div>
  )
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-primary">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
              value === option
                ? 'border-primary bg-primary text-on-primary'
                : 'border-outline-variant bg-background text-on-surface-variant hover:border-primary/50'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
