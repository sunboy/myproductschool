import { describe, expect, it } from 'vitest'
import { workspaceAttemptUrl } from '@/lib/workspace/attempt-url'

describe('workspaceAttemptUrl', () => {
  it('pins a completed attempt without dropping existing workspace context', () => {
    const result = workspaceAttemptUrl(
      'https://preview.example/workspace/challenges/count-distinct?from_plan=backend&returnTo=%2Fprogress%3Ftab%3Dcoding#feedback',
      'attempt-completed',
    )

    expect(result).toBe(
      '/workspace/challenges/count-distinct?from_plan=backend&returnTo=%2Fprogress%3Ftab%3Dcoding&attempt=attempt-completed#feedback',
    )
  })

  it('replaces an older attempt id instead of adding a duplicate', () => {
    const result = workspaceAttemptUrl(
      'https://preview.example/workspace/challenges/count-distinct?attempt=old&from_domain=software',
      'new',
    )

    expect(result).toBe('/workspace/challenges/count-distinct?attempt=new&from_domain=software')
  })

  it('removes only the attempt id when explicit retry starts fresh practice', () => {
    const result = workspaceAttemptUrl(
      'https://preview.example/workspace/challenges/count-distinct?attempt=old&returnTo=%2Fprogress',
      null,
    )

    expect(result).toBe('/workspace/challenges/count-distinct?returnTo=%2Fprogress')
  })
})
