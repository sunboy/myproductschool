export interface RateLimitInput {
  key: string
  limit: number
  windowSec: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

interface ExternalLimitResponse {
  success: boolean
  remaining: number
  reset: number
}

interface ExternalLimiter {
  limit: (identifier: string) => Promise<ExternalLimitResponse>
}

type ExternalLimiterFactory = (limit: number, windowSec: number) => ExternalLimiter

interface MemoryBucket {
  count: number
  resetAtMs: number
}

interface CreateRateLimiterOptions {
  // useUpstash kept for backward-compat with tests; wired to getUpstashLimiter injection
  useUpstash?: boolean
  memoryFallback?: boolean
  now?: () => number
  warn?: (message: string) => void
  // Injection point for tests (or future external limiter)
  getUpstashLimiter?: ExternalLimiterFactory
}

function allowsMemoryFallbackEnv() {
  return process.env.RATE_LIMIT_MEMORY_FALLBACK === 'true'
}

function validateInput(input: RateLimitInput) {
  if (!input.key.trim()) throw new Error('rateLimit key is required')
  if (!Number.isInteger(input.limit) || input.limit < 1) {
    throw new Error('rateLimit limit must be a positive integer')
  }
  if (!Number.isInteger(input.windowSec) || input.windowSec < 1) {
    throw new Error('rateLimit windowSec must be a positive integer')
  }
}

export function createRateLimiter(options: CreateRateLimiterOptions = {}) {
  const buckets = new Map<string, MemoryBucket>()
  const now = options.now ?? Date.now
  const warn = options.warn ?? console.warn
  const memoryFallback = options.memoryFallback ?? (
    process.env.NODE_ENV !== 'production' || allowsMemoryFallbackEnv()
  )
  // useUpstash only has effect when getUpstashLimiter is also injected (for tests)
  const shouldUseExternal = (options.useUpstash ?? false) && Boolean(options.getUpstashLimiter)
  const getExternalLimiter = options.getUpstashLimiter
  let warnedMissingEnv = false
  let warnedExternalFailure = false

  function warnMissingEnvOnce() {
    if (warnedMissingEnv) return
    warnedMissingEnv = true
    warn('Upstash Redis env vars are missing; using in-memory rate limiting for this process.')
  }

  function warnFailureOnce(error: unknown) {
    if (warnedExternalFailure) return
    warnedExternalFailure = true
    const message = error instanceof Error ? error.message : String(error)
    warn(`Upstash rate limiting failed; using in-memory fallback for this request. ${message}`)
  }

  function memoryLimit(input: RateLimitInput): RateLimitResult {
    const currentTime = now()
    const bucketKey = `${input.limit}:${input.windowSec}:${input.key}`
    const existing = buckets.get(bucketKey)
    const resetAtMs = currentTime + input.windowSec * 1000
    const bucket = existing && existing.resetAtMs > currentTime
      ? existing
      : { count: 0, resetAtMs }

    bucket.count += 1
    buckets.set(bucketKey, bucket)

    const allowed = bucket.count <= input.limit
    return {
      allowed,
      remaining: Math.max(0, input.limit - bucket.count),
      resetAt: new Date(bucket.resetAtMs),
    }
  }

  return async function rateLimit(input: RateLimitInput): Promise<RateLimitResult> {
    validateInput(input)

    if (shouldUseExternal && getExternalLimiter) {
      try {
        const limiter = getExternalLimiter(input.limit, input.windowSec)
        const result = await limiter.limit(input.key)
        return {
          allowed: result.success,
          remaining: Math.max(0, result.remaining),
          resetAt: new Date(result.reset),
        }
      } catch (error) {
        if (!memoryFallback) throw error
        warnFailureOnce(error)
      }
    } else {
      if (!memoryFallback) {
        // Preserve original error message so existing tests match the regex
        throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required for rate limiting')
      }
      warnMissingEnvOnce()
    }

    return memoryLimit(input)
  }
}

export const rateLimit = createRateLimiter()
