import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface WaitlistEntry {
  id: string
  email: string
  name: string | null
  company: string | null
  referral_source: string | null
  created_at: string
}

export default async function AdminWaitlistPage() {
  // Auth + role check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch entries
  const admin = createAdminClient()
  const { data: entries, count } = await admin
    .from('waitlist')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false }) as { data: WaitlistEntry[], count: number | null }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Waitlist</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">{count ?? 0} signups total</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="overflow-x-auto">
        <table className="min-w-[640px] w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-high">
              <th className="text-left px-4 py-3 font-label font-semibold text-on-surface-variant">Name</th>
              <th className="text-left px-4 py-3 font-label font-semibold text-on-surface-variant">Email</th>
              <th className="text-left px-4 py-3 font-label font-semibold text-on-surface-variant">Company</th>
              <th className="text-left px-4 py-3 font-label font-semibold text-on-surface-variant">Signed up</th>
            </tr>
          </thead>
          <tbody>
            {entries?.map((entry, i) => (
              <tr
                key={entry.id}
                className={`border-b border-outline-variant/50 last:border-0 ${i % 2 === 0 ? '' : 'bg-surface-container-low/50'}`}
              >
                <td className="px-4 py-3 text-on-surface font-medium">{entry.name ?? '-'}</td>
                <td className="px-4 py-3 text-on-surface">{entry.email}</td>
                <td className="px-4 py-3 text-on-surface-variant">{entry.company ?? '-'}</td>
                <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
            {(!entries || entries.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-on-surface-variant">No signups yet.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
