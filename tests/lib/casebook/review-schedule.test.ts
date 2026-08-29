import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  REVIEW_INTERVAL_DAYS,
  RETIRE_AT_CLEAN_COUNT,
  dueAtForInterval,
  applyCleanRep,
  initialReviewQueueState,
} from '@/lib/casebook/review-schedule'
import { missesFromDiff, seedReviewQueueFromMisses } from '@/lib/casebook/review-queue'

const DAY_MS = 24 * 60 * 60 * 1000
const FIXED_NOW = new Date('2026-08-28T00:00:00.000Z')

describe('review-schedule interval ladder', () => {
  it('interval_idx 0 due at now + 2 days', () => {
    const due = dueAtForInterval(0, FIXED_NOW)
    assert.equal(due.getTime(), FIXED_NOW.getTime() + 2 * DAY_MS)
  })

  it('interval_idx 1 due at now + 5 days', () => {
    const due = dueAtForInterval(1, FIXED_NOW)
    assert.equal(due.getTime(), FIXED_NOW.getTime() + 5 * DAY_MS)
  })

  it('interval_idx 2 due at now + 12 days', () => {
    const due = dueAtForInterval(2, FIXED_NOW)
    assert.equal(due.getTime(), FIXED_NOW.getTime() + 12 * DAY_MS)
  })

  it('matches the documented ladder constant', () => {
    assert.deepEqual(REVIEW_INTERVAL_DAYS, [2, 5, 12])
  })

  it('clamps an out-of-range interval_idx to the top rung rather than throwing', () => {
    const due = dueAtForInterval(99, FIXED_NOW)
    assert.equal(due.getTime(), FIXED_NOW.getTime() + 12 * DAY_MS)
  })

  it('clamps a negative interval_idx to the bottom rung', () => {
    const due = dueAtForInterval(-1, FIXED_NOW)
    assert.equal(due.getTime(), FIXED_NOW.getTime() + 2 * DAY_MS)
  })

  it('is deterministic given the same injected now — no wall-clock reads', () => {
    const a = dueAtForInterval(0, FIXED_NOW)
    const b = dueAtForInterval(0, FIXED_NOW)
    assert.equal(a.getTime(), b.getTime())
  })
})

describe('initialReviewQueueState', () => {
  it('starts a fresh item at interval_idx 0, clean_count 0, due in +2d', () => {
    const state = initialReviewQueueState(FIXED_NOW)
    assert.equal(state.intervalIdx, 0)
    assert.equal(state.cleanCount, 0)
    assert.equal(state.dueAt.getTime(), FIXED_NOW.getTime() + 2 * DAY_MS)
  })
})

describe('applyCleanRep — advancing the ladder', () => {
  it('first clean rep (clean_count 0->1) advances interval_idx 0->1, due +5d', () => {
    const result = applyCleanRep({ intervalIdx: 0, cleanCount: 0 }, FIXED_NOW)
    assert.equal(result.intervalIdx, 1)
    assert.equal(result.cleanCount, 1)
    assert.equal(result.retired, false)
    assert.ok(result.dueAt)
    assert.equal(result.dueAt!.getTime(), FIXED_NOW.getTime() + 5 * DAY_MS)
  })

  it('second clean rep (clean_count 1->2) retires the item at RETIRE_AT_CLEAN_COUNT', () => {
    const result = applyCleanRep({ intervalIdx: 1, cleanCount: 1 }, FIXED_NOW)
    assert.equal(result.cleanCount, RETIRE_AT_CLEAN_COUNT)
    assert.equal(result.retired, true)
    assert.equal(result.dueAt, null)
  })

  it('retire-at-2 rule matches the exported constant', () => {
    assert.equal(RETIRE_AT_CLEAN_COUNT, 2)
  })

  it('never advances interval_idx past the top rung even if called from idx 2', () => {
    // Defensive: clean_count 0 at idx 2 is not a real reachable state (idx 2
    // only exists after 2 clean reps, which retires), but the function must
    // not crash or go out of bounds if it ever occurs.
    const result = applyCleanRep({ intervalIdx: 2, cleanCount: 0 }, FIXED_NOW)
    assert.equal(result.intervalIdx, 2)
    assert.equal(result.dueAt!.getTime(), FIXED_NOW.getTime() + 12 * DAY_MS)
  })
})

describe('missesFromDiff', () => {
  it('maps diff.missed entries to concept-typed ReviewMiss descriptors', () => {
    const misses = missesFromDiff({ missed: [{ id: 'move-1' }, { id: 'move-2' }] })
    assert.deepEqual(misses, [
      { itemType: 'concept', itemId: 'move-1' },
      { itemType: 'concept', itemId: 'move-2' },
    ])
  })

  it('returns an empty array for a null/undefined diff', () => {
    assert.deepEqual(missesFromDiff(null), [])
    assert.deepEqual(missesFromDiff(undefined), [])
  })

  it('returns an empty array when diff.missed is absent', () => {
    assert.deepEqual(missesFromDiff({}), [])
  })

  it('filters out entries with a non-string or empty id', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const misses = missesFromDiff({ missed: [{ id: '' }, { id: 123 as any }, { id: 'ok' }] })
    assert.deepEqual(misses, [{ itemType: 'concept', itemId: 'ok' }])
  })
})

// Fake Supabase client that records the exact upsert() call
// seedReviewQueueFromMisses makes, so we can assert the repeat-miss
// contract (ON CONFLICT DO NOTHING via ignoreDuplicates, never an overwrite)
// without a live DB connection.
interface RecordedUpsertCall {
  table: string
  rows: Array<Record<string, unknown>>
  options: { onConflict?: string; ignoreDuplicates?: boolean } | undefined
}

function makeFakeAdmin(recorded: RecordedUpsertCall[], selectResult: Array<{ id: string }> = []) {
  return {
    from(table: string) {
      return {
        upsert(rows: Array<Record<string, unknown>>, options?: RecordedUpsertCall['options']) {
          recorded.push({ table, rows, options })
          return {
            select() {
              return Promise.resolve({ data: selectResult, error: null })
            },
          }
        },
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

describe('seedReviewQueueFromMisses — repeat-miss / UNIQUE constraint contract', () => {
  it('upserts with onConflict on the UNIQUE(user_id,item_type,item_id) key and ignoreDuplicates true (skip, never reset)', async () => {
    const recorded: RecordedUpsertCall[] = []
    const admin = makeFakeAdmin(recorded, [{ id: 'row-1' }])

    const result = await seedReviewQueueFromMisses(
      admin,
      'user-1',
      [{ itemType: 'concept', itemId: 'move-1' }],
      FIXED_NOW,
    )

    assert.equal(result.error, null)
    assert.equal(recorded.length, 1)
    assert.equal(recorded[0].table, 'cc_review_queue')
    assert.equal(recorded[0].options?.onConflict, 'user_id,item_type,item_id')
    // ignoreDuplicates: true is what makes a repeat miss a no-op (ON CONFLICT
    // DO NOTHING) instead of an overwrite that would reset interval_idx/
    // clean_count — this is the core of the upsert-vs-skip decision.
    assert.equal(recorded[0].options?.ignoreDuplicates, true)
  })

  it('seeds every miss with interval_idx 0, clean_count 0, source case_debrief, due_at +2d', async () => {
    const recorded: RecordedUpsertCall[] = []
    const admin = makeFakeAdmin(recorded)

    await seedReviewQueueFromMisses(
      admin,
      'user-1',
      [{ itemType: 'concept', itemId: 'move-1' }],
      FIXED_NOW,
    )

    const row = recorded[0].rows[0]
    assert.equal(row.interval_idx, 0)
    assert.equal(row.clean_count, 0)
    assert.equal(row.source, 'case_debrief')
    assert.equal(row.item_type, 'concept')
    assert.equal(row.item_id, 'move-1')
    assert.equal(row.due_at, new Date(FIXED_NOW.getTime() + 2 * DAY_MS).toISOString())
  })

  it('de-dupes repeated (item_type,item_id) pairs within a single call before upserting', async () => {
    const recorded: RecordedUpsertCall[] = []
    const admin = makeFakeAdmin(recorded)

    await seedReviewQueueFromMisses(
      admin,
      'user-1',
      [
        { itemType: 'concept', itemId: 'move-1' },
        { itemType: 'concept', itemId: 'move-1' },
        { itemType: 'concept', itemId: 'move-2' },
      ],
      FIXED_NOW,
    )

    assert.equal(recorded[0].rows.length, 2)
  })

  it('is a no-op (no upsert call) for an empty misses array', async () => {
    const recorded: RecordedUpsertCall[] = []
    const admin = makeFakeAdmin(recorded)

    const result = await seedReviewQueueFromMisses(admin, 'user-1', [], FIXED_NOW)

    assert.equal(result.seeded, 0)
    assert.equal(recorded.length, 0)
  })
})
