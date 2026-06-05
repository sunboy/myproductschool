import { test } from 'node:test'
import assert from 'node:assert/strict'
import { greenhouseProvider } from '../../../src/lib/careerops/providers/greenhouse'
import { leverProvider } from '../../../src/lib/careerops/providers/lever'
import { ashbyProvider } from '../../../src/lib/careerops/providers/ashby'
import { workableProvider } from '../../../src/lib/careerops/providers/workable'
import { searchJSearch, jsearchConfigured } from '../../../src/lib/careerops/providers/jsearch'
import type { ProviderContext } from '../../../src/lib/careerops/providers/context'
import type { CompanyEntry } from '../../../src/lib/careerops/companies'

function jsonCtx(payload: unknown): ProviderContext {
  return {
    async fetchJson<T>() { return payload as T },
    async fetchText() { return null },
  }
}
function textCtx(payload: string): ProviderContext {
  return {
    async fetchJson<T>() { return null as T },
    async fetchText() { return payload },
  }
}

test('greenhouse provider parses a board response', async () => {
  const company: CompanyEntry = { name: 'Acme', provider: 'greenhouse', slug: 'acme' }
  const ctx = jsonCtx({ jobs: [{ id: 7, title: 'Staff Engineer', absolute_url: 'https://x/7', location: { name: 'Remote' }, departments: [{ name: 'Eng' }] }] })
  const out = await greenhouseProvider.fetch(company, ctx)
  assert.equal(out.length, 1)
  assert.deepEqual(
    { ...out[0], external_id: out[0].external_id },
    { external_id: 'greenhouse:acme:7', title: 'Staff Engineer', url: 'https://x/7', company: 'Acme', location: 'Remote', department: 'Eng', posted_at: null },
  )
})

test('lever provider parses postings', async () => {
  const company: CompanyEntry = { name: 'Acme', provider: 'lever', slug: 'acme' }
  const ctx = jsonCtx([{ id: 'abc', text: 'Backend Engineer', hostedUrl: 'https://l/abc', categories: { location: 'NYC', team: 'Platform' } }])
  const out = await leverProvider.fetch(company, ctx)
  assert.equal(out[0].external_id, 'lever:acme:abc')
  assert.equal(out[0].title, 'Backend Engineer')
  assert.equal(out[0].url, 'https://l/abc')
  assert.equal(out[0].location, 'NYC')
})

test('ashby provider parses jobs', async () => {
  const company: CompanyEntry = { name: 'Acme', provider: 'ashby', slug: 'acme' }
  const ctx = jsonCtx({ jobs: [{ id: 'j1', title: 'ML Engineer', jobUrl: 'https://a/j1', location: 'SF' }] })
  const out = await ashbyProvider.fetch(company, ctx)
  assert.equal(out[0].external_id, 'ashby:acme:j1')
  assert.equal(out[0].title, 'ML Engineer')
  assert.equal(out[0].url, 'https://a/j1')
})

test('workable provider parses a markdown table', async () => {
  const company: CompanyEntry = { name: 'Acme', provider: 'workable', slug: 'acme' }
  const md = [
    '| Title | Department | Location | Type | Salary | Posted | Details |',
    '|---|---|---|---|---|---|---|',
    '| Senior Engineer | Eng | Remote | FT | - | today | [View](https://w/123) |',
  ].join('\n')
  const out = await workableProvider.fetch(company, textCtx(md))
  assert.equal(out.length, 1)
  assert.equal(out[0].title, 'Senior Engineer')
  assert.equal(out[0].url, 'https://w/123')
  assert.equal(out[0].location, 'Remote')
})

test('jsearch no-ops without a key', async () => {
  const prev = process.env.JSEARCH_RAPIDAPI_KEY
  delete process.env.JSEARCH_RAPIDAPI_KEY
  assert.equal(jsearchConfigured(), false)
  const out = await searchJSearch({ query: 'engineer', country: 'us' }, jsonCtx({ data: [] }), 1)
  assert.deepEqual(out, [])
  if (prev !== undefined) process.env.JSEARCH_RAPIDAPI_KEY = prev
})

test('jsearch parses a search response when configured', async () => {
  const prev = process.env.JSEARCH_RAPIDAPI_KEY
  process.env.JSEARCH_RAPIDAPI_KEY = 'test-key'
  const ctx = jsonCtx({ data: [{ job_id: 'g1', job_title: 'AI Engineer', employer_name: 'OpenLab', job_city: 'Austin', job_state: 'TX', job_country: 'US', job_apply_link: 'https://j/g1', job_description: 'desc' }] })
  const out = await searchJSearch({ query: 'AI engineer', country: 'us' }, ctx, 1)
  assert.equal(out[0].external_id, 'jsearch:g1')
  assert.equal(out[0].title, 'AI Engineer')
  assert.equal(out[0].company, 'OpenLab')
  assert.equal(out[0].url, 'https://j/g1')
  assert.equal(out[0].location, 'Austin, TX, US')
  if (prev === undefined) delete process.env.JSEARCH_RAPIDAPI_KEY
  else process.env.JSEARCH_RAPIDAPI_KEY = prev
})
