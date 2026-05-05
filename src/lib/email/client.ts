import 'server-only'

import { Resend } from 'resend'

let resendClient: Resend | null = null

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null

  resendClient ??= new Resend(apiKey)
  return resendClient
}

export function configuredFromEmail() {
  return process.env.RESEND_FROM_EMAIL?.trim() || 'HackProduct <billing@hackproduct.com>'
}

export function configuredReplyTo() {
  return process.env.RESEND_REPLY_TO?.trim() || 'founders@hackproduct.com'
}
