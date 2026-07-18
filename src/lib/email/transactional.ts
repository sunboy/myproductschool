/**
 * Barrel for the email system. The engine lives in send-core.ts (types, shared
 * utils, rendering via layout.ts, the dedupe-aware send pipeline); the sender
 * functions live in senders/* grouped by treatment tier so copy changes to one
 * tier never touch another tier's file. Existing import sites all resolve
 * through here unchanged.
 */
export {
  renderEmailForPreview,
  sendCustomHtmlEmail,
  sendTransactionalEmail,
  appUrl,
  type TransactionalEmailKind,
  type TransactionalEmailPayload,
  type BaseTransactionalInput,
} from '@/lib/email/send-core'
export * from '@/lib/email/senders/lifecycle'
export * from '@/lib/email/senders/auth'
export * from '@/lib/email/senders/billing'
export * from '@/lib/email/senders/internal'
