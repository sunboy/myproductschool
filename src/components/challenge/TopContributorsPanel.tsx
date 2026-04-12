import type { ChallengeDiscussion } from '@/lib/types'

interface Props {
  discussions: ChallengeDiscussion[]
}

export function TopContributorsPanel({ discussions }: Props) {
  // Aggregate upvotes per user
  const byUser = new Map<string, { username: string; upvotes: number; posts: number }>()
  for (const d of discussions) {
    const key = d.user_id ?? 'anon'
    const name = d.username ?? d.display_name ?? 'Anonymous'
    const existing = byUser.get(key)
    if (existing) {
      existing.upvotes += d.upvote_count
      existing.posts += 1
    } else {
      byUser.set(key, { username: name, upvotes: d.upvote_count, posts: 1 })
    }
  }

  const top = Array.from(byUser.values())
    .sort((a, b) => b.upvotes - a.upvotes || b.posts - a.posts)
    .slice(0, 3)

  if (top.length === 0) return null

  return (
    <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/20">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
        Top Contributors
      </h3>
      <div className="space-y-3">
        {top.map((c, i) => {
          const initials = c.username.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
          const medals = ['🥇', '🥈', '🥉']
          return (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                  <span className="text-on-primary-container text-[10px] font-bold">{initials}</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-on-surface leading-none">{c.username}</div>
                  <div className="text-[10px] text-on-surface-variant">{c.posts} post{c.posts !== 1 ? 's' : ''}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-primary">{c.upvotes} ↑</span>
                <span>{medals[i]}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
