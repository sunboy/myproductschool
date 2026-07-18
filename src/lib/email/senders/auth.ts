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
    previewText: 'One click finishes setting up your account.',
    body: 'Open the confirmation link below to finish setting up your account. The link expires in 24 hours.',
    bodyParagraphs: [
      'If you did not create a HackProduct account, ignore this email. Nothing happens without the link.',
    ],
    ctaLabel: 'Confirm email',
    ctaUrl: input.url,
    signoff: null,
  })
}

export function sendMagicLinkEmail(admin: SupabaseClient, input: LinkEmailInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'magic_link',
    subject: 'Your HackProduct magic link',
    eyebrow: 'Sign in',
    heading: 'Use this link to sign in.',
    previewText: 'This link signs you in. It expires in 10 minutes.',
    body: 'Open the link below to sign in. It expires in 10 minutes.',
    bodyParagraphs: [
      'Nobody can sign in without this email. If you did not request it, you can ignore it.',
    ],
    ctaLabel: 'Sign in',
    ctaUrl: input.url,
    signoff: null,
  })
}

export function sendPasswordResetEmail(admin: SupabaseClient, input: LinkEmailInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'password_reset',
    subject: 'Reset your HackProduct password',
    eyebrow: 'Password reset',
    heading: 'Choose a new password.',
    previewText: 'The reset link expires in 1 hour.',
    body: 'Open the reset link below and choose a new password for your account. The link expires in 1 hour.',
    bodyParagraphs: [
      'If you did not request this, your password is unchanged and you can ignore this email.',
    ],
    ctaLabel: 'Reset password',
    ctaUrl: input.url,
    signoff: null,
  })
}
