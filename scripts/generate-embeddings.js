#!/usr/bin/env node
/**
 * One-time batch script to generate embeddings for all content.
 * Uses Supabase's built-in AI (gte-small, 384 dims) via the admin client.
 *
 * Usage:
 *   node scripts/generate-embeddings.js
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tikkhvxlclivixqqqjyb.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpa2todnhsY2xpdml4cXFxanliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMxMzI5MCwiZXhwIjoyMDc2ODg5MjkwfQ.SLtlceDB4vzlDWukbFpeYNQoXglqL1U41nuAKoRdSlM'

const EMBEDDING_DIMS = 384

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function generateEmbedding(text) {
  const { data, error } = await supabase.functions.invoke('embed', {
    body: { input: text.slice(0, 2000) },
  })

  if (error) {
    console.error(`  Supabase function error: ${error.message}`)
    return null
  }

  const embedding = data?.embedding
  if (!embedding || embedding.length !== EMBEDDING_DIMS) {
    console.error(`  Unexpected embedding shape (got ${embedding?.length} dims, expected ${EMBEDDING_DIMS})`)
    return null
  }
  return embedding
}

async function processTable({ table, idCol, textCol, embeddingCol }) {
  console.log(`\n── ${table}.${embeddingCol} ──`)

  const { data: rows, error } = await supabase
    .from(table)
    .select(`${idCol}, ${textCol}`)
    .is(embeddingCol, null)

  if (error) {
    console.error(`  Query error: ${error.message}`)
    return { processed: 0, skipped: 0, errors: 1 }
  }

  console.log(`  ${rows.length} rows need embeddings`)

  let processed = 0, skipped = 0, errors = 0

  for (const row of rows) {
    const text = row[textCol]
    if (!text || typeof text !== 'string' || !text.trim()) {
      skipped++
      continue
    }

    const embedding = await generateEmbedding(text)
    if (!embedding) {
      errors++
      continue
    }

    const { error: updateErr } = await supabase
      .from(table)
      .update({ [embeddingCol]: JSON.stringify(embedding) })
      .eq(idCol, row[idCol])

    if (updateErr) {
      console.error(`  Update error for ${row[idCol]}: ${updateErr.message}`)
      errors++
    } else {
      processed++
      if (processed % 10 === 0) console.log(`  ... ${processed} done`)
    }

    // Small delay to stay within rate limits
    await new Promise(r => setTimeout(r, 50))
  }

  console.log(`  Done: ${processed} processed, ${skipped} skipped, ${errors} errors`)
  return { processed, skipped, errors }
}

const SOURCES = [
  { table: 'challenge_prompts', idCol: 'id', textCol: 'prompt_text', embeddingCol: 'scenario_embedding' },
  { table: 'challenge_steps', idCol: 'id', textCol: 'recommended', embeddingCol: 'recommended_embedding' },
  { table: 'challenge_steps', idCol: 'id', textCol: 'pattern_body', embeddingCol: 'pattern_embedding' },
  { table: 'thinking_traps', idCol: 'id', textCol: 'description', embeddingCol: 'exemplar_embedding' },
]

async function main() {
  console.log('HackProduct — Embeddings batch generator')
  console.log(`Model: gte-small (${EMBEDDING_DIMS} dims) via Supabase AI`)

  let total = { processed: 0, skipped: 0, errors: 0 }

  for (const source of SOURCES) {
    const result = await processTable(source)
    total.processed += result.processed
    total.skipped += result.skipped
    total.errors += result.errors
  }

  console.log(`\n═══ Summary ═══`)
  console.log(`Processed: ${total.processed}`)
  console.log(`Skipped:   ${total.skipped}`)
  console.log(`Errors:    ${total.errors}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
