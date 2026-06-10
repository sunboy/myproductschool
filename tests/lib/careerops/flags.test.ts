import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deriveCareerOpsFlags, type RawCareerOpsFlags } from '../../../src/lib/careerops/flags'

const ALL_ON: RawCareerOpsFlags = {
  master: true, scorer: true, discovery: true, routing: true, tracker: true, resume: true, stories: true,
  public_score: true,
}

test('master off suppresses every sub-flag', () => {
  const flags = deriveCareerOpsFlags({ ...ALL_ON, master: false })
  for (const key of Object.keys(flags) as (keyof typeof flags)[]) {
    assert.equal(flags[key], false, `${key} should be off when master is off`)
  }
})

test('scorer off forces routing, discovery, and public_score off', () => {
  const flags = deriveCareerOpsFlags({ ...ALL_ON, scorer: false })
  assert.equal(flags.scorer, false)
  assert.equal(flags.routing, false, 'routing requires scorer')
  assert.equal(flags.discovery, false, 'discovery requires scorer')
  assert.equal(flags.public_score, false, 'public_score requires scorer')
  // tracker / resume / stories only depend on master, so they stay on.
  assert.equal(flags.tracker, true)
  assert.equal(flags.resume, true)
  assert.equal(flags.stories, true)
})

test('public_score requires its own flag even with scorer on', () => {
  const flags = deriveCareerOpsFlags({ ...ALL_ON, public_score: false })
  assert.equal(flags.scorer, true)
  assert.equal(flags.public_score, false)
})

test('discovery requires its own flag even with scorer on', () => {
  const flags = deriveCareerOpsFlags({ ...ALL_ON, discovery: false })
  assert.equal(flags.scorer, true)
  assert.equal(flags.discovery, false)
})

test('tracker is independent of scorer', () => {
  const flags = deriveCareerOpsFlags({ ...ALL_ON, scorer: false, tracker: true })
  assert.equal(flags.tracker, true)
  assert.equal(flags.scorer, false)
})

test('all on enables everything', () => {
  const flags = deriveCareerOpsFlags(ALL_ON)
  for (const key of Object.keys(flags) as (keyof typeof flags)[]) {
    assert.equal(flags[key], true)
  }
})
