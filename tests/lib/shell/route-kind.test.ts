import { describe, it, expect } from 'vitest'
import { routeKind, forcedRail, activeNavKey } from '@/lib/shell/route-kind'

describe('route-kind', () => {
  it('classifies routes', () => {
    expect(routeKind('/dashboard')).toBe('hub')
    expect(routeKind('/explore')).toBe('hub')
    expect(routeKind('/explore/modules/context-engineering')).toBe('reader')
    expect(routeKind('/explore/autopsies/buffer/stories/x')).toBe('reader')
    expect(routeKind('/explore/autopsies/buffer')).toBe('hub')
    expect(routeKind('/workspace/challenges/abc')).toBe('workspace')
    expect(routeKind('/live-interviews/123e4567-e89b-12d3-a456-426614174000')).toBe('interview-room')
    expect(routeKind('/live-interviews')).toBe('hub')
    expect(routeKind('/live-interviews/loop/new')).toBe('hub')
    expect(routeKind('/settings')).toBe('hub')
  })
  it('forces the rail on readers and workspaces', () => {
    expect(forcedRail('/dashboard')).toBe(false)
    expect(forcedRail('/explore/modules/x')).toBe(true)
    expect(forcedRail('/workspace/challenges/x')).toBe(true)
    expect(forcedRail('/live-interviews/123e4567-e89b-12d3-a456-426614174000')).toBe(true)
  })
  it('maps to nav keys', () => {
    expect(activeNavKey('/')).toBe('home')
    expect(activeNavKey('/dashboard/x')).toBe('home')
    expect(activeNavKey('/challenges')).toBe('practice')
    expect(activeNavKey('/workspace/challenges/x')).toBe('practice')
    expect(activeNavKey('/live-interviews')).toBe('practice')
    expect(activeNavKey('/explore/modules/x')).toBe('library')
    expect(activeNavKey('/progress/skill-ladder')).toBe('progress')
    expect(activeNavKey('/settings')).toBe(null)
  })
})
