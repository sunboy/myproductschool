'use client'

// XpCoin — the gradient XP coin extracted from AnalyticsSessionMirror so
// every feedback surface awards XP with the same object.

export function XpCoin({ amount, label = 'XP earned', size = 40 }: {
  amount: number
  label?: string | null
  size?: number
}) {
  if (amount <= 0) return null
  return (
    <div className="inline-flex items-center gap-2">
      <div
        style={{
          width: size, height: size,
          background: 'radial-gradient(circle at 30% 30%, #f4d98a, #c9933a 60%, #8a6620)',
          borderRadius: '50%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: 'var(--font-headline)',
          fontWeight: 700, fontSize: Math.max(10, Math.round(size * 0.3)),
          boxShadow: '0 4px 16px -4px rgba(201,147,58,0.5)',
        }}
      >
        +{amount}
      </div>
      {label && (
        <span className="font-body text-[13px] font-bold text-on-surface">{label}</span>
      )}
    </div>
  )
}
