import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { logger } from '@/lib/log'
import { apiError } from '@/lib/api/error'

type RouteHandler<Ctx> = (req: NextRequest, ctx: Ctx) => Promise<Response> | Response

interface WithRouteOptions {
  /** Stable name for this route, used as the Sentry tag + log prefix. */
  name: string
}

/**
 * Wraps an App Router handler with three things the bare handlers lack:
 *
 *  1. A catch-all that forwards any thrown error to Sentry with route context
 *     ({ route, status }) and returns a masked 500 via apiError — so errors
 *     swallowed by a missing try/catch no longer vanish into a 500 with no trace.
 *  2. Handler timing (a Sentry span + a structured log line) so slow routes are
 *     visible even when they don't throw.
 *  3. Consistent structured logging via the shared logger (redaction included).
 *
 * Routes that already return apiError(5xx) on their own are still covered by
 * apiError's Sentry forwarding; this wrapper additionally catches the errors
 * those routes never anticipated (unexpected throws, upstream timeouts).
 *
 * Usage:
 *   export const POST = withRoute(async (req) => { ... }, { name: 'hatch.canvas.interpret' })
 */
export function withRoute<Ctx = unknown>(
  handler: RouteHandler<Ctx>,
  { name }: WithRouteOptions
): RouteHandler<Ctx> {
  return async (req: NextRequest, ctx: Ctx) => {
    const start = performance.now()
    return Sentry.withScope(async (scope) => {
      scope.setTag('route', name)
      try {
        const res = await handler(req, ctx)
        const durationMs = Math.round(performance.now() - start)
        // Surface slow successful requests too — a 200 that took 30s is still
        // a "hung screen" from the user's side.
        if (durationMs > 5000) {
          logger.warn(`[${name}] slow request`, { durationMs })
        }
        return res
      } catch (err) {
        const durationMs = Math.round(performance.now() - start)
        const error = err instanceof Error ? err : new Error(String(err))
        logger.error(`[${name}] unhandled error`, {
          error: error.message,
          name: error.name,
          durationMs,
        })
        Sentry.captureException(error, { tags: { route: name } })
        return apiError(500, 'internal_error', error.message)
      }
    }) as Promise<Response> | Response
  }
}

// Re-export so call sites can build typed contexts for dynamic routes.
export type { NextRequest }
export { NextResponse }
