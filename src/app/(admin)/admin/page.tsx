import Link from 'next/link'

const MOCK_KPIS = [
  { label: 'Total users', value: '1,204', change: '+12%', icon: 'group', positive: true },
  { label: 'Pro subscribers', value: '87', change: '+5', icon: 'workspace_premium', positive: true },
  { label: 'Challenges submitted', value: '4,891', change: '+18%', icon: 'fitness_center', positive: true },
  { label: 'Avg Luma score', value: '6.4', change: '-0.2', icon: 'star', positive: false },
  { label: 'Monthly revenue', value: '$1,044', change: '+$60', icon: 'payments', positive: true },
  { label: 'Churn rate', value: '3.2%', change: '+0.4%', icon: 'trending_down', positive: false },
]

const RECENT_SIGNUPS = [
  { email: 'alex@company.com', plan: 'free', date: '2025-03-20', domain: 'Product Strategy' },
  { email: 'sam@startup.io', plan: 'pro', date: '2025-03-20', domain: 'Metrics & Analytics' },
  { email: 'priya@corp.com', plan: 'free', date: '2025-03-19', domain: 'User Research' },
  { email: 'jake@eng.co', plan: 'free', date: '2025-03-19', domain: 'Prioritization' },
]

export default function AdminPage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">Overview</h1>
        <p className="text-on-surface-variant text-sm mt-1">Platform metrics at a glance</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {MOCK_KPIS.map(kpi => (
          <div key={kpi.label} className="p-4 bg-surface-container rounded-xl border border-outline-variant">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-sm text-on-surface-variant">{kpi.icon}</span>
              <span className="text-xs text-on-surface-variant">{kpi.label}</span>
            </div>
            <div className="font-headline text-2xl font-bold text-on-surface">{kpi.value}</div>
            <div className={`text-xs mt-1 ${kpi.positive ? 'text-primary' : 'text-error'}`}>{kpi.change} this week</div>
          </div>
        ))}
      </div>

      {/* Recent signups */}
      <div>
        <h2 className="font-headline text-lg font-bold text-on-surface mb-3">Recent Signups</h2>
        <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-high">
              <tr>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Email</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Plan</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">First Domain</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {RECENT_SIGNUPS.map(user => (
                <tr key={user.email} className="hover:bg-surface-container-high transition-colors">
                  <td className="px-4 py-3 text-on-surface">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.plan === 'pro' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{user.domain}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{user.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex gap-3 flex-wrap">
        {[
          { href: '/admin/content', label: 'Manage content', icon: 'edit_document' },
          { href: '/admin/users', label: 'View all users', icon: 'group' },
          { href: '/admin/luma-queue', label: 'Review queue', icon: 'rate_review' },
        ].map(link => (
          <Link key={link.href} href={link.href} className="flex items-center gap-2 px-4 py-2.5 bg-surface-container border border-outline-variant text-on-surface rounded-xl text-sm hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-sm text-primary">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
