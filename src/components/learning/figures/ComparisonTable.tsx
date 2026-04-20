import type { ComparisonTableFigure } from '@/lib/types'

const TONE_STYLES: Record<NonNullable<import('@/lib/types').FigureTone>, { fill: string; stroke: string; textFill: string; dashed: boolean }> = {
  ok:      { fill: '#d8f0de', stroke: '#4a7c59', textFill: '#2e3230', dashed: false },
  warn:    { fill: '#f0e8db', stroke: '#b83230', textFill: '#b83230', dashed: true },
  neutral: { fill: '#faf6f0', stroke: '#c4c8bc', textFill: '#4a4e4a', dashed: false },
}

export function ComparisonTable({ figure }: { figure: ComparisonTableFigure }) {
  const { headers, rows, footer, caption, ariaLabel } = figure
  const cols = headers.length
  const rowH = 38
  const headerH = 32
  const footerH = footer ? 44 : 0
  const pad = 16
  const w = 720
  const usableW = w - pad * 2
  const colW = usableW / cols
  const totalH = pad + headerH + rows.length * (rowH + 4) + footerH + pad

  return (
    <figure className="my-5 bg-surface-container-low rounded-xl p-4 border border-outline-variant">
      <svg viewBox={`0 0 ${w} ${totalH}`} role="img" aria-label={ariaLabel} className="w-full h-auto block">
        <g fontFamily="Nunito Sans, sans-serif" fontSize="11">
          {/* Header */}
          <rect x={pad} y={12} width={usableW} height={headerH} fill="#eae6de" stroke="#c4c8bc" />
          {headers.map((h, i) => (
            <text key={i} x={pad + i * colW + 16} y={12 + headerH / 2 + 4} fontWeight="700" fill="#2e3230">
              {h}
            </text>
          ))}

          {/* Rows */}
          {rows.map((row, ri) => {
            const y = 12 + headerH + 8 + ri * (rowH + 4)
            const t = TONE_STYLES[row.tone ?? 'neutral']
            return (
              <g key={ri} transform={`translate(0, ${y})`}>
                <rect
                  x={pad}
                  y={0}
                  width={usableW}
                  height={rowH}
                  fill={t.fill}
                  stroke={t.stroke}
                  strokeDasharray={t.dashed ? '4 3' : undefined}
                />
                {row.cells.map((cell, ci) => (
                  <text
                    key={ci}
                    x={pad + ci * colW + 16}
                    y={rowH / 2 + 4}
                    fill={ci === 0 ? '#2e3230' : t.textFill}
                    fontWeight={ci === 0 ? '600' : '400'}
                    fontStyle={row.tone === 'warn' && ci > 0 ? 'italic' : 'normal'}
                  >
                    {cell}
                  </text>
                ))}
                {row.arrow && cols >= 2 && (
                  <>
                    <defs>
                      <marker
                        id={`ct-arr-${ri}`}
                        viewBox="0 0 10 10"
                        refX="9"
                        refY="5"
                        markerWidth="5"
                        markerHeight="5"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#4a4e4a" />
                      </marker>
                    </defs>
                    <line
                      x1={pad + colW - 12}
                      y1={rowH / 2}
                      x2={pad + colW + 12}
                      y2={rowH / 2}
                      stroke="#4a4e4a"
                      strokeWidth="1.5"
                      markerEnd={`url(#ct-arr-${ri})`}
                    />
                  </>
                )}
                {row.badge && (
                  <text
                    x={w - pad - 16}
                    y={rowH / 2 + 4}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight="700"
                    fill="#4a7c59"
                  >
                    {row.badge}
                  </text>
                )}
              </g>
            )
          })}

          {/* Footer */}
          {footer && (
            <g transform={`translate(0, ${12 + headerH + 8 + rows.length * (rowH + 4)})`}>
              <rect x={pad} y={0} width={usableW} height={footerH} fill="#faf6f0" stroke="#c4c8bc" />
              {footer.cells.map((cell, ci) => (
                <text
                  key={ci}
                  x={pad + ci * colW + 16}
                  y={footerH / 2 + 4}
                  fill="#2e3230"
                  fontWeight={ci === 0 ? '700' : '400'}
                >
                  {cell}
                </text>
              ))}
            </g>
          )}
        </g>
      </svg>
      <figcaption className="text-xs text-on-surface-variant mt-2 text-center">{caption}</figcaption>
    </figure>
  )
}
