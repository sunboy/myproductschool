import { describe, it, expect } from 'vitest'
import { buildLibraryShelves, filterByType, readMins } from '@/lib/data/library-density'

const guide = { kind: 'guide' as const, id: 'g1', slug: 'context-engineering', title: 'Context engineering', href: '/explore/modules/context-engineering', chapters: 7, completed: 3, minutes: 60, tagline: 'x' }
const plan = { kind: 'plan' as const, id: 'p1', slug: 'frame-like-a-pm', title: 'Frame like a PM', href: '/explore/plans/frame-like-a-pm', reps: 7, done: 0, move: 'frame', enrolled: false }
const story = { kind: 'autopsy' as const, id: 'a1', companySlug: 'google', storySlug: 'gmail-undo-send', title: 'Gmail Undo Send', dek: 'A delay made a destructive action feel reversible.', href: '/explore/autopsies/google/stories/gmail-undo-send', readTime: '8 min read', company: 'Google', saved: true, progress: 0 }

describe('library-density', () => {
  it('parses read minutes', () => { expect(readMins('8 min read')).toBe(8); expect(readMins(undefined)).toBe(6) })
  it('builds shelves with a saved featured story and in-progress first', () => {
    const s = buildLibraryShelves({ guides: [guide], plans: [plan], stories: [story, { ...story, id: 'a2', storySlug: 'wordle', title: 'Wordle', saved: false, progress: 0.4 }], readingProgress: [] })
    expect(s.featured?.title).toBe('Gmail Undo Send')
    expect(s.yourLearning.map(i => i.title)).toEqual(['Context engineering', 'Wordle'])
    expect(s.studyPlans).toHaveLength(1); expect(s.modules).toHaveLength(1); expect(s.autopsies.map(a => a.title)).toEqual(['Wordle'])
  })
  it('filters by chip type', () => {
    expect(filterByType('autopsies', { guides: [guide], plans: [plan], stories: [story] }).guides).toEqual([])
    expect(filterByType('saved', { guides: [guide], plans: [plan], stories: [story] }).stories).toHaveLength(1)
  })

  it('keeps saved stories in the shelf when featured extraction is off', () => {
    const s = buildLibraryShelves({ guides: [], plans: [], stories: [story], readingProgress: [] }, { extractFeatured: false })
    expect(s.featured).toBeNull(); expect(s.autopsies.map(a => a.title)).toEqual(['Gmail Undo Send'])
  })
})
