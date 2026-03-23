interface Activity {
  date: string
  title: string
  score: number
  pattern?: string
}

interface ActivityTimelineProps {
  activities: Activity[]
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <div>
      {activities.map((activity, i) => (
        <div
          key={i}
          className="flex items-center gap-4 py-3 border-b border-outline-variant/30 last:border-0"
        >
          <span className="text-xs text-on-surface-variant w-16 flex-shrink-0">
            {activity.date}
          </span>
          <span className="text-sm text-on-surface flex-1">
            {activity.title}
          </span>
          {activity.pattern && (
            <span className="text-xs bg-tertiary/10 text-tertiary rounded-full px-2 py-0.5">
              {activity.pattern}
            </span>
          )}
          <span className="font-headline font-bold text-on-surface">
            {activity.score}
          </span>
        </div>
      ))}
    </div>
  )
}
