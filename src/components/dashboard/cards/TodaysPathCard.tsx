import Link from 'next/link'

interface PathStep {
  label: string
  sub: string
  icon: string
  done: boolean
  active: boolean
  href?: string
}

interface TodaysPathCardProps {
  steps: PathStep[]
  completedCount: number
}

export function TodaysPathCard({ steps, completedCount }: TodaysPathCardProps) {
  const total = steps.length

  return (
    <div className="rounded-2xl p-5 bg-surface border border-outline-variant/40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>today</span>
          <h3 className="font-headline text-[15px] font-semibold text-on-surface">Today&apos;s Path</h3>
        </div>
        <span className="text-[11px] font-label font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-on-surface">
          {completedCount} / {total}
        </span>
      </div>

      <div className="flex flex-col gap-0.5 relative">
        {steps.map((step, i) => {
          const inner = (
            <div
              className={`grid gap-2.5 items-center rounded-xl px-2.5 py-2.5 transition-colors ${
                step.active
                  ? 'bg-primary-container text-on-primary-container'
                  : step.done
                  ? 'opacity-60'
                  : 'hover:bg-surface-container-low'
              }`}
              style={{ gridTemplateColumns: '22px 1fr auto' }}
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div
                  aria-hidden
                  className="absolute left-[21px] w-0.5 bg-outline-variant/40"
                  style={{ top: i * 52 + 34, height: 20 }}
                />
              )}

              {/* Circle */}
              <div
                className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 z-10 relative"
                style={{
                  background: step.done
                    ? 'var(--color-primary)'
                    : step.active
                    ? 'var(--color-primary)'
                    : 'var(--color-surface-container-high)',
                  color: step.done || step.active ? '#fff' : 'var(--color-on-surface-variant)',
                }}
              >
                <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: step.done ? "'FILL' 1" : "'FILL' 0" }}>
                  {step.done ? 'check' : step.icon}
                </span>
              </div>

              {/* Text */}
              <div className="min-w-0">
                <div className="text-[12.5px] font-bold font-label leading-tight">{step.label}</div>
                <div className="text-[11px] opacity-75 leading-tight truncate">{step.sub}</div>
              </div>

              {/* Active arrow */}
              {step.active && (
                <span className="material-symbols-outlined text-[16px] shrink-0">play_arrow</span>
              )}
            </div>
          )

          return step.href && !step.done ? (
            <Link key={i} href={step.href} className="block">{inner}</Link>
          ) : (
            <div key={i}>{inner}</div>
          )
        })}
      </div>
    </div>
  )
}
