import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rankListings, scoreListingMatch, profileFingerprint } from '../../../src/lib/careerops/feed'
import type { CareerProfile, JobListing } from '../../../src/lib/careerops/types'

const profile: CareerProfile = {
  user_id: 'u1',
  target_role: 'Staff Backend Engineer',
  seniority: 'staff',
  locations: ['Remote'],
  key_skills: ['Go', 'Postgres', 'Kubernetes'],
  resume_text: null,
  resume_json: null,
  comp_expectation: null,
  notes: null,
}

function listing(over: Partial<JobListing>): JobListing {
  return {
    id: Math.random().toString(36).slice(2),
    provider: 'jsearch',
    external_id: 'x',
    company: 'Acme',
    role_title: 'Engineer',
    location: 'Remote',
    url: 'https://x',
    department: null,
    description: null,
    posted_at: null,
    discipline_tags: null,
    is_active: true,
    ...over,
  }
}

test('a closely matching listing outranks a weak one', () => {
  const strong = listing({ role_title: 'Staff Backend Engineer', description: 'Go Postgres Kubernetes' })
  const weak = listing({ role_title: 'Marketing Manager', location: 'London', description: 'brand campaigns' })
  assert.ok(scoreListingMatch(profile, strong) > scoreListingMatch(profile, weak))
})

test('rankListings drops inactive listings and sorts best first', () => {
  const active = listing({ role_title: 'Staff Backend Engineer', description: 'Go Postgres' })
  const inactive = listing({ role_title: 'Staff Backend Engineer', is_active: false })
  const filler = listing({ role_title: 'Frontend Designer', location: 'Paris' })
  const ranked = rankListings(profile, [filler, inactive, active], 10)
  assert.equal(ranked.length, 2) // inactive excluded
  assert.equal(ranked[0].role_title, 'Staff Backend Engineer')
  assert.ok(ranked[0].match_rank >= ranked[1].match_rank)
})

test('profileFingerprint is stable across reordered skills/locations', () => {
  const a = profileFingerprint(profile)
  const b = profileFingerprint({ ...profile, key_skills: ['Kubernetes', 'Postgres', 'Go'], locations: ['Remote'] })
  assert.equal(a, b)
})

test('profileFingerprint changes when the target role changes', () => {
  const a = profileFingerprint(profile)
  const b = profileFingerprint({ ...profile, target_role: 'Frontend Engineer' })
  assert.notEqual(a, b)
})
