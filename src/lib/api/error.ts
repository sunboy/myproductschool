import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { logger } from '@/lib/log'

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

// Expected business outcomes that surface as 4xx but are NOT defects: a user
// hitting a plan/usage cap is the paywall working, not an error. These are logged
// at `warn` (never `error`) so they don't pollute the error dashboard — e.g. the
// hatch_nudges 402 that generated 300+ "error" log lines/week in prod. Add codes
// here as new expected-limit responses appear.
const EXPECTED_BUSINESS_CODES = new Set(['limit_reached'])

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
  // Every error a user might see must be visible to us — especially with
  // MASK_API_ERRORS on, where the client gets a generic string and users
  // can't report anything useful. 5xx go to Sentry as errors; 4xx as
  // warnings tagged by code, so a sudden spike in one code (e.g. a config
  // failure returning 400 on 100% of requests) surfaces as an issue
  // instead of hiding in runtime logs. Sentry groups by message, so steady
  // background validation noise stays a single grouped issue.
  if (status >= 500) {
    logger.error(`[apiError] ${status} ${code}: ${message}`, {
      status,
      code,
      ...(details !== undefined ? { details } : {}),
    })
    Sentry.captureMessage(`API ${status} ${code}: ${message}`, {
      level: 'error',
      tags: { api_error_code: code, status: String(status) },
      extra: { details },
    })
  } else {
    // With MASK_ERRORS on the client only sees a generic string, so we log the
    // real 4xx server-side for observability. Expected business outcomes (plan
    // limits) log at `warn`, not `error`, so they don't read as failures.
    if (MASK_ERRORS) {
      const logLine = `[apiError] ${status} ${code}: ${message}`
      const logData = { status, code, ...(details !== undefined ? { details } : {}) }
      if (EXPECTED_BUSINESS_CODES.has(code)) {
        logger.warn(logLine, logData)
      } else {
        logger.error(logLine, logData)
      }
    }
    Sentry.captureMessage(`API ${status} ${code}: ${message}`, {
      level: EXPECTED_BUSINESS_CODES.has(code) ? 'info' : 'warning',
      tags: { api_error_code: code, status: String(status) },
      extra: { details },
    })
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
