import Link from 'next/link'

interface RecentActivity {
  name: string
  domain: string
  score: number
  date: string
}

interface RecentActivityCardProps {
  activities: RecentActivity[]
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-primary'
  if (score >= 50) return 'text-tertiary'
  return 'text-error'
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  return (
    <div className="bg-surface-container rounded-xl p-4 flex flex-col gap-2">
      <h3 className="font-headline font-semibold text-base text-on-surface">Recent Activity</h3>

      <div className="flex flex-col">
        {activities.map((row, i) => (
          <div
            key={i}
            className="flex items-center gap-3 h-10 border-b border-outline-variant/20 last:border-0"
          >
            <span className="flex-1 text-sm text-on-surface truncate">{row.name}</span>
            <span className="bg-secondary-container text-on-secondary-container rounded-full text-xs px-2 py-0.5 font-label whitespace-nowrap flex-shrink-0">
              {row.domain}
            </span>
            <span className={`text-sm font-semibold flex-shrink-0 w-8 text-right ${scoreColor(row.score)}`}>
              {row.score}
            </span>
            <span className="text-xs text-on-surface-variant flex-shrink-0 w-12 text-right">{row.date}</span>
          </div>
        ))}
      </div>

      <Link
        href="/progress"
        className="text-xs text-primary font-label font-semibold hover:underline self-start"
      >
        View all activity
      </Link>
    </div>
  )
}
