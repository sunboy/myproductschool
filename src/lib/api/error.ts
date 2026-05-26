import { NextResponse } from 'next/server'

type ApiErrorDetails = Record<string, unknown> | unknown[] | string | number | boolean | null

interface ApiErrorBody {
  ok: false
  error: string
  code: string
  details?: ApiErrorDetails
  [key: string]: unknown
}

const GENERIC_USER_ERROR = 'Something went wrong. Please try again.'

// When MASK_API_ERRORS=true, all error messages and details are hidden from
// the response body and replaced with a generic string. The real message is
// still logged server-side so it can be investigated. Set this in production
// so internal codes, routes, and model names never reach the client.
const MASK_ERRORS = process.env.MASK_API_ERRORS === 'true'

function shouldExposeDetails(status: number) {
  if (MASK_ERRORS) return false
  return process.env.NODE_ENV !== 'production' || status < 500
}

function safeMessage(status: number, message: string) {
  if (MASK_ERRORS) return GENERIC_USER_ERROR
  if (process.env.NODE_ENV === 'production' && status >= 500) return GENERIC_USER_ERROR
  return message
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: ApiErrorDetails
) {
  if (MASK_ERRORS) {
    console.error(`[apiError] ${status} ${code}: ${message}`, details ?? '')
  }

  const exposedDetails = details !== undefined && shouldExposeDetails(status) ? details : undefined
  const body: ApiErrorBody = {
    ok: false,
    error: safeMessage(status, message),
    code,
  }

  if (exposedDetails !== undefined) {
    body.details = exposedDetails
    if (isPlainRecord(exposedDetails)) {
      Object.assign(body, exposedDetails)
    }
  }

  return NextResponse.json(body, { status })
}
