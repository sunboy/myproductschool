/**
 * Structured representation of an Excalidraw scene for AI consumption.
 * Single source of truth for "what does Hatch see" — used by the live coach,
 * proactive nudge, and end-of-session grader.
 */

// ---------------------------------------------------------------------------
// Column-level schema types (schema-as-text convention)
// ---------------------------------------------------------------------------

export type ColumnConstraint = 'PK' | 'FK' | 'UNIQUE' | 'NOT NULL' | 'INDEX'

export interface SceneColumn {
  name: string
  type?: string                                       // optional, e.g. 'INTEGER', 'TEXT'
  constraints: ColumnConstraint[]
  foreignKey?: { table: string; column: string }     // when FK→ is present
  raw: string                                         // original line, for unparseable cases
}

// ---------------------------------------------------------------------------
// Scene entity / scene types
// ---------------------------------------------------------------------------

export interface SceneEntity {
  id: string
  label: string
  type: string
  x: number
  y: number
  width: number
  height: number
  columns: SceneColumn[]                             // [] for single-line entities
}

export interface SceneConnection {
  from: string
  to: string
  label?: string
}

export interface SceneGroup {
  label: string
  members: string[]
}

export interface CanvasScene {
  elementCount: number
  entities: SceneEntity[]
  connections: SceneConnection[]
  groups: SceneGroup[]
  freeText: string[]
  foreignKeys: Array<{ from: string; fromColumn: string; toTable: string; toColumn: string }>
}

type RawElement = {
  id?: string
  type?: string
  x?: number
  y?: number
  width?: number
  height?: number
  text?: string
  label?: { text?: string }
  isDeleted?: boolean
  startBinding?: { elementId?: string } | null
  endBinding?: { elementId?: string } | null
  points?: number[][]
  boundElements?: Array<{ id: string; type: string }>
  containerId?: string | null
}

const SHAPE_TYPES = new Set(['rectangle', 'ellipse', 'diamond', 'image'])
const ARROW_TYPES = new Set(['arrow', 'line'])
const TEXT_TYPES = new Set(['text'])

// SQL type keywords that are treated as type tokens rather than constraints
const SQL_TYPES = new Set([
  'INTEGER', 'INT', 'BIGINT', 'SMALLINT', 'TINYINT',
  'TEXT', 'VARCHAR', 'CHAR', 'NVARCHAR',
  'FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC', 'REAL',
  'BOOLEAN', 'BOOL',
  'DATE', 'TIME', 'TIMESTAMP', 'DATETIME',
  'UUID', 'JSON', 'JSONB', 'BLOB', 'BYTEA', 'SERIAL', 'BIGSERIAL',
])

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined
}

function getLabel(el: RawElement): string | undefined {
  return asString(el.label?.text) ?? asString(el.text)
}

function center(el: RawElement): { cx: number; cy: number } {
  const x = el.x ?? 0
  const y = el.y ?? 0
  const w = el.width ?? 0
  const h = el.height ?? 0
  return { cx: x + w / 2, cy: y + h / 2 }
}

function findNearestEntity(
  arrow: RawElement,
  entities: SceneEntity[],
  endpoint: 'start' | 'end'
): string | undefined {
  if (entities.length === 0) return undefined
  const ax = arrow.x ?? 0
  const ay = arrow.y ?? 0
  const points = arrow.points ?? []
  const point =
    endpoint === 'start' ? points[0] ?? [0, 0] : points[points.length - 1] ?? [0, 0]
  const px = ax + (point[0] ?? 0)
  const py = ay + (point[1] ?? 0)
  let best: { label: string; dist: number } | null = null
  for (const e of entities) {
    const ex = e.x + e.width / 2
    const ey = e.y + e.height / 2
    const dist = Math.hypot(px - ex, py - ey)
    if (!best || dist < best.dist) best = { label: e.label, dist }
  }
  // Reject if too far — likely a freestanding arrow
  if (!best || best.dist > 400) return undefined
  return best.label
}

function clusterEntities(entities: SceneEntity[]): SceneGroup[] {
  // Simple spatial clustering: groups of 3+ entities within 250px of each other.
  // Returned as descriptive groups so Hatch can refer to "the entities near the API"
  // without us hand-rolling a real graph algorithm.
  if (entities.length < 3) return []
  const visited = new Set<string>()
  const groups: SceneGroup[] = []
  for (const seed of entities) {
    if (visited.has(seed.id)) continue
    const cluster: SceneEntity[] = [seed]
    visited.add(seed.id)
    for (const other of entities) {
      if (visited.has(other.id)) continue
      const dist = Math.hypot(seed.x - other.x, seed.y - other.y)
      if (dist < 250) {
        cluster.push(other)
        visited.add(other.id)
      }
    }
    if (cluster.length >= 3) {
      groups.push({
        label: `cluster near "${cluster[0].label}"`,
        members: cluster.map((c) => c.label),
      })
    }
  }
  return groups
}

// ---------------------------------------------------------------------------
// Column parsing
// ---------------------------------------------------------------------------

/**
 * Separator line: a line containing only ─, -, =, whitespace
 * (no alphanumeric content)
 */
const SEPARATOR_RE = /^[\s─\-=]+$/

/**
 * FK arrow token: FK→table.column  or  FK->table.column
 * Arrow may be → (U+2192) or ->
 */
const FK_TOKEN_RE = /^FK[→>-]>?(.+)\.(.+)$/i

/**
 * Parse a single column line into a SceneColumn.
 * Returns null if the line has no recognizable name token (skip silently).
 */
function parseColumnLine(line: string): SceneColumn | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  // Normalise arrow variants: FK->  FK→  all become FK→ for matching
  const normalised = trimmed.replace(/FK->/gi, 'FK→').replace(/FK>/gi, 'FK→')

  // Split on whitespace, but keep "NOT NULL" as a two-word group.
  // Strategy: join tokens, then find "NOT NULL" before splitting individually.
  const rawTokens = normalised.split(/\s+/).filter(Boolean)
  if (rawTokens.length === 0) return null

  const name = rawTokens[0]
  // Name must start with a letter, underscore, or digit (basic sanity check)
  if (!/^[\w]/.test(name)) return null

  const constraints: ColumnConstraint[] = []
  let type: string | undefined
  let foreignKey: { table: string; column: string } | undefined

  // Re-join remaining tokens to detect "NOT NULL" as two-word token
  const rest = rawTokens.slice(1)
  const restStr = rest.join(' ')

  // Check for NOT NULL (two-word)
  const hasNotNull = /\bNOT\s+NULL\b/i.test(restStr)
  if (hasNotNull) constraints.push('NOT NULL')

  // Remove "NOT NULL" from restStr before processing individual tokens
  const withoutNotNull = restStr.replace(/\bNOT\s+NULL\b/i, '').trim()
  const remainingTokens = withoutNotNull.split(/\s+/).filter(Boolean)

  for (const token of remainingTokens) {
    const upper = token.toUpperCase()

    if (upper === 'PK') {
      constraints.push('PK')
    } else if (upper === 'UNIQUE') {
      constraints.push('UNIQUE')
    } else if (upper === 'INDEX') {
      constraints.push('INDEX')
    } else if (/^FK[→]/i.test(token)) {
      // FK→table.column
      const match = token.match(/^FK[→](.+)\.(.+)$/i)
      if (match && match[1] && match[2]) {
        constraints.push('FK')
        foreignKey = { table: match[1], column: match[2] }
      } else {
        // Malformed FK — keep as constraint marker without target
        constraints.push('FK')
      }
    } else if (SQL_TYPES.has(upper)) {
      type = upper
    }
    // Unrecognised tokens are silently ignored (they'll appear in `raw`)
  }

  return {
    name,
    type,
    constraints,
    foreignKey,
    raw: trimmed,
  }
}

/**
 * Parse multi-line entity body text into entity name + columns.
 *
 * Format:
 *   Line 1 = entity name
 *   Line 2 = optional separator (─, -, =, whitespace only)
 *   Lines 3+ = columns
 */
export function parseColumns(text: string): { entityName: string; columns: SceneColumn[] } {
  const lines = text.split('\n')
  const nonEmpty = lines.filter((l) => l.trim().length > 0)

  if (nonEmpty.length === 0) {
    return { entityName: '', columns: [] }
  }

  const entityName = nonEmpty[0].trim()

  // Single-line entity — no columns
  if (nonEmpty.length === 1) {
    return { entityName, columns: [] }
  }

  // Determine where column lines start: skip separator immediately after name
  let startIndex = 1
  if (nonEmpty.length > 1 && SEPARATOR_RE.test(nonEmpty[1])) {
    startIndex = 2
  }

  const columns: SceneColumn[] = []
  for (let i = startIndex; i < nonEmpty.length; i++) {
    const col = parseColumnLine(nonEmpty[i])
    if (col) columns.push(col)
  }

  return { entityName, columns }
}

// ---------------------------------------------------------------------------
// Scene summarisation
// ---------------------------------------------------------------------------

export function summarizeScene(elements: unknown[]): CanvasScene {
  const visible = (elements as RawElement[]).filter((el) => !el.isDeleted)

  // Build a lookup map of all elements by id (needed for bound-text resolution)
  const elementsById = new Map<string, RawElement>()
  for (const el of visible) {
    if (el.id) elementsById.set(el.id, el)
  }

  // Track which text element ids are "consumed" by being bound to a shape,
  // so they don't also appear in freeText.
  const consumedTextIds = new Set<string>()

  const entities: SceneEntity[] = []
  const arrows: RawElement[] = []

  for (const el of visible) {
    const type = el.type ?? 'unknown'
    if (SHAPE_TYPES.has(type)) {
      // Resolve label: prefer el.label.text (Excalidraw inline label),
      // then look for a bound text element via boundElements array.
      let labelText: string | undefined = asString(el.label?.text)
      let boundTextId: string | undefined

      if (!labelText && el.boundElements) {
        for (const bound of el.boundElements) {
          if (bound.type === 'text') {
            const textEl = elementsById.get(bound.id)
            if (textEl) {
              const t = asString(textEl.text)
              if (t) {
                labelText = t
                boundTextId = bound.id
              }
            }
          }
        }
      }

      if (labelText) {
        if (boundTextId) consumedTextIds.add(boundTextId)

        const c = center(el)
        const { entityName, columns } = parseColumns(labelText)
        const resolvedLabel = entityName || labelText

        entities.push({
          id: el.id ?? `anon-${entities.length}`,
          label: resolvedLabel,
          type,
          x: c.cx,
          y: c.cy,
          width: el.width ?? 0,
          height: el.height ?? 0,
          columns,
        })
      }
    } else if (ARROW_TYPES.has(type)) {
      arrows.push(el)
    }
    // TEXT_TYPES handled below after consumedTextIds is populated
  }

  // Collect freeText — standalone text elements NOT consumed by a shape binding
  const freeText: string[] = []
  for (const el of visible) {
    const type = el.type ?? 'unknown'
    if (TEXT_TYPES.has(type)) {
      if (el.id && consumedTextIds.has(el.id)) continue
      // Also skip text elements that have a containerId (they belong to a shape)
      if (el.containerId) {
        if (el.id) consumedTextIds.add(el.id)
        continue
      }
      const label = getLabel(el)
      if (label) freeText.push(label)
    }
  }

  // Resolve arrows to entity-to-entity connections via:
  // 1. explicit startBinding/endBinding (Excalidraw's preferred linkage)
  // 2. nearest-entity heuristic for unbound arrows
  const entitiesById = new Map(entities.map((e) => [e.id, e]))
  const connections: SceneConnection[] = []
  for (const arrow of arrows) {
    const startId = arrow.startBinding?.elementId
    const endId = arrow.endBinding?.elementId
    let from = startId ? entitiesById.get(startId)?.label : undefined
    let to = endId ? entitiesById.get(endId)?.label : undefined
    if (!from) from = findNearestEntity(arrow, entities, 'start')
    if (!to) to = findNearestEntity(arrow, entities, 'end')
    if (from && to && from !== to) {
      connections.push({ from, to, label: getLabel(arrow) })
    }
  }

  // Aggregate foreignKeys across all entities
  const foreignKeys: CanvasScene['foreignKeys'] = []
  for (const entity of entities) {
    for (const col of entity.columns) {
      if (col.foreignKey) {
        foreignKeys.push({
          from: entity.label,
          fromColumn: col.name,
          toTable: col.foreignKey.table,
          toColumn: col.foreignKey.column,
        })
      }
    }
  }

  return {
    elementCount: visible.length,
    entities,
    connections,
    groups: clusterEntities(entities),
    freeText,
    foreignKeys,
  }
}

// ---------------------------------------------------------------------------
// Scene → prompt
// ---------------------------------------------------------------------------

export function sceneToPrompt(scene: CanvasScene): string {
  if (scene.elementCount === 0) {
    return 'The canvas is empty. The user has not drawn anything yet.'
  }
  const sections: string[] = [`Canvas has ${scene.elementCount} visible elements.`]

  if (scene.entities.length > 0) {
    const entityLines = scene.entities
      .slice(0, 40)
      .map((e) => {
        const header = `- "${e.label}" (${e.type})`
        if (e.columns.length === 0) return header
        const colLines = e.columns.map((col) => {
          const constraintStr = col.constraints.length > 0 ? ` [${col.constraints.join(', ')}]` : ''
          const fkStr = col.foreignKey ? ` FK→${col.foreignKey.table}.${col.foreignKey.column}` : ''
          // If column has FK constraint, fkStr provides the detail; otherwise just name + type + constraints
          if (col.foreignKey) {
            const otherConstraints = col.constraints.filter((c) => c !== 'FK')
            const otherStr = otherConstraints.length > 0 ? ` [${otherConstraints.join(', ')}]` : ''
            return `  - ${col.name}${fkStr}${otherStr}`
          }
          const typeStr = col.type ? ` ${col.type}` : ''
          return `  - ${col.name}${typeStr}${constraintStr}`
        })
        return [header, ...colLines].join('\n')
      })
      .join('\n')

    sections.push(`## Entities (${scene.entities.length})\n${entityLines}`)
  }

  if (scene.connections.length > 0) {
    sections.push(
      `## Connections (${scene.connections.length})\n` +
        scene.connections
          .slice(0, 40)
          .map((c) => `- "${c.from}" → "${c.to}"${c.label ? ` (${c.label})` : ''}`)
          .join('\n')
    )
  } else if (scene.entities.length > 1) {
    sections.push('## Connections\n- (no arrows connecting the entities yet)')
  }

  if (scene.groups.length > 0) {
    sections.push(
      `## Spatial groups\n` +
        scene.groups
          .map((g) => `- ${g.label}: ${g.members.map((m) => `"${m}"`).join(', ')}`)
          .join('\n')
    )
  }

  if (scene.freeText.length > 0) {
    sections.push(
      `## Notes\n` + scene.freeText.slice(0, 20).map((t) => `- ${t}`).join('\n')
    )
  }

  if (scene.foreignKeys.length > 0) {
    sections.push(
      `## Foreign Keys\n` +
        scene.foreignKeys
          .map((fk) => `- ${fk.from}.${fk.fromColumn} → ${fk.toTable}.${fk.toColumn}`)
          .join('\n')
    )
  }

  return sections.join('\n\n')
}
