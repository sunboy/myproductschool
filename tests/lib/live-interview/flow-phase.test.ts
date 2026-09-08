import { describe, expect, it } from 'vitest'
import { FLOW_ORDER, derivePhase } from '@/lib/live-interview/flow-phase'

describe('derivePhase', () => {
  it('starts at warm-up with no signals', () => {
    const phase = derivePhase([])
    expect(phase.label).toBe('Warm-up')
    expect(phase.index).toBe(0)
    expect(phase.covered).toEqual({ frame: false, list: false, optimize: false, win: false })
  })

  it('advances to the furthest FLOW move seen', () => {
    const phase = derivePhase([{ flowMove: 'frame' }, { flowMove: 'optimize' }])
    expect(phase.label).toBe('Optimize')
    expect(phase.index).toBe(3)
    expect(phase.covered).toEqual({ frame: true, list: false, optimize: true, win: false })
  })

  it('ignores unknown or missing moves', () => {
    const phase = derivePhase([{ flowMove: 'frame' }, { flowMove: 'not-a-move' }, {}])
    expect(phase.label).toBe('Frame')
    expect(phase.index).toBe(1)
  })

  it('keeps FLOW_ORDER in the canonical sequence', () => {
    expect(FLOW_ORDER).toEqual(['frame', 'list', 'optimize', 'win'])
  })
})
