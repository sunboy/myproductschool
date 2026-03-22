interface Row {
  dimension: string
  weak: string
  strong: string
}

interface PMComparisonTableProps {
  rows: Row[]
}

export function PMComparisonTable({ rows }: PMComparisonTableProps) {
  return (
    <div className="rounded-2xl overflow-hidden border border-outline-variant my-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-container-highest">
            <th className="text-left px-4 py-3 font-label font-semibold text-on-surface-variant w-1/4">Dimension</th>
            <th className="text-left px-4 py-3 font-label font-semibold text-error w-3/8">Weak PM approach</th>
            <th className="text-left px-4 py-3 font-label font-semibold text-primary w-3/8">Strong PM approach</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-surface' : 'bg-surface-container-low'}>
              <td className="px-4 py-3 font-semibold text-on-surface">{row.dimension}</td>
              <td className="px-4 py-3 text-on-surface-variant">{row.weak}</td>
              <td className="px-4 py-3 text-on-surface">{row.strong}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
