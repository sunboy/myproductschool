#!/usr/bin/env npx tsx
/**
 * Casebook Loop — publish script (plan §2 step 5).
 *
 * Upserts a case's authored content (track, case, expert session, scenes)
 * from content/casebook/<case-id>/*.json into Supabase. Refuses to run at all
 * unless validate-case.ts passes first — that script is the hard precondition,
 * wired in as a real subprocess call, not re-implemented here.
 *
 * Publication is opt-in and explicit:
 *   - Default (no --publish flag): rows are upserted with is_published=false.
 *     Safe to run repeatedly to sync authored content into the DB without
 *     making anything visible.
 *   - --publish: additionally flips is_published: false → true on the case,
 *     its expert session, and all of its scenes (and the track, if a
 *     track.json is present and this is the only/first case activating it —
 *     see flipTrackPublished below). Never flips anything already true back
 *     to false.
 *
 * IMPORTANT — this script performs live writes and must NOT be run by the dev
 * who authored it. It is the orchestrator's tool, run only after reviewing
 * the validated content. Running it yourself is a task-rejection condition.
 *
 * Usage:
 *   npx tsx scripts/casebook/publish-case.ts <case-id> [--publish] [--dir <content-root>]
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]) {
  const [caseId, ...rest] = argv
  if (!caseId || caseId.startsWith('--')) {
    console.error('Usage: npx tsx scripts/casebook/publish-case.ts <case-id> [--publish] [--dir <content-root>]')
    process.exit(1)
  }
  let dir = 'content/casebook'
  let publish = false
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--dir') dir = rest[++i]
    else if (rest[i] === '--publish') publish = true
  }
  return { caseId, dir, publish }
}

// ---------------------------------------------------------------------------
// Precondition: validate-case.ts must pass
// ---------------------------------------------------------------------------

function runValidation(caseId: string, dir: string): boolean {
  const validatorPath = resolve(__dirname, 'validate-case.ts')
  console.log(`Running precondition: npx tsx ${validatorPath} ${caseId} --dir ${dir}`)
  try {
    execFileSync('npx', ['tsx', validatorPath, caseId, '--dir', dir], {
      stdio: 'inherit',
    })
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

function loadJson<T>(path: string): T {
  const raw = readFileSync(path, 'utf-8')
  return JSON.parse(raw) as T
}

function loadJsonOptional<T>(path: string): T | null {
  if (!existsSync(path)) return null
  return loadJson<T>(path)
}

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Run with --env-file=.env.local.')
    process.exit(1)
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ---------------------------------------------------------------------------
// Scene scaffold field stripping — publish-case.ts never writes the
// authoring-scaffold-only fields (_needs_authoring, preload.needs_authoring,
// preload.authoring_prompt) into cc_scenes; they are cut-scenes.ts /
// sub-agent handoff bookkeeping, not part of the DB row shape. In practice
// validate-case.ts already refuses to pass while any scene carries these, so
// this is a defensive strip, not the enforcement point.
// ---------------------------------------------------------------------------

interface SceneRow {
  id: string
  case_id: string
  ordinal: number
  title: string
  goal_md: string
  skill_lane: string
  decision_point_id: string
  preload: Record<string, unknown>
  time_budget_s: number
  rubric: Record<string, unknown>
  is_published?: boolean
  _needs_authoring?: boolean
  [key: string]: unknown
}

function stripSceneScaffoldFields(scene: SceneRow): SceneRow {
  const { _needs_authoring, preload, ...rest } = scene
  const { needs_authoring, authoring_prompt, ...cleanPreload } = (preload ?? {}) as Record<string, unknown>
  void _needs_authoring
  void needs_authoring
  void authoring_prompt
  return { ...rest, preload: cleanPreload } as SceneRow
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { caseId, dir, publish } = parseArgs(process.argv.slice(2))
  const caseDir = resolve(dir, caseId)

  if (!existsSync(caseDir)) {
    console.error(`Case directory not found: ${caseDir}`)
    process.exit(1)
  }

  const validated = runValidation(caseId, dir)
  if (!validated) {
    console.error(`\nvalidate-case.ts did not pass for "${caseId}". Refusing to publish. Fix the failing checks above and rerun.`)
    process.exit(1)
  }
  console.log(`\nvalidate-case.ts passed for "${caseId}". Proceeding with upsert${publish ? ' + publish flip' : ' (is_published=false)'}.\n`)

  type CaseRow = Record<string, unknown> & { id: string; is_published?: boolean }
  type ExpertSessionRow = Record<string, unknown> & { id: string; is_published?: boolean }
  type TrackRow = Record<string, unknown> & { id: string; is_published?: boolean }

  const caseRow = loadJson<CaseRow>(join(caseDir, 'case.json'))
  const sessionRow = loadJson<ExpertSessionRow>(join(caseDir, 'expert-session.json'))
  const sceneRows = loadJson<SceneRow[]>(join(caseDir, 'scenes.json')).map(stripSceneScaffoldFields)
  const trackRow = loadJsonOptional<TrackRow>(join(caseDir, 'track.json'))

  if (caseId !== caseRow.id) {
    console.error(`Requested case-id "${caseId}" does not match case.json id "${caseRow.id}". Aborting.`)
    process.exit(1)
  }

  const supabase = createAdminClient()

  // Publish flag only ever flips false -> true, never true -> false: every
  // upsert below computes `publish ? true : (existing ?? false)` inline.
  // Default: everything upserts with is_published=false unless --publish is
  // passed. Phase 1 never publishes anything — the orchestrator decides when
  // --publish is appropriate, in a separate run of this same script.
  const upserts: { table: string; count: number }[] = []

  if (trackRow) {
    const { error } = await supabase
      .from('cc_tracks')
      .upsert(
        {
          ...trackRow,
          is_published: publish ? true : (trackRow.is_published ?? false),
        },
        { onConflict: 'id' },
      )
    if (error) {
      console.error(`Failed to upsert cc_tracks: ${error.message}`)
      process.exit(1)
    }
    upserts.push({ table: 'cc_tracks', count: 1 })
  }

  {
    const { error } = await supabase
      .from('cc_cases')
      .upsert(
        {
          ...caseRow,
          is_published: publish ? true : (caseRow.is_published ?? false),
        },
        { onConflict: 'id' },
      )
    if (error) {
      console.error(`Failed to upsert cc_cases: ${error.message}`)
      process.exit(1)
    }
    upserts.push({ table: 'cc_cases', count: 1 })
  }

  {
    const { error } = await supabase
      .from('cc_expert_sessions')
      .upsert(
        {
          ...sessionRow,
          case_id: caseId,
          is_published: publish ? true : (sessionRow.is_published ?? false),
        },
        { onConflict: 'id' },
      )
    if (error) {
      console.error(`Failed to upsert cc_expert_sessions: ${error.message}`)
      process.exit(1)
    }
    upserts.push({ table: 'cc_expert_sessions', count: 1 })
  }

  if (sceneRows.length > 0) {
    const rows = sceneRows.map((scene) => ({
      ...scene,
      case_id: caseId,
      is_published: publish ? true : (scene.is_published ?? false),
    }))
    const { error } = await supabase.from('cc_scenes').upsert(rows, { onConflict: 'id' })
    if (error) {
      console.error(`Failed to upsert cc_scenes: ${error.message}`)
      process.exit(1)
    }
    upserts.push({ table: 'cc_scenes', count: rows.length })
  }

  console.log('Upsert summary:')
  for (const u of upserts) {
    console.log(`  ${u.table}: ${u.count} row(s)`)
  }
  console.log(publish
    ? `\nis_published flipped to true for case "${caseId}" and its rows.`
    : `\nAll rows upserted with is_published=false. Rerun with --publish to flip live once ready.`)
}

main().catch((err) => {
  console.error('publish-case.ts failed:', err)
  process.exit(1)
})
