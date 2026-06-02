#!/usr/bin/env node
/**
 * bq-mcp-server — minimal MCP server for BigQuery access via the bq CLI.
 *
 * Why this exists:
 *   The community Python `mcp-server-bigquery` package requires Python 3.13,
 *   which the Bookworm-slim base image doesn't ship. Rather than juggle
 *   Python versions, we shell out to `bq` (the gcloud BigQuery CLI) which is
 *   already installed in the image and authenticated via
 *   GOOGLE_APPLICATION_CREDENTIALS at the OS level — invisible to the user.
 *
 * Tools exposed (strict whitelist; the user CANNOT see auth secrets):
 *   - bq_list_tables       List tables in the configured dataset.
 *   - bq_describe_table    Show columns + types + row count for a table.
 *   - bq_query             Run a SELECT query (read-only) and return rows.
 *
 * Auth: BQ_PROJECT and BQ_DATASET come from env. The bq CLI uses
 * GOOGLE_APPLICATION_CREDENTIALS automatically. The user never types or sees
 * either of these.
 *
 * Wire protocol: stdio JSON-RPC per MCP spec. Speaks line-delimited JSON-RPC
 * 2.0 over stdin/stdout.
 */

const { spawn } = require('child_process')
const readline = require('readline')

const PROJECT = process.env.BQ_PROJECT || 'hackproduct'
const DATASET = process.env.BQ_DATASET || 'case_001_checkout_funnel'

// ---------------------------------------------------------------------------
// JSON-RPC plumbing
// ---------------------------------------------------------------------------

const rl = readline.createInterface({ input: process.stdin, terminal: false })

function send(message) {
  process.stdout.write(JSON.stringify(message) + '\n')
}

function reply(id, result) {
  send({ jsonrpc: '2.0', id, result })
}

function replyError(id, code, message, data) {
  send({ jsonrpc: '2.0', id, error: { code, message, ...(data ? { data } : {}) } })
}

// ---------------------------------------------------------------------------
// bq CLI helpers
// ---------------------------------------------------------------------------

function bqExec(args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn('bq', args, { env: process.env, ...options })
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (chunk) => { stdout += chunk.toString() })
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString() })
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout)
      else reject(new Error(`bq exited ${code}: ${stderr || stdout}`))
    })
    proc.on('error', reject)
  })
}

async function listTables() {
  const out = await bqExec([
    '--project_id', PROJECT,
    '--format', 'json',
    'ls', `${PROJECT}:${DATASET}`,
  ])
  return JSON.parse(out)
}

async function describeTable(tableName) {
  const out = await bqExec([
    '--project_id', PROJECT,
    '--format', 'json',
    'show', `${PROJECT}:${DATASET}.${tableName}`,
  ])
  return JSON.parse(out)
}

async function runQuery(sql, maxRows = 100) {
  const out = await bqExec([
    '--project_id', PROJECT,
    '--format', 'json',
    'query',
    '--use_legacy_sql=false',
    `--max_rows=${maxRows}`,
    sql,
  ])
  return JSON.parse(out)
}

// ---------------------------------------------------------------------------
// MCP tool surface
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: 'bq_list_tables',
    description: `List all tables in the BigQuery dataset ${PROJECT}.${DATASET}.`,
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'bq_describe_table',
    description: `Show columns, types, and row count for a table in ${PROJECT}.${DATASET}.`,
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name (without project/dataset prefix).' },
      },
      required: ['table'],
    },
  },
  {
    name: 'bq_query',
    description: `Run a read-only BigQuery SQL query against ${PROJECT}.${DATASET}. Returns up to 100 rows by default. Use fully-qualified table names like \`${PROJECT}.${DATASET}.events\`.`,
    inputSchema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'SELECT-only SQL query.' },
        max_rows: { type: 'number', description: 'Row cap (default 100, max 1000).' },
      },
      required: ['sql'],
    },
  },
]

async function callTool(name, args) {
  if (name === 'bq_list_tables') {
    const tables = await listTables()
    return {
      content: [{
        type: 'text',
        text: tables.map((t) => `${t.tableReference.tableId} (${t.type})`).join('\n') || '(no tables)',
      }],
    }
  }

  if (name === 'bq_describe_table') {
    if (!args.table) throw new Error('table is required')
    const meta = await describeTable(args.table)
    const columns = (meta.schema?.fields || []).map(
      (f) => `  ${f.name}: ${f.type}${f.mode === 'REQUIRED' ? ' NOT NULL' : ''}`,
    ).join('\n')
    return {
      content: [{
        type: 'text',
        text: `Table: ${args.table}\nRows: ${meta.numRows ?? 'unknown'}\nColumns:\n${columns}`,
      }],
    }
  }

  if (name === 'bq_query') {
    if (!args.sql) throw new Error('sql is required')
    const lower = args.sql.trim().toLowerCase()
    if (!lower.startsWith('select') && !lower.startsWith('with')) {
      throw new Error('Only SELECT or WITH queries are allowed.')
    }
    const maxRows = Math.min(Math.max(1, Number(args.max_rows) || 100), 1000)
    const rows = await runQuery(args.sql, maxRows)
    return {
      content: [{
        type: 'text',
        text: rows.length ? JSON.stringify(rows, null, 2) : '(no rows)',
      }],
    }
  }

  throw new Error(`Unknown tool: ${name}`)
}

// ---------------------------------------------------------------------------
// JSON-RPC handler
// ---------------------------------------------------------------------------

rl.on('line', async (line) => {
  if (!line.trim()) return
  let msg
  try { msg = JSON.parse(line) } catch { return }
  const { id, method, params } = msg

  try {
    if (method === 'initialize') {
      reply(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'bq-mcp', version: '1.0.0' },
      })
    } else if (method === 'tools/list') {
      reply(id, { tools: TOOLS })
    } else if (method === 'tools/call') {
      const { name, arguments: args = {} } = params || {}
      const result = await callTool(name, args)
      reply(id, result)
    } else if (method === 'ping') {
      reply(id, {})
    } else if (id !== undefined) {
      replyError(id, -32601, `Method not found: ${method}`)
    }
  } catch (err) {
    if (id !== undefined) {
      replyError(id, -32000, err.message || String(err))
    }
  }
})

// Don't write logs to stdout (it's the MCP transport)
process.stderr.write(`[bq-mcp] started for ${PROJECT}.${DATASET}\n`)
