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

// Internal / notification senders (tier d: terse, stat grid, no sign-off).

export interface DiscussionReplyInput extends BaseTransactionalInput {
  challengeTitle?: string | null
  replyAuthor?: string | null
  excerpt?: string | null
  url: string
}

export interface AbuseReportEmailInput extends BaseTransactionalInput {
  reportId: string
  targetType: string
  category: string
  targetUrl?: string | null
  message?: string | null
}

export interface ProductFeedbackEmailInput extends BaseTransactionalInput {
  feedbackId: string
  kind: string
  rating: number
  path?: string | null
  message?: string | null
}

export interface GrowthReportInput {
  to: string
  weekLabel: string
  headline: string
  metrics: string[]
  detail?: string | null
}

export function sendDiscussionReplyEmail(admin: SupabaseClient, input: DiscussionReplyInput) {
  const detail = input.excerpt
    ? `"${input.excerpt.slice(0, 180)}${input.excerpt.length > 180 ? '...' : ''}"`
    : null

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'discussion_reply',
    subject: 'New reply on your HackProduct discussion',
    eyebrow: 'Discussion reply',
    heading: input.challengeTitle ?? 'Someone replied to your comment.',
    body: `${input.replyAuthor ?? 'Someone'} replied to your discussion comment.`,
    detail,
    ctaLabel: 'View reply',
    ctaUrl: input.url,
  })
}

export function sendAccountDeletedEmail(admin: SupabaseClient, input: BaseTransactionalInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'account_deleted',
    subject: 'Your HackProduct account was deleted',
    eyebrow: 'Account deleted',
    heading: 'Your account has been deleted.',
    body: 'Your HackProduct account and profile data have been removed.',
  })
}

export function sendAbuseReportEmail(admin: SupabaseClient, input: AbuseReportEmailInput) {
  const detail = [
    `Report ID: ${input.reportId}`,
    `Surface: ${input.targetType}`,
    `Category: ${input.category}`,
    input.message ? `Message: ${input.message.slice(0, 500)}` : null,
    input.targetUrl ? `Target: ${input.targetUrl}` : null,
  ].filter(Boolean).join(' | ')

  return sendTransactionalEmail(admin, {
    ...input,
    to: input.to ?? configuredReplyTo(),
    kind: 'abuse_report',
    subject: 'New HackProduct abuse report',
    eyebrow: 'Abuse report',
    heading: 'A report needs review.',
    body: 'A user reported content in HackProduct.',
    detail,
    ctaLabel: input.targetUrl ? 'Open reported surface' : null,
    ctaUrl: input.targetUrl ?? null,
  })
}

export function sendProductFeedbackEmail(admin: SupabaseClient, input: ProductFeedbackEmailInput) {
  const detail = [
    `Feedback ID: ${input.feedbackId}`,
    `Kind: ${input.kind}`,
    `Rating: ${input.rating}/5`,
    input.path ? `Path: ${input.path}` : null,
    input.message ? `Message: ${input.message.slice(0, 700)}` : null,
  ].filter(Boolean).join(' | ')

  return sendTransactionalEmail(admin, {
    ...input,
    to: input.to ?? configuredReplyTo(),
    kind: 'product_feedback',
    subject: 'New HackProduct feedback',
    eyebrow: 'Product feedback',
    heading: 'A user sent feedback.',
    body: 'Review the latest in-app feedback from HackProduct.',
    detail,
    ctaLabel: input.path ? 'Open surface' : null,
    ctaUrl: input.path ? appUrl(input.path) : null,
  })
}

export function sendGrowthReportEmail(admin: SupabaseClient, input: GrowthReportInput) {
  return sendTransactionalEmail(admin, {
    to: input.to,
    dedupeKey: `growth-report:${input.weekLabel}`,
    kind: 'growth_report',
    subject: `Growth report — week of ${input.weekLabel}`,
    eyebrow: 'Monday funnel report',
    heading: input.headline,
    body: 'Weekly funnel numbers, internal and test accounts excluded. Deltas compare the trailing 7 days against the 7 days before.',
    detail: input.detail ?? null,
    valueBullets: input.metrics,
    ctaLabel: 'Open the Growth hub',
    ctaUrl: 'https://linear.app/sunboy-labs',
  })
}
