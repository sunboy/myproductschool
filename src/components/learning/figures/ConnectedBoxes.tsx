import type { ConnectedBoxesFigure, FigureTone } from '@/lib/types'

const BOX_STYLES: Record<NonNullable<FigureTone>, { fill: string; stroke: string }> = {
  ok:      { fill: '#d8f0de', stroke: '#4a7c59' },
  warn:    { fill: '#f0e8db', stroke: '#b83230' },
  neutral: { fill: '#f0e8db', stroke: '#6b6358' },
}

const DEFAULT_TONES: FigureTone[] = ['ok', 'neutral', 'warn', 'ok']

export function ConnectedBoxes({ figure }: { figure: ConnectedBoxesFigure }) {
  const { boxes, orientation, showArrows, caption, ariaLabel } = figure
  const isH = orientation === 'horizontal'
  const w = 720
  const pad = 16
  const gap = showArrows ? 24 : 16

  if (isH) {
    const boxW = (w - pad * 2 - gap * (boxes.length - 1)) / boxes.length
    const boxH = 120
    const h = boxH + 40
    return (
      <figure className="my-5 bg-surface-container-low rounded-xl p-4 border border-outline-variant">
        <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={ariaLabel} className="w-full h-auto block">
          <defs>
            <marker id="cb-h-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#4a4e4a" />
            </marker>
          </defs>
          <g fontFamily="Nunito Sans, sans-serif" fontSize="12">
            {boxes.map((box, i) => {
              const x = pad + i * (boxW + gap)
              const tone = box.tone ?? DEFAULT_TONES[i % DEFAULT_TONES.length] ?? 'ok'
              const style = BOX_STYLES[tone]
              return (
                <g key={i} transform={`translate(${x}, 16)`}>
                  <rect width={boxW} height={boxH} rx={14} fill={style.fill} stroke={style.stroke} strokeWidth="1.5" />
                  <text x={boxW / 2} y={32} textAnchor="middle" fontWeight="700" fontSize="14" fill="#2e3230">
                    {box.label}
                  </text>
                  {box.body.map((line, li) => (
                    <text key={li} x={boxW / 2} y={58 + li * 18} textAnchor="middle" fill="#4a4e4a" fontSize="11">
                      {line}
                    </text>
                  ))}
                  {box.anti && (
                    <text
                      x={boxW / 2}
                      y={boxH - 16}
                      textAnchor="middle"
                      fill="#b83230"
                      fontSize="10"
                      fontStyle="italic"
                    >
                      {box.anti}
                    </text>
                  )}
                </g>
              )
            })}
            {showArrows &&
              boxes.slice(0, -1).map((_, i) => {
                const x1 = pad + (i + 1) * boxW + i * gap
                const x2 = x1 + gap
                const y = 16 + boxH / 2
                return <line key={i} x1={x1} y1={y} x2={x2} y2={y} stroke="#4a4e4a" strokeWidth="1.5" markerEnd="url(#cb-h-arr)" />
              })}
          </g>
        </svg>
        <figcaption className="text-xs text-on-surface-variant mt-2 text-center">{caption}</figcaption>
      </figure>
    )
  }

  // Vertical stack
  const boxW = 400
  const boxH = 70
  const count = boxes.length
  const h = 20 + count * boxH + (count - 1) * gap + 20
  return (
    <figure className="my-5 bg-surface-container-low rounded-xl p-4 border border-outline-variant">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={ariaLabel} className="w-full h-auto block">
        <defs>
          <marker id="cb-v-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#4a4e4a" />
          </marker>
        </defs>
        <g fontFamily="Nunito Sans, sans-serif" fontSize="12">
          {boxes.map((box, i) => {
            const x = (w - boxW) / 2
            const y = 20 + i * (boxH + gap)
            const tone = box.tone ?? DEFAULT_TONES[i % DEFAULT_TONES.length] ?? 'ok'
            const style = BOX_STYLES[tone]
            return (
              <g key={i} transform={`translate(${x}, ${y})`}>
                <rect width={boxW} height={boxH} rx={14} fill={style.fill} stroke={style.stroke} strokeWidth="1.5" />
                <text x={boxW / 2} y={26} textAnchor="middle" fontWeight="700" fontSize="14" fill="#2e3230">
                  {box.label}
                </text>
                {box.body.slice(0, 1).map((line, li) => (
                  <text key={li} x={boxW / 2} y={48} textAnchor="middle" fill="#4a4e4a" fontSize="11">
                    {line}
                  </text>
                ))}
                {box.anti && (
                  <text x={boxW / 2} y={boxH - 10} textAnchor="middle" fill="#b83230" fontSize="10" fontStyle="italic">
                    {box.anti}
                  </text>
                )}
              </g>
            )
          })}
          {showArrows &&
            boxes.slice(0, -1).map((_, i) => {
              const y1 = 20 + (i + 1) * boxH + i * gap
              const y2 = y1 + gap
              const x = w / 2
              return <line key={i} x1={x} y1={y1} x2={x} y2={y2} stroke="#4a4e4a" strokeWidth="1.5" markerEnd="url(#cb-v-arr)" />
            })}
        </g>
      </svg>
      <figcaption className="text-xs text-on-surface-variant mt-2 text-center">{caption}</figcaption>
    </figure>
  )
}
