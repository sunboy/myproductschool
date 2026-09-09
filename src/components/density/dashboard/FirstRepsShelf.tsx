import Link from 'next/link'
import { Badge, Button, Card, Chip, Text } from '@/design'
export interface FirstRep { href: string; title: string; summary: string; typeLabel: string; difficulty: string; minutes: number; chip: string }
export function FirstRepsShelf({ reps }: { reps: FirstRep[] }) {
  return (
    <section data-testid="first-reps" className="mb-3">
      <div className="mb-2 flex items-baseline justify-between"><Text variant="h4" as="h2" className="text-lede">A good place to begin</Text><Link href="/challenges" className="text-meta font-bold text-primary">All practice →</Link></div>
      <div className="grid gap-card-gap md:grid-cols-3">
        {reps.map(r => (
          <Card key={r.href} tone="bright" padding="sm" className="gap-2">
            <div className="flex gap-1.5"><Badge tone="type" value={r.typeLabel}>{r.typeLabel}</Badge><Badge tone="difficulty" value={r.difficulty}>{r.difficulty} · {r.minutes} min</Badge></div>
            <Text variant="h4" as="h3" className="text-body leading-tight">{r.title}</Text>
            <Text variant="meta" className="line-clamp-2">{r.summary}</Text>
            <div className="mt-auto flex items-center justify-between pt-1"><Chip variant="tag">{r.chip}</Chip><Button asChild size="sm"><Link href={r.href} data-testid="first-rep-start">Start</Link></Button></div>
          </Card>
        ))}
      </div>
    </section>
  )
}
