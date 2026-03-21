export default function AdminUsersPage() {
  const MOCK_USERS = [
    { email: 'alex@company.com', plan: 'free', challenges: 12, joined: '2025-03-10' },
    { email: 'sam@startup.io', plan: 'pro', challenges: 47, joined: '2025-03-01' },
    { email: 'priya@corp.com', plan: 'free', challenges: 3, joined: '2025-03-19' },
    { email: 'jake@eng.co', plan: 'free', challenges: 8, joined: '2025-03-15' },
    { email: 'maya@tech.com', plan: 'pro', challenges: 31, joined: '2025-02-28' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">Users</h1>
        <p className="text-on-surface-variant text-sm mt-1">{MOCK_USERS.length} users total</p>
      </div>

      <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-container-high">
            <tr>
              <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Email</th>
              <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Plan</th>
              <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Challenges</th>
              <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {MOCK_USERS.map(user => (
              <tr key={user.email} className="hover:bg-surface-container-high transition-colors">
                <td className="px-4 py-3 text-on-surface font-medium">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${user.plan === 'pro' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                    {user.plan}
                  </span>
                </td>
                <td className="px-4 py-3 text-on-surface">{user.challenges}</td>
                <td className="px-4 py-3 text-on-surface-variant">{user.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
