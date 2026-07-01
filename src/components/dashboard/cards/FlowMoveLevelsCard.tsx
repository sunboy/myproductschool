import Link from 'next/link'

const MOVE_META: Record<string, { icon: string; tint: string; iconBg: string; desc: string }> = {
  frame:    { icon: 'center_focus_strong', tint: '#cfe3d3', iconBg: '#4a7c59', desc: 'Find the right problem' },
  list:     { icon: 'format_list_bulleted', tint: '#dfe7e1', iconBg: '#6b8275', desc: 'Generate options' },
  optimize: { icon: 'tune',                tint: '#f3e2b9', iconBg: '#c9933a', desc: 'Pick & refine' },
  win:      { icon: 'emoji_events',        tint: '#ecdeff', iconBg: '#a878d6', desc: 'Drive outcomes' },
}

const MOVE_ORDER = ['frame', 'list', 'optimize', 'win']

interface MoveLevel {
  move: string
  xp: number
  level: number
  progress_pct: number
}

interface FlowMoveLevelsCardProps {
  levels?: MoveLevel[]
  variant?: 'default' | 'compact'
}

export function FlowMoveLevelsCard({ levels = [], variant = 'default' }: FlowMoveLevelsCardProps) {
  const compact = variant === 'compact'
  const moves = MOVE_ORDER.map(key => {
    const meta = MOVE_META[key]
    const live = levels.find(l => l.move === key)
    return {
      key: key.charAt(0).toUpperCase() + key.slice(1),
      icon: meta.icon,
      tint: meta.tint,
      iconBg: meta.iconBg,
      desc: meta.desc,
      level: live?.level ?? 1,
      pct: live ? live.progress_pct / 100 : 0,
    }
  })

  return (
    <div
      className={`rounded-[22px] border border-outline-variant/30 bg-surface ${
        compact ? 'p-4 shadow-[0_16px_34px_-34px_rgba(30,27,20,0.45)]' : 'p-6'
      }`}
      data-hatch-target="dashboard-flow-levels"
    >
      <div className={`flex items-start justify-between gap-3 ${compact ? 'mb-3' : 'mb-4'}`}>
        <div>
          <h3 className={`font-headline font-medium tracking-tight ${compact ? 'text-[18px]' : 'text-xl'}`}>
            {compact ? 'FLOW map' : 'FLOW Levels'}
          </h3>
          <p className={`${compact ? 'text-[12px] leading-5' : 'text-sm'} mt-0.5 text-on-surface-variant`}>
            Frame, list, optimize, win. Your practice loop in four moves.
          </p>
        </div>
        <Link
          href="/progress"
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-outline-variant/60 px-2.5 py-1 text-[10px] font-label font-bold uppercase tracking-wider text-primary no-underline transition-colors hover:bg-surface-container"
        >
          Skills
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      </div>
      <div className={`relative grid grid-cols-2 gap-2.5 ${compact ? 'sm:grid-cols-4' : 'sm:grid-cols-4 sm:gap-3.5'}`}>
        <div
          aria-hidden
          className={`absolute z-0 hidden pointer-events-none sm:block ${compact ? 'top-5' : 'top-7'}`}
          style={{
            left: '12%', right: '12%', height: 2,
            backgroundImage: 'repeating-linear-gradient(90deg, var(--color-outline-variant) 0 6px, transparent 6px 12px)',
          }}
        />
        {moves.map(m => (
          <div
            key={m.key}
            className={`relative z-10 rounded-2xl border ${compact ? 'p-2.5' : 'p-4'}`}
            style={{ background: m.tint, borderColor: 'rgba(0,0,0,0.04)' }}
          >
            <div className={`flex items-start justify-between ${compact ? 'mb-2' : 'mb-2.5'}`}>
              <div
                className={`${compact ? 'h-7 w-7' : 'h-8 w-8'} flex items-center justify-center rounded-lg`}
                style={{ background: m.iconBg }}
              >
                <span
                  className={`material-symbols-outlined text-white ${compact ? 'text-[16px]' : 'text-[18px]'}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {m.icon}
                </span>
              </div>
              <span className="text-xs font-label font-bold" style={{ color: 'rgba(0,0,0,0.55)' }}>
                Lv {m.level}
              </span>
            </div>
            <div className={`font-headline font-semibold tracking-tight ${compact ? 'text-[15px]' : 'text-lg'}`}>
              {m.key}
            </div>
            <div className={`${compact ? 'mb-2 mt-0.5 line-clamp-1 text-[10.5px]' : 'mb-2.5 mt-0.5 text-xs'}`} style={{ color: 'rgba(0,0,0,0.6)' }}>
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
