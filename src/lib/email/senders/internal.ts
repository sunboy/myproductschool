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
  const excerpt = input.excerpt
    ? `${input.excerpt.slice(0, 180)}${input.excerpt.length > 180 ? '...' : ''}`
    : 'Open the discussion to read the full reply.'

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'discussion_reply',
    subject: 'New reply on your HackProduct discussion',
    eyebrow: 'Discussion reply',
    previewText: excerpt,
    heading: input.challengeTitle ?? 'Someone replied to your comment.',
    body: `${input.replyAuthor ?? 'Someone'} replied to your discussion comment.`,
    contentCards: [
      {
        eyebrow: 'Reply',
        title: input.replyAuthor ?? 'Someone',
        description: excerpt,
        ctaLabel: 'View reply',
        ctaUrl: input.url,
      },
    ],
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
    previewText: 'Your account, profile, and progress data have been removed.',
    body: 'Your HackProduct account, profile, and practice history have been permanently removed.',
    bodyParagraphs: ['This is final. There is nothing further to do, and we will not contact you about this account again.'],
    signoff: null,
  })
}

export function sendAbuseReportEmail(admin: SupabaseClient, input: AbuseReportEmailInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    to: input.to ?? configuredReplyTo(),
    kind: 'abuse_report',
    subject: 'New HackProduct abuse report',
    eyebrow: 'Abuse report',
    heading: 'A report needs review.',
    previewText: `${input.category} report on ${input.targetType}`,
    body: 'A user reported content in HackProduct.',
    bodyParagraphs: input.message ? [input.message.slice(0, 500)] : null,
    stats: [
      { label: 'Report ID', value: input.reportId },
      { label: 'Surface', value: input.targetType },
      { label: 'Category', value: input.category },
    ],
    ctaLabel: input.targetUrl ? 'Open reported surface' : null,
    ctaUrl: input.targetUrl ?? null,
    signoff: null,
  })
}

export function sendProductFeedbackEmail(admin: SupabaseClient, input: ProductFeedbackEmailInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    to: input.to ?? configuredReplyTo(),
    kind: 'product_feedback',
    subject: 'New HackProduct feedback',
    eyebrow: 'Product feedback',
    heading: 'A user sent feedback.',
    previewText: input.message ? input.message.slice(0, 140) : 'Review the latest in-app feedback.',
    body: 'A user sent feedback from inside HackProduct.',
    bodyParagraphs: input.message ? [input.message.slice(0, 700)] : null,
    stats: [
      { label: 'Feedback ID', value: input.feedbackId },
      { label: 'Kind', value: input.kind },
      { label: 'Rating', value: `${input.rating}/5` },
      ...(input.path ? [{ label: 'Path', value: input.path }] : []),
    ],
    ctaLabel: input.path ? 'Open surface' : null,
    ctaUrl: input.path ? appUrl(input.path) : null,
    signoff: null,
  })
}

export function sendGrowthReportEmail(admin: SupabaseClient, input: GrowthReportInput) {
  return sendTransactionalEmail(admin, {
    to: input.to,
    dedupeKey: `growth-report:${input.weekLabel}`,
    kind: 'growth_report',
    subject: `Growth report: week of ${input.weekLabel}`,
    eyebrow: 'Monday funnel report',
    heading: input.headline,
    previewText: 'Trailing 7 days vs. the 7 days before, internal and test accounts excluded.',
    body: 'Weekly funnel numbers, internal and test accounts excluded. Deltas compare the trailing 7 days against the 7 days before.',
    bodyParagraphs: input.detail ? [input.detail] : null,
    valueBullets: input.metrics,
    ctaLabel: 'Open the Growth hub',
    ctaUrl: 'https://linear.app/sunboy-labs',
    signoff: null,
  })
}
