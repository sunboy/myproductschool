export default function AdminRevenuePage() {
  const MONTHLY_DATA = [
    { month: 'Oct', mrr: 240, subscribers: 20 },
    { month: 'Nov', mrr: 420, subscribers: 35 },
    { month: 'Dec', mrr: 600, subscribers: 50 },
    { month: 'Jan', mrr: 720, subscribers: 60 },
    { month: 'Feb', mrr: 900, subscribers: 75 },
    { month: 'Mar', mrr: 1044, subscribers: 87 },
  ]

  const maxMrr = Math.max(...MONTHLY_DATA.map(d => d.mrr))

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">Revenue</h1>
        <p className="text-on-surface-variant text-sm mt-1">Subscription and MRR overview</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'MRR', value: '$1,044' },
          { label: 'Pro subscribers', value: '87' },
          { label: 'Churn rate', value: '3.2%' },
        ].map(stat => (
          <div key={stat.label} className="p-4 bg-surface-container rounded-xl border border-outline-variant text-center">
            <div className="font-headline text-2xl font-bold text-on-surface">{stat.value}</div>
            <div className="text-xs text-on-surface-variant mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* MRR chart (simple bar chart) */}
      <div className="p-5 bg-surface-container rounded-2xl border border-outline-variant">
        <h2 className="font-medium text-on-surface mb-4">MRR Growth</h2>
        <div className="flex items-end gap-3 h-32">
          {MONTHLY_DATA.map(d => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary rounded-t-md transition-all"
                style={{ height: `${(d.mrr / maxMrr) * 100}%`, minHeight: '4px' }}
              />
              <span className="text-xs text-on-surface-variant">{d.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
