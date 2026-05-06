import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

interface AdminActionLogRow {
  id: string
  admin_id: string | null
  action: string
  target_type: string
  target_id: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  created_at: string
}

interface ProfileRow {
  id: string
  display_name: string | null
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
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function summarize(value: Record<string, unknown> | null) {
  if (!value) return '—'
  const text = JSON.stringify(value)
  return text.length > 150 ? `${text.slice(0, 147)}...` : text
}

export default async function AdminAuditLogPage() {
  await requireAdmin()

  const admin = createAdminClient()
  const { data: rows, error } = await admin
    .from('admin_action_log')
    .select('id, admin_id, action, target_type, target_id, before, after, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error

  const logs = (rows ?? []) as AdminActionLogRow[]
  const adminIds = Array.from(new Set(logs.map(row => row.admin_id).filter(Boolean))) as string[]
  const { data: profiles } = adminIds.length
    ? await admin.from('profiles').select('id, display_name').in('id', adminIds)
    : { data: [] }
  const profileRows = (profiles ?? []) as ProfileRow[]
  const profileMap = new Map(profileRows.map(profile => [profile.id, profile.display_name]))

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">Audit Log</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Last 100 successful admin write actions</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-surface-container-low text-xs uppercase tracking-[0.08em] text-on-surface-variant">
            <tr>
              <th className="px-4 py-3 font-bold">Time</th>
              <th className="px-4 py-3 font-bold">Admin</th>
              <th className="px-4 py-3 font-bold">Action</th>
              <th className="px-4 py-3 font-bold">Target</th>
              <th className="px-4 py-3 font-bold">After</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {logs.map(row => (
              <tr key={row.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">{formatTime(row.created_at)}</td>
                <td className="px-4 py-3 text-on-surface">
                  {row.admin_id ? profileMap.get(row.admin_id) ?? row.admin_id.slice(0, 8) : 'Admin secret'}
                </td>
                <td className="px-4 py-3 font-semibold text-on-surface">{row.action}</td>
                <td className="px-4 py-3 text-on-surface-variant">
                  <span className="font-semibold text-on-surface">{row.target_type}</span>
                  {row.target_id ? <span className="block text-xs">{row.target_id}</span> : null}
                </td>
                <td className="max-w-[420px] px-4 py-3 font-mono text-xs leading-5 text-on-surface-variant">
                  {summarize(row.after)}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-on-surface-variant">
                  No admin actions logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
