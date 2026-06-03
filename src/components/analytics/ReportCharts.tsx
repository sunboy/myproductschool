'use client'

// ReportCharts — renders the markdown tables an analyst wrote to /workspace/report.md
// as recharts bar/line charts. Tables that aren't a good chart fit (too dense, no
// numeric series) fall back to a clean HTML table so the data still reads as
// intentional. Used in the post-session mirror and the public share artifact.

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { parseReportTables, parseNumericCell, type ParsedTable } from '@/lib/analytics/parseReportTables'

// Terra palette as CSS vars — recharts fill/stroke accept these strings, so no
// raw hex enters the component.
const SERIES_COLORS = [
  'var(--color-primary)',
  'var(--color-tertiary)',
  'var(--color-secondary)',
  'var(--color-primary-container)',
]

interface ReportChartsProps {
  markdown: string | null | undefined
  /** Visual density. 'mirror' = compact private debrief; 'share' = public artifact. */
  variant?: 'mirror' | 'share'
  className?: string
}

interface ChartDatum {
  [key: string]: string | number
}

/** Build recharts-friendly row objects: category label + numeric series values. */
function toChartData(table: ParsedTable): { data: ChartDatum[]; seriesKeys: string[]; categoryKey: string } {
  const categoryKey = table.headers[table.categoryColumn] || 'category'
  const seriesKeys = table.numericColumns.map((c) => table.headers[c] || `series_${c}`)
  const data = table.rows.map((row) => {
    const datum: ChartDatum = { [categoryKey]: row[table.categoryColumn] ?? '' }
    table.numericColumns.forEach((c, idx) => {
      const v = parseNumericCell(row[c] ?? '')
      datum[seriesKeys[idx]] = v ?? 0
    })
    return datum
  })
  return { data, seriesKeys, categoryKey }
}

function TableFallback({ table }: { table: ParsedTable }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-outline-variant">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-surface-container-high">
            {table.headers.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left font-label font-semibold text-on-surface-variant"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={r} className="border-t border-outline-variant">
              {row.map((cell, c) => (
                <td key={c} className="px-3 py-2 font-body text-on-surface">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ChartCard({ table, height }: { table: ParsedTable; height: number }) {
  const { data, seriesKeys, categoryKey } = toChartData(table)

  const axisProps = {
    tick: { fontSize: 12, fill: 'var(--color-on-surface-variant)' },
    stroke: 'var(--color-outline-variant)',
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      {table.chartKind === 'line' ? (
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" />
          <XAxis dataKey={categoryKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface-container-highest)',
              border: '1px solid var(--color-outline-variant)',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          {seriesKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {seriesKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      ) : (
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} />
          <XAxis dataKey={categoryKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip
            cursor={{ fill: 'var(--color-surface-container)' }}
            contentStyle={{
              background: 'var(--color-surface-container-highest)',
              border: '1px solid var(--color-outline-variant)',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          {seriesKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {seriesKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={SERIES_COLORS[i % SERIES_COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      )}
    </ResponsiveContainer>
  )
}

export function ReportCharts({ markdown, variant = 'share', className }: ReportChartsProps) {
  const tables = useMemo(() => parseReportTables(markdown ?? ''), [markdown])
  if (tables.length === 0) return null

  const height = variant === 'mirror' ? 220 : 280

  return (
    <div className={['space-y-4', className].filter(Boolean).join(' ')}>
      {tables.map((table, i) => (
        <div key={i} className="rounded-xl bg-surface-container p-4">
          {table.caption && (
            <p className="mb-3 font-label text-sm font-semibold text-on-surface-variant">
              {table.caption}
            </p>
          )}
          {table.chartKind === 'none' ? (
            <TableFallback table={table} />
          ) : (
            <ChartCard table={table} height={height} />
          )}
        </div>
      ))}
    </div>
  )
}
