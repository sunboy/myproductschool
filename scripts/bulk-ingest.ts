// scripts/bulk-ingest.ts
// Reads Queued rows from the Notion Challenge Pipeline DB, fires generation
// jobs for each, and writes Job IDs back to Notion.
//
// Run: npx tsx --tsconfig tsconfig.json scripts/bulk-ingest.ts
//
// Required env vars:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   NOTION_TOKEN         — Notion integration token
//   ADMIN_SECRET         — x-admin-secret for the Next.js API
//   BASE_URL             — defaults to http://localhost:3001

import { Client } from '@notionhq/client'

const NOTION_DB_ID = 'fa3e6f7e-0fb3-4038-ab90-04b9a3039379'
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3001'
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? 'hackproduct-admin-dev'

const notion = new Client({ auth: process.env.NOTION_TOKEN! })

interface PipelineRow {
  pageId: string
  topic: string
  inputType: 'url' | 'text' | 'question'
  source: string
}

async function getQueuedRows(): Promise<PipelineRow[]> {
  const res = await notion.dataSources.query({
    data_source_id: NOTION_DB_ID,
    filter: {
      property: 'Status',
      select: { equals: 'Queued' },
    },
  })

  const rows: PipelineRow[] = []
  for (const page of res.results) {
    if (page.object !== 'page') continue
    const props = (page as { properties: Record<string, unknown> }).properties as Record<string, { type: string; title?: { plain_text: string }[]; select?: { name: string } | null; rich_text?: { plain_text: string }[] }>

    const topic = props['Topic']?.title?.[0]?.plain_text ?? ''
    const inputType = (props['Input Type']?.select?.name ?? 'question') as PipelineRow['inputType']
    const source = props['Source']?.rich_text?.[0]?.plain_text ?? topic

    if (!source.trim()) {
      console.warn(`  [skip] "${topic}" — no Source text`)
      continue
    }

    rows.push({ pageId: page.id, topic, inputType, source })
  }

  return rows
}

async function createJob(row: PipelineRow): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/admin/content/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': ADMIN_SECRET,
    },
    body: JSON.stringify({
      input_type: row.inputType,
      input_raw: row.source,
      mode: 'local',
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Job creation failed: ${err}`)
  }
  const data = await res.json() as { job_id: string }
  return data.job_id
}

async function updateNotionRow(pageId: string, jobId: string) {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      'Status': { select: { name: 'Generating' } },
      'Job ID': { rich_text: [{ text: { content: jobId } }] },
    },
  })
}

async function markFailed(pageId: string, reason: string) {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      'Status': { select: { name: 'Failed' } },
      'Notes': { rich_text: [{ text: { content: reason.slice(0, 500) } }] },
    },
  })
}

async function main() {
  if (!process.env.NOTION_TOKEN) {
    console.error('NOTION_TOKEN env var required')
    process.exit(1)
  }

  console.log('[bulk-ingest] Reading Queued rows from Challenge Pipeline...')
  const rows = await getQueuedRows()

  if (rows.length === 0) {
    console.log('[bulk-ingest] No queued rows found. Add rows with Status=Queued to the Challenge Pipeline DB.')
    return
  }

  console.log(`[bulk-ingest] Found ${rows.length} queued row(s)\n`)

  for (const row of rows) {
    console.log(`  → "${row.topic}" (${row.inputType})`)
    try {
      const jobId = await createJob(row)
      await updateNotionRow(row.pageId, jobId)
      console.log(`     ✓ job ${jobId} — Notion status → Generating`)
    } catch (err) {
      const msg = String(err)
      console.error(`     ✗ failed: ${msg}`)
      await markFailed(row.pageId, msg)
    }

    // Small delay to avoid hammering the API
    await new Promise(r => setTimeout(r, 500))
  }

  console.log('\n[bulk-ingest] Done. Job server will pick up local-mode jobs automatically.')
  console.log(`[bulk-ingest] Monitor progress at: ${BASE_URL}/admin/content`)
}

main().catch(err => {
  console.error('[bulk-ingest] Fatal:', err)
  process.exit(1)
})
