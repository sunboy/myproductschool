import { describe, expect, it } from 'vitest'
import { applyChallengeFilters, type ChallengeListFilters } from '@/lib/data/challenges'

/**
 * Minimal fake PostgREST-style query builder. Each method records the call
 * and returns `this` so the chain in applyChallengeFilters keeps working,
 * matching the generic constraint it's typed against.
 */
function makeFakeQuery() {
  const calls: { method: string; args: unknown[] }[] = []
  const query = {
    eq(...args: unknown[]) { calls.push({ method: 'eq', args }); return query },
    in(...args: unknown[]) { calls.push({ method: 'in', args }); return query },
    contains(...args: unknown[]) { calls.push({ method: 'contains', args }); return query },
    overlaps(...args: unknown[]) { calls.push({ method: 'overlaps', args }); return query },
    ilike(...args: unknown[]) { calls.push({ method: 'ilike', args }); return query },
    or(...args: unknown[]) { calls.push({ method: 'or', args }); return query },
  }
  return { query, calls }
}

describe('applyChallengeFilters move filter', () => {
  it('survives normalization and calls contains(move_tags, [move])', () => {
    const filters: ChallengeListFilters = { move: 'optimize' }
    expect(filters.move).toBe('optimize')

    const { query, calls } = makeFakeQuery()
    applyChallengeFilters(query, filters)

    const moveCall = calls.find(c => c.method === 'contains' && c.args[0] === 'move_tags')
    expect(moveCall).toBeDefined()
    expect(moveCall?.args).toEqual(['move_tags', ['optimize']])
  })

  it('does not call contains(move_tags) when move is absent', () => {
    const { query, calls } = makeFakeQuery()
    applyChallengeFilters(query, {})
    expect(calls.find(c => c.method === 'contains' && c.args[0] === 'move_tags')).toBeUndefined()
  })

  it.each(['frame', 'list', 'optimize', 'win'])('supports the %s FLOW move', (move) => {
    const { query, calls } = makeFakeQuery()
    applyChallengeFilters(query, { move })
    expect(calls.find(c => c.method === 'contains' && c.args[0] === 'move_tags')?.args[1]).toEqual([move])
  })
})
