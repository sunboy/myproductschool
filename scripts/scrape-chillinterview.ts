#!/usr/bin/env npx tsx
/**
 * Scrape chillinterview.com via its public JSON APIs.
 *
 * Source is a client-rendered Next.js app; the page calls these endpoints:
 *   - GET /api/learn/coding-interview-questions/{slug}
 *   - GET /api/experiences/{uuid}
 *   - GET /api/learn/system-design/{slug}
 * Slug/UUID lists come from the sitemaps under /sitemaps/*.xml.
 *
 * Gating: most content is premium. Free rows return full bodies; gated rows
 * return preview/metadata only. We capture both (gated rows flagged) and never
 * drop a row. Content is treated as raw material for transformation, not copied
 * verbatim downstream.
 *
 * Politeness: low concurrency, jittered delay, custom UA, backoff on 429/5xx.
 * Resumable via a per-type cursor file.
 *
 * Usage:
 *   npx tsx scripts/scrape-chillinterview.ts --type coding --dry-run
 *   npx tsx scripts/scrape-chillinterview.ts --type coding --limit 30
 *   npx tsx scripts/scrape-chillinterview.ts --type coding --shard 0/3
 *   npx tsx scripts/scrape-chillinterview.ts --type experiences
 *   npx tsx scripts/scrape-chillinterview.ts --type system-design
 */

import * as fs from 'fs'
import * as path from 'path'
import pLimit from 'p-limit'

// ── Config ────────────────────────────────────────────────────────────────────

const BASE = 'https://www.chillinterview.com'
const SITEMAP_BASE = 'https://chillinterview.com/sitemaps'
const UA = 'HackProduct-research/1.0 (interview-prep content study)'
const MAX_RETRIES = 4
const OUT_DIR = path.join(process.cwd(), 'seeds', 'chillinterview')

type ContentType = 'coding' | 'experiences' | 'system-design'

// The experiences endpoint rate-limits aggressively; pace it gentler.
const PACE: Record<ContentType, { concurrency: number; minDelay: number; maxDelay: number }> = {
  coding: { concurrency: 3, minDelay: 250, maxDelay: 550 },
  'system-design': { concurrency: 3, minDelay: 250, maxDelay: 550 },
  experiences: { concurrency: 1, minDelay: 1100, maxDelay: 1900 },
}

const TYPE_CONFIG: Record<
  ContentType,
  { sitemap: string; idPattern: RegExp; api: (id: string) => string; outFile: string }
> = {
  coding: {
    sitemap: 'coding-questions.xml',
    idPattern: /coding-interview-questions\/([a-z0-9-]+)</g,
    api: (slug) => `${BASE}/api/learn/coding-interview-questions/${slug}`,
    outFile: 'coding.json',
  },
  experiences: {
    sitemap: 'experiences.xml',
    idPattern: /experiences\/([a-f0-9-]{36})</g,
    api: (id) => `${BASE}/api/experiences/${id}`,
    outFile: 'experiences.json',
  },
  'system-design': {
    sitemap: 'learn-system-design.xml',
    idPattern: /system-design\/([a-z0-9-]+)</g,
    api: (slug) => `${BASE}/api/learn/system-design/${slug}`,
    outFile: 'system-design.json',
  },
}

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
function flag(name: string): string | undefined {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const TYPE = (flag('--type') ?? 'coding') as ContentType
const LIMIT = flag('--limit') ? parseInt(flag('--limit')!, 10) : undefined
const SHARD = flag('--shard') // "i/n"
const FREE_ONLY = args.includes('--free-only') // coding: fetch only free questions from listing
const RESUME = args.includes('--resume') // skip ids already present in the output file

if (!TYPE_CONFIG[TYPE]) {
  console.error(`Unknown --type ${TYPE}. Use: coding | experiences | system-design`)
  process.exit(1)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const pace = PACE[TYPE]
const jitter = () => pace.minDelay + Math.floor(Math.random() * (pace.maxDelay - pace.minDelay))

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/xml,*/*' } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.text()
}

/** Fetch JSON with exponential backoff on 429/5xx. Returns null on hard failure. */
async function fetchJsonRetry(url: string): Promise<unknown | null> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
      })
      if (res.status === 429 || res.status >= 500) {
        const wait = Math.min(8000, 500 * 2 ** attempt) + jitter()
        console.warn(`  ${res.status} on ${url} — backoff ${wait}ms (attempt ${attempt})`)
        await sleep(wait)
        continue
      }
      if (!res.ok) return null
      return await res.json()
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        console.warn(`  fetch failed ${url}: ${(err as Error).message}`)
        return null
      }
      await sleep(500 * 2 ** attempt)
    }
  }
  return null
}

async function loadIds(type: ContentType): Promise<string[]> {
  const cfg = TYPE_CONFIG[type]
  const xml = await fetchText(`${SITEMAP_BASE}/${cfg.sitemap}`)
  const ids = new Set<string>()
  let m: RegExpExecArray | null
  cfg.idPattern.lastIndex = 0
  while ((m = cfg.idPattern.exec(xml)) !== null) {
    if (m[1] && !m[1].startsWith('company')) ids.add(m[1])
  }
  return [...ids]
}

/**
 * Enumerate coding questions via the catalog listing endpoint, which carries an
 * authoritative `isFree` flag per question. With --free-only we fetch detail
 * only for free slugs (avoids wasting requests on gated rows). Returns the slug
 * list to fetch, plus the full catalog for company/freeness reference.
 */
async function loadCodingIdsFromListing(freeOnly: boolean): Promise<string[]> {
  const seen = new Map<string, { slug: string; isFree: boolean }>()
  let page = 1
  let totalPages = 1
  do {
    const url = `${BASE}/api/learn/coding-interview-questions?page=${page}&limit=100`
    const json = (await fetchJsonRetry(url)) as any
    if (!json) break
    for (const q of json.questions ?? []) {
      if (q.slug) seen.set(q.slug, { slug: q.slug, isFree: Boolean(q.isFree) })
    }
    totalPages = json.pagination?.totalPages ?? page
    page++
    await sleep(jitter())
  } while (page <= totalPages)
  const all = [...seen.values()]
  const chosen = freeOnly ? all.filter((q) => q.isFree) : all
  console.log(`  listing: ${all.length} questions, ${all.filter((q) => q.isFree).length} free → fetching ${chosen.length}`)
  return chosen.map((q) => q.slug)
}

function applyShard(ids: string[]): string[] {
  if (!SHARD) return ids
  const [iStr, nStr] = SHARD.split('/')
  const i = parseInt(iStr, 10)
  const n = parseInt(nStr, 10)
  if (Number.isNaN(i) || Number.isNaN(n) || n <= 0) return ids
  return ids.filter((_, idx) => idx % n === i)
}

// ── Parse embedded "### Test Cases" Input/Output blocks from coding markdown ────

export interface ParsedTestCase {
  input_raw: string
  output_raw: string
}

export function parseTestCaseBlocks(markdown: string): ParsedTestCase[] {
  const out: ParsedTestCase[] = []
  // Find fenced code blocks that contain an Input:/Output: pair.
  const fence = /```[a-z]*\n([\s\S]*?)```/g
  let m: RegExpExecArray | null
  while ((m = fence.exec(markdown)) !== null) {
    const body = m[1]
    const im = body.match(/Input:\s*([\s\S]*?)\n\s*Output:/i)
    const om = body.match(/Output:\s*([\s\S]*?)\s*$/i)
    if (im && om) {
      out.push({ input_raw: im[1].trim(), output_raw: om[1].trim() })
    }
  }
  return out
}

// ── Per-type extraction (gating-aware) ─────────────────────────────────────────

interface ScrapedRow {
  type: ContentType
  id: string
  source_url: string
  gated: boolean
  scraped_at: string
  data: Record<string, unknown>
}

function extractCoding(id: string, json: any): ScrapedRow {
  const q = json?.question
  const hasFull = Boolean(json?.hasAccess && q && q.description)
  return {
    type: 'coding',
    id,
    source_url: `${BASE}/learn/coding-interview-questions/${id}`,
    gated: !hasFull,
    scraped_at: new Date().toISOString(),
    data: hasFull
      ? {
          title: q.title,
          slug: q.slug,
          description: q.description,
          difficulty: q.difficulty ?? q.difficultyBucket,
          tags: q.tags ?? [],
          starterCode: q.starterCode ?? null,
          companies: (q.companies ?? []).map((c: any) => ({ name: c.name, slug: c.slug })),
          isFree: q.isFree ?? false,
          parsed_test_cases: parseTestCaseBlocks(q.description ?? ''),
        }
      : { isPremiumUser: json?.isPremiumUser ?? false, hasAccess: json?.hasAccess ?? false },
  }
}

function extractExperience(id: string, json: any): ScrapedRow {
  const p = json?.preview ?? {}
  return {
    type: 'experiences',
    id,
    source_url: `${BASE}/experiences/${id}`,
    gated: !json?.hasAccess,
    scraped_at: new Date().toISOString(),
    data: {
      company: p.company ? { name: p.company.name, slug: p.company.slug } : null,
      role: p.role ?? null,
      level: p.levelNormalized ?? null,
      roundType: p.roundType ?? null,
      questionType: p.questionType ?? null,
      topics: p.topics ?? [],
      difficulty: p.difficulty ?? null,
      durationMinutes: p.durationMinutes ?? null,
      passedRound: p.passedRound ?? null,
      gotOffer: p.gotOffer ?? null,
      interviewerRating: p.interviewerRating ?? null,
      interviewDate: p.interviewDate ?? null,
      visible: p.visible ?? null,
      detailsVisible: p.detailsVisible ?? null,
    },
  }
}

function extractSystemDesign(id: string, json: any): ScrapedRow {
  const a = json?.article ?? {}
  return {
    type: 'system-design',
    id,
    source_url: `${BASE}/learn/system-design/${id}`,
    gated: !json?.hasAccess,
    scraped_at: new Date().toISOString(),
    data: {
      title: a.title ?? null,
      topic: a.topic ?? null,
      topics: a.topics ?? [],
      askedByCompanies: (a.askedByCompanies ?? []).map((c: any) =>
        typeof c === 'string' ? c : c?.name ?? c?.slug
      ),
      level: a.level ?? null,
      difficulty: a.difficulty ?? null,
      whyThisMatters: a.whyThisMatters ?? null,
      previewMarkdown: a.previewMarkdown ?? null,
      isFree: a.isFree ?? false,
    },
  }
}

const EXTRACTORS: Record<ContentType, (id: string, json: any) => ScrapedRow> = {
  coding: extractCoding,
  experiences: extractExperience,
  'system-design': extractSystemDesign,
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const cfg = TYPE_CONFIG[TYPE]
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })
  const outPath = path.join(
    OUT_DIR,
    SHARD ? cfg.outFile.replace('.json', `.shard-${SHARD.split('/')[0]}.json`) : cfg.outFile
  )

  // Discover ids. Coding prefers the catalog listing (carries the authoritative
  // isFree flag); other types use the sitemap.
  let ids: string[]
  if (TYPE === 'coding') {
    console.log(`Loading coding ids from catalog listing${FREE_ONLY ? ' (free only)' : ''}…`)
    ids = await loadCodingIdsFromListing(FREE_ONLY)
  } else {
    console.log(`Loading ${TYPE} ids from sitemap…`)
    ids = await loadIds(TYPE)
    console.log(`  ${ids.length} ids in sitemap`)
  }
  ids = applyShard(ids)
  if (SHARD) console.log(`  shard ${SHARD} → ${ids.length} ids`)
  if (LIMIT) ids = ids.slice(0, LIMIT)

  // Resume / merge: keep already-scraped non-gated rows, only fetch missing ones.
  const existing: ScrapedRow[] = fs.existsSync(outPath)
    ? JSON.parse(fs.readFileSync(outPath, 'utf-8'))
    : []
  const haveGood = new Set(existing.filter((r) => !r.gated).map((r) => r.id))
  if (RESUME || existing.length) {
    const before = ids.length
    ids = ids.filter((id) => !haveGood.has(id))
    console.log(`  resume: ${haveGood.size} already captured, ${before - ids.length} skipped, ${ids.length} to fetch`)
  }

  if (DRY_RUN) {
    console.log(`DRY RUN — would fetch ${ids.length} ${TYPE} rows. Sample:`)
    console.log('  ' + ids.slice(0, 5).join('\n  '))
    return
  }

  const limit = pLimit(pace.concurrency)
  const fresh: ScrapedRow[] = []
  let done = 0
  let gatedCount = 0

  // Merge fresh into existing (fresh non-gated wins) and write — used for both
  // periodic checkpoints and the final flush, so a long run is crash-safe.
  const flush = () => {
    const merged = new Map<string, ScrapedRow>()
    for (const r of existing) merged.set(r.id, r)
    for (const r of fresh) {
      const prev = merged.get(r.id)
      if (!prev || (prev.gated && !r.gated)) merged.set(r.id, r)
    }
    const out = [...merged.values()]
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
    return out
  }

  await Promise.all(
    ids.map((id) =>
      limit(async () => {
        await sleep(jitter())
        const json = await fetchJsonRetry(cfg.api(id))
        done++
        if (json === null) {
          console.warn(`  [${done}/${ids.length}] FAILED ${id}`)
          return
        }
        const row = EXTRACTORS[TYPE](id, json)
        if (row.gated) gatedCount++
        fresh.push(row)
        if (done % 25 === 0) {
          flush()
          console.log(`  …${done}/${ids.length} (${gatedCount} gated, checkpointed)`)
        }
      })
    )
  )

  const out = flush()
  const full = out.filter((r) => !r.gated).length
  console.log(
    `\nWrote ${out.length} rows → ${path.relative(process.cwd(), outPath)} (${full} full, ${out.length - full} gated)`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
