import { describe, expect, it, vi } from 'vitest'
import { buildMasteryEntries, collectPages, collectPublishedChallengeIds } from '@/lib/progress/mastery'

describe('progress mastery', () => {
  it('loads every published challenge beyond the Supabase 1,000-row response limit', async () => {
    const all = Array.from({ length: 1505 }, (_, index) => ({ id: `challenge-${index + 1}` }))
    const fetchPage = vi.fn(async (from: number, to: number) => all.slice(from, to + 1))

    const ids = await collectPublishedChallengeIds(fetchPage)

    expect(ids).toHaveLength(1505)
    expect(ids.at(-1)).toBe('challenge-1505')
    expect(fetchPage).toHaveBeenNthCalledWith(1, 0, 999)
    expect(fetchPage).toHaveBeenNthCalledWith(2, 1000, 1999)
  })

  it('loads every completed attempt before deduplicating challenge scores', async () => {
    const attempts = Array.from({ length: 1001 }, (_, index) => ({
      challenge_id: index === 1000 ? 'sql-1' : `legacy-${index}`,
      total_score: index === 1000 ? 4.5 : null,
      max_score: index === 1000 ? 5 : null,
    }))

    const rows = await collectPages(async (from, to) => attempts.slice(from, to + 1))
    const entries = buildMasteryEntries(['sql-1'], rows)

    expect(rows).toHaveLength(1001)
    expect(entries.find(entry => entry.challenge_id === 'sql-1')).toEqual({
      challenge_id: 'sql-1',
      score: 90,
      is_completed: true,
    })
  })

  it('counts a completed challenge once and keeps its best normalized Hatch score', () => {
    const entries = buildMasteryEntries(
      ['sql-1', 'sql-2'],
      [
        { challenge_id: 'sql-1', total_score: 3.6, max_score: 5 },
        { challenge_id: 'sql-1', total_score: 4.1, max_score: 5 },
      ],
    )

    expect(entries).toEqual([
      { challenge_id: 'sql-1', score: 82, is_completed: true },
      { challenge_id: 'sql-2', score: null, is_completed: false },
    ])
    expect(entries.filter(entry => entry.is_completed)).toHaveLength(1)
    expect(entries.filter(entry => entry.is_completed && entry.score !== null && entry.score >= 80)).toHaveLength(1)
  })

  it('counts completed legacy attempts once even when unpublished or missing a usable score', () => {
    const entries = buildMasteryEntries(
      ['current-1'],
      [
        { challenge_id: 'legacy-1', total_score: null, max_score: null },
        { challenge_id: 'legacy-1', total_score: null, max_score: null },
      ],
    )

    expect(entries).toEqual([
      { challenge_id: 'current-1', score: null, is_completed: false },
      { challenge_id: 'legacy-1', score: null, is_completed: true, is_catalogued: false },
    ])
    expect(entries.filter(entry => entry.is_completed)).toHaveLength(1)
  })
})
