import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { changePasswordSchema, emailChangeSchema } from '@/lib/auth/validation'

describe('emailChangeSchema', () => {
  it('normalizes the new email and requires the current password', () => {
    const parsed = emailChangeSchema.safeParse({
      email: ' New.Email@Example.COM ',
      currentPassword: 'current-password-1',
    })

    assert.equal(parsed.success, true)
    if (!parsed.success) throw new Error('Expected validation to pass')
    assert.equal(parsed.data.email, 'new.email@example.com')
  })

  it('rejects invalid email change requests', () => {
    const parsed = emailChangeSchema.safeParse({
      email: 'not-an-email',
      currentPassword: '',
    })

    assert.equal(parsed.success, false)
    if (parsed.success) throw new Error('Expected validation to fail')
    assert.deepEqual(
      parsed.error.issues.map(issue => issue.path[0]).sort(),
      ['currentPassword', 'email']
    )
  })
})

describe('changePasswordSchema', () => {
  it('accepts a current password and a matching strong new password', () => {
    const parsed = changePasswordSchema.safeParse({
      currentPassword: 'old-password-1',
      password: 'new-password-1',
      confirm: 'new-password-1',
    })

    assert.equal(parsed.success, true)
  })

  it('requires the current password', () => {
    const parsed = changePasswordSchema.safeParse({
      currentPassword: '',
      password: 'new-password-1',
      confirm: 'new-password-1',
    })

    assert.equal(parsed.success, false)
    if (parsed.success) throw new Error('Expected validation to fail')
    assert.equal(parsed.error.issues[0]?.path[0], 'currentPassword')
  })

  it('rejects weak or mismatched new passwords', () => {
    const weak = changePasswordSchema.safeParse({
      currentPassword: 'old-password-1',
      password: 'short',
      confirm: 'short',
    })
    const mismatch = changePasswordSchema.safeParse({
      currentPassword: 'old-password-1',
      password: 'new-password-1',
      confirm: 'different-password-1',
    })

    assert.equal(weak.success, false)
    assert.equal(mismatch.success, false)
    if (mismatch.success) throw new Error('Expected mismatch validation to fail')
    assert.equal(mismatch.error.issues[0]?.path[0], 'confirm')
  })
})
