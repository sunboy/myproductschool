'use client'

interface Column {
  name: string
  type: string
  constraints?: string[]
}

// Authoring sometimes produces columns as bare strings ("user_id") instead of
// {name, type, constraints} objects. Normalize both shapes at the boundary so
// the component renders the column name unconditionally.
type ColumnInput = Column | string

function normalizeColumn(input: ColumnInput): Column {
  if (typeof input === 'string') return { name: input, type: '' }
  return { name: input.name, type: input.type ?? '', constraints: input.constraints }
}

interface TableDef {
  name: string
  columns: ColumnInput[]
}

interface Relationship {
  from: string // e.g. "orders.user_id"
  to: string   // e.g. "users.id"
  type: 'many-to-one' | 'one-to-many' | 'one-to-one' | 'many-to-many'
}

export interface SchemaDiagramData {
  tables: TableDef[]
  relationships?: Relationship[]
}

interface SchemaDiagramProps {
  schema_diagram: SchemaDiagramData
}

// Constraint badge colours
function ConstraintBadge({ label }: { label: string }) {
  const isKey = label === 'PK'
  const isFK = label.startsWith('FK')
  const isNotNull = label === 'NOT NULL'

  const classes = isKey
    ? 'bg-primary-container text-on-primary-container'
    : isFK
      ? 'bg-tertiary-container text-on-tertiary-container'
      : isNotNull
        ? 'bg-secondary-container text-on-secondary-container'
        : 'bg-surface-container-highest text-on-surface-variant'

  return (
    <span className={`inline-block text-[9px] font-label font-bold px-1 rounded leading-4 ${classes}`}>
      {label}
    </span>
  )
}

function TableCard({ table }: { table: TableDef }) {
  return (
    <div
      className="bg-surface-container rounded-lg border border-outline-variant shadow-sm overflow-hidden min-w-[180px]"
      data-testid={`schema-table-${table.name}`}
    >
      {/* Table header */}
      <div className="bg-primary-container px-3 py-2 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[15px]">table_chart</span>
        <span className="text-xs font-label font-bold text-on-primary-container">{table.name}</span>
      </div>

      {/* Column rows */}
      <div className="divide-y divide-outline-variant/30">
        {table.columns.map((rawCol) => {
          const col = normalizeColumn(rawCol)
          const hasPK = col.constraints?.includes('PK')
          return (
            <div
              key={col.name}
              className={`flex items-center gap-2 px-3 py-1.5 ${hasPK ? 'bg-surface-container-low' : ''}`}
            >
              {/* PK indicator */}
              <span
                className="material-symbols-outlined text-[13px] flex-shrink-0"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                aria-hidden="true"
              >
                {hasPK ? 'key' : 'circle'}
              </span>
              {/* Column name */}
              <span className={`text-xs font-label flex-1 ${hasPK ? 'font-semibold text-on-surface' : 'text-on-surface-variant'}`}>
                {col.name}
              </span>
              {/* Type — only render when present */}
              {col.type && (
                <span className="text-[10px] text-on-surface-variant/70 font-mono">{col.type}</span>
              )}
              {/* Constraints */}
              {col.constraints && col.constraints.length > 0 && (
                <div className="flex gap-0.5 flex-wrap justify-end">
                  {col.constraints.map((c) => (
                    <ConstraintBadge key={c} label={c} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RelationshipList({ relationships }: { relationships: Relationship[] }) {
  if (relationships.length === 0) return null

  return (
    <div className="mt-3 border-t border-outline-variant/40 pt-3">
      <p className="text-[10px] font-label font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
        Relationships
      </p>
      <div className="space-y-1">
        {relationships.map((rel, i) => {
          const arrow = rel.type === 'many-to-one' ? '→' : rel.type === 'one-to-many' ? '←' : '↔'
          return (
            <div key={i} className="flex items-center gap-1.5 text-xs text-on-surface-variant font-mono">
              <span className="text-tertiary font-bold">{arrow}</span>
              <span>{rel.from}</span>
              <span className="text-on-surface-variant/50">→</span>
              <span>{rel.to}</span>
              <span className="text-[10px] text-on-surface-variant/60 ml-1">({rel.type})</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SchemaDiagram({ schema_diagram }: SchemaDiagramProps) {
  const { tables, relationships = [] } = schema_diagram

  if (!tables || tables.length === 0) {
    return (
      <div className="text-sm text-on-surface-variant italic px-1">No schema available.</div>
    )
  }

  return (
    <div className="space-y-3" data-testid="schema-diagram">
      {/* Table cards in a wrapping flex row */}
      <div className="flex flex-wrap gap-3">
        {tables.map((table) => (
          <TableCard key={table.name} table={table} />
        ))}
      </div>

      {/* Relationships legend */}
      {relationships.length > 0 && <RelationshipList relationships={relationships} />}
    </div>
  )
}
