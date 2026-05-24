import { z } from 'zod'

const SceneColumnSchema = z.object({
  name: z.string().max(200),
  type: z.string().max(80).optional(),
  constraints: z.array(z.enum(['PK', 'FK', 'UNIQUE', 'NOT NULL', 'INDEX'])).max(12).default([]),
  foreignKey: z.object({
    table: z.string().max(200),
    column: z.string().max(200),
  }).optional(),
  raw: z.string().max(400).default(''),
})

const SceneEntitySchema = z.object({
  id: z.string().max(200),
  label: z.string().max(300),
  type: z.string().max(80),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite(),
  height: z.number().finite(),
  columns: z.array(SceneColumnSchema).max(80).default([]),
})

const SceneConnectionSchema = z.object({
  from: z.string().max(300),
  to: z.string().max(300),
  label: z.string().max(300).optional(),
})

const SceneGroupSchema = z.object({
  label: z.string().max(300),
  members: z.array(z.string().max(300)).max(80),
})

const CanvasSceneSummarySchema = z.object({
  elementCount: z.number().int().min(0).max(10000),
  entities: z.array(SceneEntitySchema).max(200).default([]),
  connections: z.array(SceneConnectionSchema).max(400).default([]),
  groups: z.array(SceneGroupSchema).max(120).default([]),
  freeText: z.array(z.string().max(1000)).max(200).default([]),
  foreignKeys: z.array(z.object({
    from: z.string().max(300),
    fromColumn: z.string().max(200),
    toTable: z.string().max(300),
    toColumn: z.string().max(200),
  })).max(400).default([]),
})

function truncateUnknown(value: unknown, maxLength = 4000): unknown {
  if (value == null) return value
  if (typeof value === 'string') {
    return value.length > maxLength ? `${value.slice(0, maxLength)}...(truncated)` : value
  }

  try {
    const serialized = JSON.stringify(value)
    if (serialized.length <= maxLength) return value
    return {
      truncated: true,
      preview: serialized.slice(0, maxLength),
    }
  } catch {
    return {
      truncated: true,
      preview: 'run result could not be serialized',
    }
  }
}

const RawLiveInterviewArtifactSnapshotSchema = z.object({
  type: z.enum(['canvas', 'editor']),
  discipline: z.string().max(100).optional(),
  capturedAt: z.number().finite().nonnegative().optional(),
  elementCount: z.number().int().min(0).max(10000).optional(),
  elementTypes: z.record(z.string(), z.number().int().min(0)).optional(),
  textLabels: z.array(z.string().max(1000)).max(1000).optional(),
  sceneSummary: CanvasSceneSummarySchema.optional(),
  code: z.string().max(40000).optional(),
  language: z.string().max(80).optional(),
  cursorLine: z.number().int().min(0).optional(),
  pasteEvents: z.array(z.object({
    length: z.number().int().min(0),
    percentOfBuffer: z.number().finite().min(0).max(1),
    timestamp: z.number().finite().nonnegative(),
  })).max(100).optional(),
  runResult: z.unknown().optional(),
})

type RawLiveInterviewArtifactSnapshot = z.infer<typeof RawLiveInterviewArtifactSnapshotSchema>

export function normalizeLiveInterviewArtifactSnapshot(
  snapshot: RawLiveInterviewArtifactSnapshot,
): RawLiveInterviewArtifactSnapshot {
  return {
    ...snapshot,
    code: typeof snapshot.code === 'string' ? snapshot.code.slice(0, 40000) : snapshot.code,
    textLabels: snapshot.textLabels?.slice(0, 1000),
    runResult: truncateUnknown(snapshot.runResult),
  }
}

export const LiveInterviewArtifactSnapshotSchema = RawLiveInterviewArtifactSnapshotSchema
  .transform(normalizeLiveInterviewArtifactSnapshot)

export type LiveInterviewArtifactSnapshot = z.output<typeof LiveInterviewArtifactSnapshotSchema>
