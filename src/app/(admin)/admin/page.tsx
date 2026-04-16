import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

async function getAdminStats() {
  const admin = createAdminClient()

  const [
    { count: totalUsers },
    { count: totalAttempts },
    { data: avgScoreRow },
    { data: challenges },
    { data: recentAttempts },
    { data: contentQueue },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('challenge_attempts').select('*', { count: 'exact', head: true }),
    admin.from('challenge_attempts').select('score').not('score', 'is', null),
    admin
      .from('challenges')
      .select('id, title, paradigm, difficulty, is_published')
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('challenge_attempts')
      .select('id, user_id, challenge_id, score, submitted_at, challenges(title)')
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: false })
      .limit(20),
    admin
      .from('admin_content_queue')
      .select('id, status')
      .eq('status', 'pending')
      .limit(1),
  ])

  const scores = (avgScoreRow ?? []).map((r: { score: number }) => r.score).filter(Boolean)
  const avgScore = scores.length > 0
    ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1)
    : '—'

  // Count active streaks: profiles with streak_days > 0
  const { count: activeStreaks } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gt('streak_days', 0)

  // Attempt counts per challenge
  const { data: attemptCounts } = await admin
    .from('challenge_attempts')
    .select('challenge_id')

  const countMap: Record<string, number> = {}
  for (const a of (attemptCounts ?? [])) {
    countMap[a.challenge_id] = (countMap[a.challenge_id] ?? 0) + 1
  }

  return {
    totalUsers: totalUsers ?? 0,
    totalAttempts: totalAttempts ?? 0,
    avgScore,
    activeStreaks: activeStreaks ?? 0,
    challenges: (challenges ?? []).map(c => ({ ...c, attempt_count: countMap[c.id] ?? 0 })),
    recentAttempts: recentAttempts ?? [],
    pendingQueueCount: contentQueue?.length ?? 0,
  }
}

export default async function AdminPage() {
  const stats = await getAdminStats()

  const kpis = [
    { label: 'Total users', value: stats.totalUsers.toLocaleString(), icon: 'group' },
    { label: 'Total attempts', value: stats.totalAttempts.toLocaleString(), icon: 'fitness_center' },
    { label: 'Avg Luma score', value: stats.avgScore, icon: 'star' },
    { label: 'Active streaks', value: stats.activeStreaks.toLocaleString(), icon: 'local_fire_department' },
  ]

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">Overview</h1>
        <p className="text-on-surface-variant text-sm mt-1">Live platform metrics</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="p-4 bg-surface-container rounded-xl border border-outline-variant">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-sm text-on-surface-variant">{kpi.icon}</span>
              <span className="text-xs text-on-surface-variant">{kpi.label}</span>
            </div>
            <div className="font-headline text-2xl font-bold text-on-surface">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Challenge management */}
      <div>
        <h2 className="font-headline text-lg font-bold text-on-surface mb-3">
          Challenges <span className="text-on-surface-variant font-normal text-sm">({stats.challenges.length})</span>
        </h2>
        <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-high">
              <tr>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Title</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Paradigm</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Difficulty</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Attempts</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {stats.challenges.map((c: {
                id: string
                title: string
                paradigm: string | null
                difficulty: string
                attempt_count: number
                is_published: boolean
              }) => (
                <tr key={c.id} className="hover:bg-surface-container-high transition-colors">
                  <td className="px-4 py-3 text-on-surface font-medium max-w-xs truncate">{c.title}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{c.paradigm ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant capitalize">
                      {c.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface">{c.attempt_count}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_published ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                      {c.is_published ? 'live' : 'draft'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent attempts */}
      <div>
        <h2 className="font-headline text-lg font-bold text-on-surface mb-3">Recent Attempts</h2>
        <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-high">
              <tr>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">User</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Challenge</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Score</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {stats.recentAttempts.map((a: {
                id: string
                user_id: string
                score: number | null
                submitted_at: string | null
                challenges: { title: string }[] | null
              }) => (
                <tr key={a.id} className="hover:bg-surface-container-high transition-colors">
                  <td className="px-4 py-3 text-on-surface-variant font-mono text-xs">{a.user_id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-on-surface max-w-xs truncate">
                    {Array.isArray(a.challenges) ? a.challenges[0]?.title : (a.challenges as { title: string } | null)?.title ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {a.score != null ? (
                      <span className="font-medium text-on-surface">{a.score}/10</span>
                    ) : (
                      <span className="text-on-surface-variant">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant text-xs">
                    {a.submitted_at ? new Date(a.submitted_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {stats.recentAttempts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-on-surface-variant">No attempts yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Content queue + quick links */}
      <div className="flex gap-3 flex-wrap items-center">
        <Link
          href="/admin/content"
          className="flex items-center gap-2 px-4 py-2.5 bg-surface-container border border-outline-variant text-on-surface rounded-xl text-sm hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-sm text-primary">edit_document</span>
          Content queue
          {stats.pendingQueueCount > 0 && (
            <span className="ml-1 text-xs bg-error text-white rounded-full px-1.5 py-0.5 font-medium">
              {stats.pendingQueueCount}
            </span>
          )}
        </Link>
        <Link href="/admin/users" className="flex items-center gap-2 px-4 py-2.5 bg-surface-container border border-outline-variant text-on-surface rounded-xl text-sm hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-sm text-primary">group</span>
          All users
        </Link>
        <Link href="/admin/luma-queue" className="flex items-center gap-2 px-4 py-2.5 bg-surface-container border border-outline-variant text-on-surface rounded-xl text-sm hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-sm text-primary">rate_review</span>
          Luma queue
        </Link>
        <Link href="/admin/paywall-config" className="flex items-center gap-2 px-4 py-2.5 bg-surface-container border border-outline-variant text-on-surface rounded-xl text-sm hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-sm text-primary">lock</span>
          Paywall config
        </Link>
      </div>
    </div>
  )
}
