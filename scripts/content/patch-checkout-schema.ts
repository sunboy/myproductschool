/**
 * Repair the checkout analytics challenge's schema guidance without reseeding it.
 *
 * Dry run (default): npx tsx scripts/content/patch-checkout-schema.ts
 * Apply:             npx tsx scripts/content/patch-checkout-schema.ts --apply
 */
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const TARGET_ID = 'cc_001_checkout_funnel'
const EXPECTED_BQ_PROJECT = 'hackproduct'
const EXPECTED_BQ_DATASET = 'case_001_checkout_funnel'
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(SCRIPT_DIR, '../..')
const SEED_PATH = resolve(SCRIPT_DIR, 'seed-analytics-challenges.ts')

type JsonObject = Record<string, unknown>

interface CheckoutSource {
  id: string
  bqProject: string
  bqDataset: string
  claudeMd: string
  exploreSchema: {
    objective: string
    successCriterion: string
    suggestedPrompts: string[]
  }
}

interface ChangedField {
  path: string
  before: unknown
  after: unknown
}

function fail(message: string): never {
  throw new Error(message)
}

function propertyName(node: ts.PropertyName): string {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text
  }
  return fail('Seed contains an unsupported computed property name')
}

function property(object: ts.ObjectLiteralExpression, name: string): ts.Expression {
  const matches = object.properties.filter(
    (candidate): candidate is ts.PropertyAssignment =>
      ts.isPropertyAssignment(candidate) && propertyName(candidate.name) === name,
  )
  if (matches.length !== 1) {
    return fail(`Expected exactly one ${name} property in the checkout seed`)
  }
  return matches[0].initializer
}

function staticValue(node: ts.Expression): unknown {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  if (ts.isNumericLiteral(node)) return Number(node.text)
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false
  if (node.kind === ts.SyntaxKind.NullKeyword) return null
  if (ts.isParenthesizedExpression(node)) return staticValue(node.expression)
  if (ts.isArrayLiteralExpression(node)) return node.elements.map((element) => staticValue(element as ts.Expression))
  if (ts.isObjectLiteralExpression(node)) {
    const result: JsonObject = {}
    for (const member of node.properties) {
      if (!ts.isPropertyAssignment(member)) fail('Seed object contains an unsupported member')
      result[propertyName(member.name)] = staticValue(member.initializer)
    }
    return result
  }
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === 'join' &&
    node.arguments.length === 1
  ) {
    const values = staticValue(node.expression.expression)
    const separator = staticValue(node.arguments[0])
    if (!Array.isArray(values) || !values.every((value) => typeof value === 'string') || typeof separator !== 'string') {
      fail('Only a string array joined with a string separator is allowed in the checkout seed')
    }
    return values.join(separator)
  }
  return fail(`Unsupported expression in checkout seed: ${ts.SyntaxKind[node.kind]}`)
}

function requireString(value: unknown, description: string): string {
  return typeof value === 'string' ? value : fail(`${description} must be a string`)
}

function requireStringArray(value: unknown, description: string): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value
    : fail(`${description} must be an array of strings`)
}

function requireObject(value: unknown, description: string): JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : fail(`${description} must be an object`)
}

function readCheckoutSource(): CheckoutSource {
  const text = readFileSync(SEED_PATH, 'utf8')
  const sourceFile = ts.createSourceFile(SEED_PATH, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const parseErrors = (sourceFile as ts.SourceFile & { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? []
  if (parseErrors.length > 0) fail('Analytics challenge seed does not parse as TypeScript')

  const declarations: ts.VariableDeclaration[] = []
  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return
    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === 'CHALLENGES') declarations.push(declaration)
    }
  })
  if (declarations.length !== 1) fail('Expected exactly one CHALLENGES declaration in analytics seed')

  const initializer = declarations[0].initializer
  if (!initializer || !ts.isArrayLiteralExpression(initializer) || initializer.elements.length === 0) {
    fail('CHALLENGES must be a non-empty array literal')
  }
  const first = initializer.elements[0]
  if (!ts.isObjectLiteralExpression(first)) fail('First analytics challenge must be an object literal')
  const id = requireString(staticValue(property(first, 'id')), 'Source challenge id')
  if (id !== TARGET_ID) fail(`First analytics challenge must remain ${TARGET_ID}`)

  const subProblemsNode = property(first, 'subProblems')
  if (!ts.isArrayLiteralExpression(subProblemsNode)) fail('Source subProblems must be an array literal')
  const exploreMatches = subProblemsNode.elements.filter((element) => {
    if (!ts.isObjectLiteralExpression(element)) return false
    return staticValue(property(element, 'id')) === 'explore_schema'
  })
  if (exploreMatches.length !== 1 || !ts.isObjectLiteralExpression(exploreMatches[0])) {
    fail('Source must contain exactly one explore_schema sub-problem')
  }
  const explore = exploreMatches[0]

  const result: CheckoutSource = {
    id,
    bqProject: requireString(staticValue(property(first, 'bqProject')), 'Source bqProject'),
    bqDataset: requireString(staticValue(property(first, 'bqDataset')), 'Source bqDataset'),
    claudeMd: requireString(staticValue(property(first, 'claudeMd')), 'Source claudeMd'),
    exploreSchema: {
      objective: requireString(staticValue(property(explore, 'objective')), 'Source explore_schema objective'),
      successCriterion: requireString(
        staticValue(property(explore, 'successCriterion')),
        'Source explore_schema successCriterion',
      ),
      suggestedPrompts: requireStringArray(
        staticValue(property(explore, 'suggestedPrompts')),
        'Source explore_schema suggestedPrompts',
      ),
    },
  }

  if (result.bqProject !== EXPECTED_BQ_PROJECT || result.bqDataset !== EXPECTED_BQ_DATASET) {
    fail(`Source BigQuery coordinates must remain ${EXPECTED_BQ_PROJECT}.${EXPECTED_BQ_DATASET}`)
  }
  return result
}

function loadEnv(): Record<string, string> {
  const values: Record<string, string> = {}
  const envPath = resolve(PROJECT_ROOT, '.env.local')
  if (existsSync(envPath)) {
    for (const rawLine of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const separator = line.indexOf('=')
      if (separator < 1) continue
      const name = line.slice(0, separator).trim()
      let value = line.slice(separator + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      values[name] = value
    }
  }
  for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
    if (process.env[name]) values[name] = process.env[name] as string
  }
  return values
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function printChanges(changes: ChangedField[]): void {
  if (changes.length === 0) {
    console.log('No targeted fields differ; nothing to patch.')
    return
  }
  for (const change of changes) {
    console.log(`\n${change.path}`)
    console.log('BEFORE:')
    console.log(typeof change.before === 'string' ? change.before : JSON.stringify(change.before, null, 2))
    console.log('AFTER:')
    console.log(typeof change.after === 'string' ? change.after : JSON.stringify(change.after, null, 2))
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  if (args.some((arg) => arg !== '--apply') || args.filter((arg) => arg === '--apply').length > 1) {
    fail('Only the optional --apply argument is supported')
  }
  const apply = args.includes('--apply')
  const source = readCheckoutSource()
  const env = loadEnv()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) fail('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: row, error: readError } = await supabase
    .from('challenges')
    .select('id, metadata')
    .eq('id', TARGET_ID)
    .maybeSingle()
  if (readError) fail(`Could not read target challenge (${readError.code || 'database error'}): ${readError.message}`)
  if (!row) fail(`Target challenge ${TARGET_ID} was not found`)
  if (row.id !== TARGET_ID) fail('Database returned an unexpected challenge id')

  const currentMetadata = requireObject(row.metadata, 'Current metadata')
  const currentClaudeCode = requireObject(currentMetadata.claude_code, 'Current metadata.claude_code')
  if (
    currentClaudeCode.BQ_PROJECT !== EXPECTED_BQ_PROJECT ||
    currentClaudeCode.BQ_DATASET !== EXPECTED_BQ_DATASET
  ) {
    fail(`Current BigQuery coordinates must be ${EXPECTED_BQ_PROJECT}.${EXPECTED_BQ_DATASET}`)
  }
  requireString(currentClaudeCode.claude_md, 'Current metadata.claude_code.claude_md')
  if (!Array.isArray(currentClaudeCode.sub_problems)) {
    fail('Current metadata.claude_code.sub_problems must be an array')
  }
  const currentExploreMatches = currentClaudeCode.sub_problems.filter(
    (candidate) => requireObject(candidate, 'Current sub-problem').id === 'explore_schema',
  )
  if (currentExploreMatches.length !== 1) fail('Current metadata must contain exactly one explore_schema sub-problem')
  const currentExplore = requireObject(currentExploreMatches[0], 'Current explore_schema sub-problem')
  requireString(currentExplore.objective, 'Current explore_schema objective')
  requireString(currentExplore.successCriterion, 'Current explore_schema successCriterion')
  requireStringArray(currentExplore.suggestedPrompts, 'Current explore_schema suggestedPrompts')

  const changes: ChangedField[] = []
  const replacements: Array<[string, JsonObject, string, unknown]> = [
    ['metadata.claude_code.claude_md', currentClaudeCode, 'claude_md', source.claudeMd],
    ['metadata.claude_code.sub_problems[explore_schema].objective', currentExplore, 'objective', source.exploreSchema.objective],
    [
      'metadata.claude_code.sub_problems[explore_schema].successCriterion',
      currentExplore,
      'successCriterion',
      source.exploreSchema.successCriterion,
    ],
    [
      'metadata.claude_code.sub_problems[explore_schema].suggestedPrompts',
      currentExplore,
      'suggestedPrompts',
      source.exploreSchema.suggestedPrompts,
    ],
  ]
  for (const [path, container, key, after] of replacements) {
    if (!sameJson(container[key], after)) changes.push({ path, before: container[key], after })
  }
  printChanges(changes)
  if (changes.length === 0) return
  if (!apply) {
    console.log('\nDry run only. Re-run with --apply to write these targeted changes.')
    return
  }

  const nextMetadata = structuredClone(currentMetadata)
  const nextClaudeCode = requireObject(nextMetadata.claude_code, 'Copied metadata.claude_code')
  const nextSubProblems = nextClaudeCode.sub_problems as unknown[]
  const nextExplore = requireObject(
    nextSubProblems.find((candidate) => requireObject(candidate, 'Copied sub-problem').id === 'explore_schema'),
    'Copied explore_schema sub-problem',
  )
  nextClaudeCode.claude_md = source.claudeMd
  nextExplore.objective = source.exploreSchema.objective
  nextExplore.successCriterion = source.exploreSchema.successCriterion
  nextExplore.suggestedPrompts = source.exploreSchema.suggestedPrompts

  const { data: updatedRows, error: updateError } = await supabase
    .from('challenges')
    .update({ metadata: nextMetadata })
    .eq('id', TARGET_ID)
    .filter('metadata', 'eq', JSON.stringify(currentMetadata))
    .select('id, metadata')
  if (updateError) fail(`Patch failed (${updateError.code || 'database error'}): ${updateError.message}`)
  if (!updatedRows || updatedRows.length !== 1) {
    fail('Patch changed no rows; metadata was modified concurrently. Re-run the dry run and review again')
  }
  if (updatedRows[0].id !== TARGET_ID || !sameJson(updatedRows[0].metadata, nextMetadata)) {
    fail('Patch response did not exactly match the intended metadata')
  }
  console.log('\nApplied 1 challenge metadata patch.')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? `ERROR: ${error.message}` : 'ERROR: Unexpected failure')
  process.exitCode = 1
})
