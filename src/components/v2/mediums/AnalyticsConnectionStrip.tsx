'use client'

interface AnalyticsConnectionStripProps {
  mcpConnected: boolean
  skillsWritten: string[]
}

export function AnalyticsConnectionStrip({ mcpConnected, skillsWritten }: AnalyticsConnectionStripProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 4,
      padding: '8px 12px',
      background: 'var(--color-surface-container-low)',
      border: '1px solid var(--color-outline-variant)',
      borderRadius: 10,
    }}>
      {/* BigQuery MCP row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: mcpConnected ? 'var(--color-primary)' : 'var(--color-outline)',
          boxShadow: mcpConnected ? '0 0 0 3px rgba(74,124,89,0.2)' : 'none',
          transition: 'background 400ms, box-shadow 400ms',
        }} />
        <span className="material-symbols-outlined" style={{
          fontSize: 14,
          color: mcpConnected ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
          fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20",
        }}>
          database
        </span>
        <span style={{
          fontSize: 12, fontWeight: 600,
          color: mcpConnected ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
          fontFamily: 'var(--font-label)',
        }}>
          BigQuery MCP
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700,
          padding: '1px 6px', borderRadius: 99,
          background: mcpConnected ? 'var(--color-primary-fixed)' : 'var(--color-surface-container-high)',
          color: mcpConnected ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
          marginLeft: 'auto',
          transition: 'background 400ms, color 400ms',
        }}>
          {mcpConnected ? 'Connected' : 'Waiting'}
        </span>
      </div>

      {/* Skills row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 3,
          background: skillsWritten.length > 0 ? 'var(--color-tertiary)' : 'var(--color-outline)',
          transition: 'background 400ms',
        }} />
        <span className="material-symbols-outlined" style={{
          fontSize: 14,
          color: skillsWritten.length > 0 ? 'var(--color-tertiary)' : 'var(--color-on-surface-variant)',
          fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20",
        }}>
          construction
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: skillsWritten.length > 0 ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
            fontFamily: 'var(--font-label)',
          }}>
            Skills written
            {skillsWritten.length > 0 && (
              <span style={{
                marginLeft: 6, fontSize: 10, fontWeight: 700,
                padding: '1px 6px', borderRadius: 99,
                background: 'var(--color-tertiary-container)',
                color: 'var(--color-on-secondary-container)',
              }}>
                {skillsWritten.length}
              </span>
            )}
          </div>
          {skillsWritten.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {skillsWritten.map((name, i) => (
                <span key={i} style={{
                  fontSize: 10, fontWeight: 600,
                  padding: '2px 6px', borderRadius: 6,
                  background: 'var(--color-surface-container-high)',
                  color: 'var(--color-on-surface-variant)',
                  fontFamily: 'monospace',
                  maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
