import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

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

interface UpstashLimitResponse {
  success: boolean
  remaining: number
  reset: number
}

interface UpstashLimiter {
  limit: (identifier: string) => Promise<UpstashLimitResponse>
}

type UpstashLimiterFactory = (limit: number, windowSec: number) => UpstashLimiter

interface MemoryBucket {
  count: number
  resetAtMs: number
}

interface CreateRateLimiterOptions {
  useUpstash?: boolean
  memoryFallback?: boolean
  now?: () => number
  warn?: (message: string) => void
  getUpstashLimiter?: UpstashLimiterFactory
}

const upstashLimiters = new Map<string, UpstashLimiter>()

function hasUpstashEnv() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

function allowsMemoryFallbackEnv() {
  return process.env.RATE_LIMIT_MEMORY_FALLBACK === 'true'
}

function defaultUpstashLimiter(limit: number, windowSec: number): UpstashLimiter {
  const cacheKey = `${limit}:${windowSec}`
  const cached = upstashLimiters.get(cacheKey)
  if (cached) return cached

  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s` as `${number} s`),
    prefix: 'hackproduct:ratelimit',
  })

  upstashLimiters.set(cacheKey, limiter)
  return limiter
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
  const shouldUseUpstash = options.useUpstash ?? hasUpstashEnv()
  const getUpstashLimiter = options.getUpstashLimiter ?? defaultUpstashLimiter
  let warnedMissingEnv = false
  let warnedUpstashFailure = false

  function warnMissingEnvOnce() {
    if (warnedMissingEnv) return
    warnedMissingEnv = true
    warn('Upstash Redis env vars are missing; using in-memory rate limiting for this process.')
  }

  function warnFailureOnce(error: unknown) {
    if (warnedUpstashFailure) return
    warnedUpstashFailure = true
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

    if (shouldUseUpstash) {
      try {
        const limiter = getUpstashLimiter(input.limit, input.windowSec)
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
        throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required for rate limiting')
      }
      warnMissingEnvOnce()
    }

    return memoryLimit(input)
  }
}

export const rateLimit = createRateLimiter()
