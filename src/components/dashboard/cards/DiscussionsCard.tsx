import Link from 'next/link'

interface Discussion {
  challenge: string
  author: string
  preview: string
  time: string
}

interface DiscussionsCardProps {
  discussions: Discussion[]
}

export function DiscussionsCard({ discussions }: DiscussionsCardProps) {
  return (
    <div className="bg-surface-container rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-xl">forum</span>
        <h3 className="font-headline font-semibold text-base text-on-surface">Discussions</h3>
      </div>

      <div className="flex flex-col gap-2">
        {discussions.map((d, i) => (
          <div key={i} className="flex flex-col gap-0.5 py-1.5 border-b border-outline-variant/20 last:border-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-on-surface truncate">{d.challenge}</p>
              <span className="text-xs text-on-surface-variant flex-shrink-0 ml-2">{d.time}</span>
            </div>
            <p className="text-xs text-on-surface-variant truncate">
              <span className="font-semibold text-primary">@{d.author}</span>: {d.preview}
            </p>
          </div>
        ))}
      </div>

      <Link
        href="/challenges"
        className="text-xs text-primary font-label font-semibold hover:underline self-start"
      >
        Join the discussion
      </Link>
    </div>
  )
}
