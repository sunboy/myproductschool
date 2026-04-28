// src/components/explore/DisciplineGrid.tsx
'use client'

import Link from 'next/link'

const DISCIPLINES = [
  {
    key: 'product_sense',
    label: 'Product Sense',
    emoji: '🧠',
    bg: 'bg-primary',
    href: '/challenges?discipline=product_sense',
    count: null as number | null,
  },
  {
    key: 'system_design',
    label: 'System Design',
    emoji: '🏗️',
    bg: 'bg-tertiary',
    href: '/challenges?discipline=system_design',
    count: null as number | null,
  },
  {
    key: 'data_modeling',
    label: 'Data Modeling',
    emoji: '🗄️',
    bg: 'bg-secondary',
    href: '/challenges?discipline=data_modeling',
    count: null as number | null,
  },
  {
    key: 'coding',
    label: 'Coding',
    emoji: '💻',
    bg: 'bg-[#3a5a7c]',
    href: null,
    count: null as number | null,
  },
]

interface Props {
  counts: Record<string, number>
}

export function DisciplineGrid({ counts }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {DISCIPLINES.map((d) => {
        const count = counts[d.key] ?? 0
        const card = (
          <div
            className={`${d.bg} text-white rounded-xl p-4 flex flex-col gap-1 ${d.href ? 'hover:opacity-90 transition-opacity cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
          >
            <span className="text-2xl">{d.emoji}</span>
            <span className="font-headline font-bold text-sm">{d.label}</span>
            <span className="text-xs opacity-75">
              {d.href ? `${count} challenges` : 'Coming soon'}
            </span>
          </div>
        )
        return d.href ? (
          <Link key={d.key} href={d.href}>
            {card}
          </Link>
        ) : (
          <div key={d.key}>{card}</div>
        )
      })}
    </div>
  )
}
