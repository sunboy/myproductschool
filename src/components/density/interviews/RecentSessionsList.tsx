import Link from 'next/link'
import { Badge, Button, Card, Text } from '@/design'
import { normalizeToTen } from '@/lib/feedback/score'
import type { SessionHistoryRow } from '@/lib/live-interview/history'

/** Full-width "Recent sessions" list under the interview wizard. Server data,
 *  capped by the caller; scored rows link to their debrief. */
export function RecentSessionsList({ sessions, total }: { sessions: SessionHistoryRow[]; total?: number }) {
  if (!sessions.length) return null
  return (
    <Card tone="bright" padding="none" data-testid="recent-sessions">
      <div className="flex items-center justify-between border-b border-hairline px-3.5 py-2.5">
        <Text variant="h4" as="h2" className="text-lede">Recent sessions</Text>
        <Link href="/history" className="text-meta font-bold text-primary">{total && total > sessions.length ? `All ${total} →` : 'History →'}</Link>
      </div>
      <ul>
        {sessions.map(s => {
          const scored = typeof s.overallScore === 'number'
          const date = s.endedAt ? new Date(s.endedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
          return (
            <li key={s.id} className="grid min-h-control-lg grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-hairline px-3.5 py-1.5 last:border-b-0 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_auto_auto_auto]">
              <span className="truncate text-ui font-strong text-ink-strong">{s.companyName} · {s.roleId}</span>
              <span className="hidden truncate text-ui font-ui text-ink-secondary sm:block">{s.scenarioTitle ?? (s.disciplineLabel ? `${s.disciplineLabel} interview` : 'Persona-led interview')}</span>
              <span className="hidden whitespace-nowrap text-meta font-ui text-ink-secondary sm:block">{date}</span>
              {scored ? <Badge tone="status">{normalizeToTen(s.overallScore!, 5).toFixed(1)} / 10</Badge> : <Badge tone="neutral">Incomplete</Badge>}
              <span className="hidden sm:block">{scored ? <Button asChild size="sm" variant="outline"><Link href={`/live-interviews/${s.id}/debrief`}>Debrief</Link></Button> : null}</span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
