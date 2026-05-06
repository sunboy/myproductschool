import { NextResponse } from 'next/server'

type ApiErrorDetails = Record<string, unknown> | unknown[] | string | number | boolean | null

interface ApiErrorBody {
  ok: false
  error: string
  code: string
  details?: ApiErrorDetails
  [key: string]: unknown
}

const GENERIC_SERVER_ERROR = 'Something went wrong. Try again.'

function shouldExposeDetails(status: number) {
  return process.env.NODE_ENV !== 'production' || status < 500
}

function safeMessage(status: number, message: string) {
  if (process.env.NODE_ENV === 'production' && status >= 500) {
    return GENERIC_SERVER_ERROR
  }
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
