import Link from 'next/link'

const moves = [
  {
    key: 'Frame',
    icon: 'center_focus_strong',
    tint: '#cfe3d3',
    iconBg: '#4a7c59',
    desc: 'Find the right problem',
    level: 3,
    pct: 0.72,
  },
  {
    key: 'List',
    icon: 'format_list_bulleted',
    tint: '#dfe7e1',
    iconBg: '#6b8275',
    desc: 'Generate options',
    level: 3,
    pct: 0.48,
  },
  {
    key: 'Optimize',
    icon: 'tune',
    tint: '#f3e2b9',
    iconBg: '#c9933a',
    desc: 'Pick & refine',
    level: 3,
    pct: 0.3,
  },
  {
    key: 'Win',
    icon: 'emoji_events',
    tint: '#ecdeff',
    iconBg: '#a878d6',
    desc: 'Drive outcomes',
    level: 3,
    pct: 0.1,
  },
]

export function FlowMoveLevelsCard() {
  return (
    <div className="rounded-2xl p-6 bg-surface border border-outline-variant/30">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-headline text-xl font-medium tracking-tight">FLOW Move Levels</h3>
          <p className="text-sm text-on-surface-variant mt-0.5">
            The four moves that compound into product judgment.
          </p>
        </div>
        <Link
          href="/progress"
          className="flex items-center gap-1 text-xs font-label font-bold uppercase tracking-wider text-primary"
        >
          Your skills{' '}
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-3.5">
        {moves.map(m => (
          <div
            key={m.key}
            className="rounded-2xl p-4 border"
            style={{ background: m.tint, borderColor: 'rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-start justify-between mb-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: m.iconBg }}
              >
                <span
                  className="material-symbols-outlined text-white text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {m.icon}
                </span>
              </div>
              <span className="text-xs font-label font-bold" style={{ color: 'rgba(0,0,0,0.55)' }}>
                Lv {m.level}
              </span>
            </div>
            <div className="font-headline text-lg font-semibold tracking-tight">{m.key}</div>
            <div className="text-xs mt-0.5 mb-2.5" style={{ color: 'rgba(0,0,0,0.6)' }}>
              {m.desc}
            </div>
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.6)' }}
            >
              <div style={{ width: `${m.pct * 100}%`, background: m.iconBg, height: '100%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
