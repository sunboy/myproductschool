import type { MappingDiagramFigure, FigureTone } from '@/lib/types'

const TARGET_STYLES: Record<NonNullable<FigureTone>, { fill: string; stroke: string }> = {
  ok:      { fill: '#d8f0de', stroke: '#4a7c59' },
  warn:    { fill: '#f0e8db', stroke: '#b83230' },
  neutral: { fill: '#c4a66a33', stroke: '#705c30' },
}

export function MappingDiagram({ figure }: { figure: MappingDiagramFigure }) {
  const { sources, targets, links, caption, ariaLabel, sourcesLabel, targetsLabel } = figure
  const w = 720
  const pad = 24
  const h = 300

  const sourceY = 44
  const sourceH = 34
  const targetY = 200
  const targetH = 60

  const usableW = w - pad * 2
  const sourceGap = 20
  const targetGap = 20
  const sourceW = (usableW - (sources.length - 1) * sourceGap) / sources.length
  const targetW = (usableW - (targets.length - 1) * targetGap) / targets.length

  return (
    <figure className="my-5 bg-surface-container-low rounded-xl p-4 border border-outline-variant">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={ariaLabel} className="w-full h-auto block">
        <defs>
          <marker id="md-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#4a4e4a" />
          </marker>
        </defs>
        <g fontFamily="Nunito Sans, sans-serif" fontSize="11">
          {sourcesLabel && (
            <text x={w / 2} y={22} textAnchor="middle" fontWeight="700" fill="#2e3230" fontSize="13">
              {sourcesLabel}
            </text>
          )}
          {sources.map((s, i) => {
            const x = pad + i * (sourceW + sourceGap)
            return (
              <g key={i} transform={`translate(${x}, ${sourceY})`}>
                <rect width={sourceW} height={sourceH} rx={8} fill="#f0e8db" stroke="#6b6358" />
                <text x={sourceW / 2} y={sourceH / 2 + 5} textAnchor="middle" fontWeight="700" fill="#2e3230">
                  {s}
                </text>
              </g>
            )
          })}

          {targetsLabel && (
            <text x={w / 2} y={targetY - 20} textAnchor="middle" fontWeight="700" fill="#2e3230" fontSize="13">
              {targetsLabel}
            </text>
          )}
          {targets.map((t, i) => {
            const x = pad + i * (targetW + targetGap)
            const tone = t.tone ?? (i === 0 ? 'ok' : i === targets.length - 1 ? 'ok' : 'neutral')
            const style = TARGET_STYLES[tone]
            return (
              <g key={i} transform={`translate(${x}, ${targetY})`}>
                <rect width={targetW} height={targetH} rx={12} fill={style.fill} stroke={style.stroke} strokeWidth="1.5" />
                <text x={targetW / 2} y={24} textAnchor="middle" fontWeight="700" fill="#2e3230">
                  {t.label}
                </text>
                {t.body && (
                  <text x={targetW / 2} y={44} textAnchor="middle" fill="#4a4e4a" fontSize="10">
                    {t.body}
                  </text>
                )}
              </g>
            )
          })}

          {/* Links */}
          {links.map((link, i) => {
            const fromX = pad + link.from * (sourceW + sourceGap) + sourceW / 2
            const fromY = sourceY + sourceH
            const toX = pad + link.to * (targetW + targetGap) + targetW / 2
            const toY = targetY
            return (
              <line
                key={i}
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke="#4a4e4a"
                strokeWidth="1.5"
                markerEnd="url(#md-arr)"
              />
            )
          })}
        </g>
      </svg>
      <figcaption className="text-xs text-on-surface-variant mt-2 text-center">{caption}</figcaption>
    </figure>
  )
}
