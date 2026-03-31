import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateEmbedding } from '@/lib/embeddings'

// Single record: POST { table, id, column, text }
// Batch seeding: POST { batch: true } — reads all text fields and generates embeddings

const BATCH_SOURCES = [
  {
    table: 'challenge_prompts',
    idCol: 'id',
    textCol: 'prompt_text',
    embeddingCol: 'scenario_embedding',
  },
  {
    table: 'challenge_steps',
    idCol: 'id',
    textCol: 'recommended',
    embeddingCol: 'recommended_embedding',
  },
  {
    table: 'challenge_steps',
    idCol: 'id',
    textCol: 'pattern_body',
    embeddingCol: 'pattern_embedding',
  },
  {
    table: 'thinking_traps',
    idCol: 'id',
    textCol: 'description',
    embeddingCol: 'exemplar_embedding',
  },
]

export async function POST(req: NextRequest) {
  const body = await req.json()
  const admin = createAdminClient()

  // Batch mode
  if (body.batch) {
    const results: { source: string; processed: number; skipped: number; errors: number }[] = []

    for (const source of BATCH_SOURCES) {
      let processed = 0
      let skipped = 0
      let errors = 0

      const { data: rows, error } = await admin
        .from(source.table)
        .select(`${source.idCol}, ${source.textCol}, ${source.embeddingCol}`)
        .is(source.embeddingCol, null)

      if (error) {
        results.push({ source: `${source.table}.${source.embeddingCol}`, processed, skipped, errors: -1 })
        continue
      }

      for (const row of (rows ?? [])) {
        const text = row[source.textCol as keyof typeof row] as string | null
        if (!text) { skipped++; continue }

        const embedding = await generateEmbedding(text)
        if (!embedding) { errors++; continue }

        const { error: updateErr } = await admin
          .from(source.table)
          .update({ [source.embeddingCol]: JSON.stringify(embedding) })
          .eq(source.idCol, row[source.idCol as keyof typeof row])

        if (updateErr) { errors++ } else { processed++ }
      }

      results.push({ source: `${source.table}.${source.embeddingCol}`, processed, skipped, errors })
    }

    return NextResponse.json({ ok: true, results })
  }

  // Single-record mode
  const { table, id, column, text } = body as { table: string; id: string; column: string; text: string }
  if (!table || !id || !column || !text) {
    return NextResponse.json({ error: 'table, id, column, text are required' }, { status: 400 })
  }

  const embedding = await generateEmbedding(text)
  if (!embedding) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'embedding generation failed' })
  }

  const { error } = await admin
    .from(table)
    .update({ [column]: JSON.stringify(embedding) })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
