import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logAdminAction } from '@/lib/admin/audit-log'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

interface DiscussionReportRow {
  id: string
  discussion_id: string
  reporter_id: string | null
  reason: string
  status: 'open' | 'hidden' | 'dismissed'
  created_at: string
}

interface ModeratedDiscussionRow {
  id: string
  challenge_id: string
  user_id: string | null
  display_name: string | null
  content: string
  hidden_at: string | null
  created_at: string
}

interface ChallengeRow {
  id: string
  title: string
  slug: string | null
}

interface ProfileRow {
  id: string
  display_name: string | null
}

interface ReportItem {
  report: DiscussionReportRow
  discussion: ModeratedDiscussionRow | null
  challenge: ChallengeRow | null
  reporter: ProfileRow | null
  author: ProfileRow | null
}

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')
  return user
}

async function hideDiscussion(formData: FormData) {
  'use server'

  const user = await requireAdmin()
  const reportId = stringValue(formData, 'reportId')
  const discussionId = stringValue(formData, 'discussionId')
  const reason = stringValue(formData, 'reason') || 'Reported discussion'
  if (!reportId || !discussionId) return

  const admin = createAdminClient()
  const now = new Date().toISOString()

  await admin
    .from('challenge_discussions')
    .update({
      hidden_at: now,
      hidden_by: user.id,
      hidden_reason: reason,
      updated_at: now,
    })
    .eq('id', discussionId)

  await admin
    .from('discussion_reports')
    .update({ status: 'hidden', updated_at: now })
    .eq('discussion_id', discussionId)
    .eq('status', 'open')

  await logAdminAction(admin, {
    adminId: user.id,
    action: 'discussion.hide',
    targetType: 'challenge_discussions',
    targetId: discussionId,
    after: { report_id: reportId, reason, hidden_at: now },
  })

  revalidatePath('/admin/discussions')
}

async function dismissReport(formData: FormData) {
  'use server'

  const user = await requireAdmin()
  const reportId = stringValue(formData, 'reportId')
  if (!reportId) return

  const admin = createAdminClient()
  await admin
    .from('discussion_reports')
    .update({ status: 'dismissed', updated_at: new Date().toISOString() })
    .eq('id', reportId)
    .eq('status', 'open')

  await logAdminAction(admin, {
    adminId: user.id,
    action: 'discussion_report.dismiss',
    targetType: 'discussion_reports',
    targetId: reportId,
  })

  revalidatePath('/admin/discussions')
}

async function getOpenReports(): Promise<{ items: ReportItem[]; count: number }> {
  const admin = createAdminClient()
  const { data: reportRows, count, error } = await admin
    .from('discussion_reports')
    .select('id, discussion_id, reporter_id, reason, status, created_at', { count: 'exact' })
    .eq('status', 'open')
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) throw error

  const reports = (reportRows ?? []) as DiscussionReportRow[]
  if (reports.length === 0) return { items: [], count: count ?? 0 }

  const discussionIds = Array.from(new Set(reports.map(report => report.discussion_id)))
  const { data: discussionRows } = await admin
    .from('challenge_discussions')
    .select('id, challenge_id, user_id, display_name, content, hidden_at, created_at')
    .in('id', discussionIds)

  const discussions = (discussionRows ?? []) as ModeratedDiscussionRow[]
  const discussionById = new Map(discussions.map(discussion => [discussion.id, discussion]))

  const challengeIds = Array.from(new Set(discussions.map(discussion => discussion.challenge_id)))
  const { data: challengeRows } = challengeIds.length > 0
    ? await admin
      .from('challenges')
      .select('id, title, slug')
      .in('id', challengeIds)
    : { data: [] }

  const challenges = (challengeRows ?? []) as ChallengeRow[]
  const challengeById = new Map(challenges.map(challenge => [challenge.id, challenge]))

  const profileIds = Array.from(new Set([
    ...reports.map(report => report.reporter_id).filter(Boolean),
    ...discussions.map(discussion => discussion.user_id).filter(Boolean),
  ])) as string[]
  const { data: profileRows } = profileIds.length > 0
    ? await admin
      .from('profiles')
      .select('id, display_name')
      .in('id', profileIds)
    : { data: [] }

  const profiles = (profileRows ?? []) as ProfileRow[]
  const profileById = new Map(profiles.map(profile => [profile.id, profile]))

  return {
    count: count ?? reports.length,
    items: reports.map(report => {
      const discussion = discussionById.get(report.discussion_id) ?? null
      return {
        report,
        discussion,
        challenge: discussion ? challengeById.get(discussion.challenge_id) ?? null : null,
        reporter: report.reporter_id ? profileById.get(report.reporter_id) ?? null : null,
        author: discussion?.user_id ? profileById.get(discussion.user_id) ?? null : null,
      }
    }),
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function profileLabel(profile: ProfileRow | null, fallbackId?: string | null, systemLabel = 'System') {
  if (profile?.display_name) return profile.display_name
  if (fallbackId) return fallbackId.slice(0, 8)
  return systemLabel
}

export default async function AdminDiscussionsPage() {
  await requireAdmin()
  const { items, count } = await getOpenReports()

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Discussions</h1>
          <p className="text-on-surface-variant text-sm mt-1">{count} open reports</p>
        </div>
      </div>

      <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-surface-container-high">
            <tr>
              <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Reported</th>
              <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Challenge</th>
              <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Comment</th>
              <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Reason</th>
              <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {items.map(item => {
              const discussion = item.discussion
              const challenge = item.challenge
              const reporterName = profileLabel(item.reporter, item.report.reporter_id, 'Deleted user')
              const authorName = profileLabel(item.author, discussion?.user_id, discussion?.display_name ?? 'Hatch')

              return (
                <tr key={item.report.id} className="align-top hover:bg-surface-container-high/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-on-surface">{formatDate(item.report.created_at)}</div>
                    <div className="mt-1 text-xs text-on-surface-variant">by {reporterName}</div>
                  </td>
                  <td className="px-4 py-3">
                    {challenge ? (
                      <Link
                        href={`/challenges/${challenge.id}/discussion`}
                        className="font-medium text-primary hover:underline"
                      >
                        {challenge.title}
                      </Link>
                    ) : (
                      <span className="text-on-surface-variant">Unknown challenge</span>
                    )}
                    {discussion && (
                      <div className="mt-1 text-xs text-on-surface-variant">author {authorName}</div>
                    )}
                  </td>
                  <td className="max-w-[320px] px-4 py-3">
                    {discussion ? (
                      <>
                        <p className="line-clamp-4 leading-relaxed text-on-surface">{discussion.content}</p>
                        {discussion.hidden_at && (
                          <span className="mt-2 inline-flex rounded-full bg-surface-container-high px-2 py-0.5 text-xs font-semibold text-on-surface-variant">
                            Already hidden
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-on-surface-variant">Discussion was deleted.</span>
                    )}
                  </td>
                  <td className="max-w-[260px] px-4 py-3">
                    <p className="line-clamp-4 leading-relaxed text-on-surface-variant">{item.report.reason}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <form action={hideDiscussion}>
                        <input type="hidden" name="reportId" value={item.report.id} />
                        <input type="hidden" name="discussionId" value={discussion?.id ?? ''} />
                        <input type="hidden" name="reason" value={item.report.reason} />
                        <button
                          type="submit"
                          disabled={!discussion || Boolean(discussion.hidden_at)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-error-container px-3 py-1.5 text-xs font-bold text-on-error-container transition-opacity hover:opacity-90 disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined text-sm">visibility_off</span>
                          Hide
                        </button>
                      </form>
                      <form action={dismissReport}>
                        <input type="hidden" name="reportId" value={item.report.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1.5 text-xs font-bold text-on-surface-variant transition-colors hover:text-on-surface"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                          Dismiss
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              )
            })}

            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-on-surface-variant">
                  No open discussion reports.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
