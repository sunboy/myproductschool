/**
 * Shared mapping helpers for the chillinterview import pipeline.
 *
 * Turns source-site labels (company names, problem tags) into HackProduct's
 * canonical taxonomy slugs from src/lib/data/taxonomy.ts. Anything that cannot
 * be mapped is returned as a kebab slug and surfaced to the caller for review,
 * never silently dropped.
 */

import { COMPANIES, TOPICS, TECHNIQUES } from '../../src/lib/data/taxonomy'

export function kebab(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ── Company resolution ────────────────────────────────────────────────────────

// name/alias (lowercased) → canonical slug
const COMPANY_LOOKUP: Map<string, string> = (() => {
  const m = new Map<string, string>()
  for (const c of COMPANIES) {
    m.set(c.slug, c.slug)
    m.set(c.label.toLowerCase(), c.slug)
    for (const a of c.aliases) m.set(a.toLowerCase(), c.slug)
  }
  return m
})()

export interface CompanyResolution {
  slug: string
  /** true when the slug is in the canonical COMPANIES list */
  known: boolean
}

/**
 * Resolve a source company name (e.g. "Google", "squarepoint-capital") to a
 * canonical company slug. Unknown companies return a kebab slug flagged
 * `known:false` so the caller can backfill company_profiles later.
 */
export function resolveCompany(name: string): CompanyResolution {
  const raw = name.trim()
  if (!raw) return { slug: '', known: false }
  const direct = COMPANY_LOOKUP.get(raw.toLowerCase())
  if (direct) return { slug: direct, known: true }
  const slug = kebab(raw)
  const bySlug = COMPANY_LOOKUP.get(slug)
  if (bySlug) return { slug: bySlug, known: true }
  return { slug, known: false }
}

export function resolveCompanies(names: string[]): CompanyResolution[] {
  const seen = new Set<string>()
  const out: CompanyResolution[] = []
  for (const n of names) {
    const r = resolveCompany(n)
    if (!r.slug || seen.has(r.slug)) continue
    seen.add(r.slug)
    out.push(r)
  }
  return out
}

// ── Tag → taxonomy slug resolution ────────────────────────────────────────────

const CODING_TOPIC_SLUGS = new Set(TOPICS.coding.map((t) => t.slug))
const CODING_TECH_SLUGS = new Set(TECHNIQUES.coding.map((t) => t.slug))

/**
 * Maps a source problem tag (e.g. "BFS", "Two Pointers", "Trees & Graphs") to a
 * canonical { topic?, technique? }. Source tags are free-form on chillinterview,
 * so this is a best-effort lexical map; unmatched tags resolve to {} and are
 * left for the metadata-based backfill (scripts/backfill-tags-from-metadata.ts).
 */
export function resolveCodingTag(tag: string): { topic?: string; technique?: string } {
  const k = kebab(tag)
  // Direct hits against canonical slugs first.
  const out: { topic?: string; technique?: string } = {}
  if (CODING_TECH_SLUGS.has(k)) out.technique = k
  if (CODING_TOPIC_SLUGS.has(k)) out.topic = k
  if (out.topic || out.technique) return out

  // Lexical aliases for common source labels not matching a slug verbatim.
  const ALIAS: Record<string, { topic?: string; technique?: string }> = {
    'breadth-first-search': { technique: 'bfs' },
    'depth-first-search': { technique: 'dfs' },
    'binary-search-tree': { topic: 'trees' },
    'trees-and-graphs': { topic: 'graphs' },
    'hash-map': { topic: 'hash-tables' },
    'hash-table': { topic: 'hash-tables' },
    hashmap: { topic: 'hash-tables' },
    'priority-queue': { topic: 'heap' },
    heaps: { topic: 'heap' },
    backtracking: { topic: 'dynamic-programming' },
    recursion: { topic: 'dynamic-programming' },
    dp: { topic: 'dynamic-programming' },
    'linked-list': { topic: 'linked-lists' },
    'sliding-window': { technique: 'sliding-window' },
    'union-find': { technique: 'union-find' },
    'topological-sort': { technique: 'topological-sort' },
    'monotonic-stack': { technique: 'monotonic-stack' },
    matrix: { topic: 'arrays' },
    array: { topic: 'arrays' },
    string: { topic: 'strings' },
    graph: { topic: 'graphs' },
    tree: { topic: 'trees' },
    stack: { topic: 'stack-queue' },
    queue: { topic: 'stack-queue' },
  }
  return ALIAS[k] ?? {}
}

/**
 * Collapse a list of source tags into deduped topic_tags + technique_tags.
 */
export function resolveCodingTags(tags: string[]): {
  topic_tags: string[]
  technique_tags: string[]
} {
  const topics = new Set<string>()
  const techniques = new Set<string>()
  for (const t of tags) {
    const r = resolveCodingTag(t)
    if (r.topic) topics.add(r.topic)
    if (r.technique) techniques.add(r.technique)
  }
  return { topic_tags: [...topics], technique_tags: [...techniques] }
}
