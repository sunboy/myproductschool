'use client'

// Live AI usage meter for Claude Code Analytics sessions. Shows estimated spend
// against the per-session budget cap (enforced by the LiteLLM gateway's virtual
// key). The bar shifts primary → tertiary (amber) → error (red) as the session
// approaches the cap, so the user can see the agent is actively spending and how
// much headroom is left. Tokens are shown as a secondary read.

interface UsageMeterProps {
  spentUsd: number
  budgetUsd: number
  inputTokens?: number
  outputTokens?: number
  /** True while the session is live (animates a subtle pulse on the fill). */
  active?: boolean
}

function fmtTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return String(n)
}

export function UsageMeter({ spentUsd, budgetUsd, inputTokens = 0, outputTokens = 0, active = true }: UsageMeterProps) {
  const ratio = budgetUsd > 0 ? Math.min(spentUsd / budgetUsd, 1) : 0
  const pct = Math.round(ratio * 100)

  // Color bands: calm under 60%, amber 60–85%, red over 85%.
  const fill =
    ratio >= 0.85 ? 'var(--color-error)' : ratio >= 0.6 ? 'var(--color-tertiary)' : 'var(--color-primary)'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '8px 12px',
        borderRadius: 10,
        background: 'var(--color-surface-container-high)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, color: fill, fontVariationSettings: "'FILL' 1" }}
          >
            bolt
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-on-surface)' }}>AI usage</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>
          ${spentUsd.toFixed(3)} / ${budgetUsd.toFixed(2)}
        </span>
      </div>

      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: 'var(--color-surface-dim)',
          overflow: 'hidden',
        }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="AI spend against session budget"
      >
        <div
          style={{
            height: '100%',
            width: `${Math.max(pct, spentUsd > 0 ? 3 : 0)}%`,
            background: fill,
            borderRadius: 3,
            transition: 'width 0.6s ease, background 0.4s ease',
            animation: active && ratio < 1 ? 'cc-usage-pulse 2s ease-in-out infinite' : 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-on-surface-variant)' }}>
        <span>{fmtTokens(inputTokens)} in · {fmtTokens(outputTokens)} out</span>
        {ratio >= 0.85 && <span style={{ color: 'var(--color-error)', fontWeight: 700 }}>near cap</span>}
      </div>

      <style>{`@keyframes cc-usage-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.72 } }`}</style>
    </div>
  )
}
