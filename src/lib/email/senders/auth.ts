import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { EMAIL_ART } from '@/lib/email/art'
import { configuredReplyTo } from '@/lib/email/client'
import {
  appUrl,
  formatDate,
  formatMoney,
  sendTransactionalEmail,
  type BaseTransactionalInput,
} from '@/lib/email/send-core'

// Auth senders (tier b: branded, single CTA, safety lines, zero marketing).

export interface LinkEmailInput extends BaseTransactionalInput {
  url: string
}

export function sendVerificationEmail(admin: SupabaseClient, input: LinkEmailInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'verification',
    subject: 'Confirm your HackProduct email',
    eyebrow: 'Email verification',
    heading: 'Confirm your email.',
    body: 'Open the confirmation link to finish setting up your account.',
    ctaLabel: 'Confirm email',
    ctaUrl: input.url,
  })
}

export function sendMagicLinkEmail(admin: SupabaseClient, input: LinkEmailInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'magic_link',
    subject: 'Your HackProduct magic link',
    eyebrow: 'Sign in',
    heading: 'Use this link to sign in.',
    body: 'This link signs you in securely and expires soon.',
    ctaLabel: 'Sign in',
    ctaUrl: input.url,
  })
}

export function sendPasswordResetEmail(admin: SupabaseClient, input: LinkEmailInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'password_reset',
    subject: 'Reset your HackProduct password',
    eyebrow: 'Password reset',
    heading: 'Choose a new password.',
    body: 'Open the reset link and choose a new password for your account.',
    ctaLabel: 'Reset password',
    ctaUrl: input.url,
  })
}
