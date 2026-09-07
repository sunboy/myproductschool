// Cost guardrails shared by the sandbox host and LLM gateway.
//
// These are deliberately pure so every provisioning path applies the same
// bounds before it creates billable infrastructure or a spend-capped key.

const DEFAULT_TTL_SECONDS = 1_800
const MIN_TTL_SECONDS = 60

const DEFAULT_SESSION_BUDGET_USD = 0.5
const MIN_SESSION_BUDGET_USD = 0.01

function positiveNumber(value: string | number | undefined, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/**
 * Bound a requested sandbox lifetime by the operator-controlled maximum.
 * The maximum defaults to the existing 30-minute session policy, so an invalid
 * or accidentally large TTL cannot pin a Cloud Run instance indefinitely.
 */
export function resolveSessionTtlSeconds(
  requested: string | number | undefined,
  configuredMax: string | number | undefined = process.env.CC_MAX_SESSION_TTL_SECONDS,
): number {
  const max = Math.max(
    MIN_TTL_SECONDS,
    Math.floor(positiveNumber(configuredMax, DEFAULT_TTL_SECONDS)),
  )
  const wanted = Math.floor(positiveNumber(requested, DEFAULT_TTL_SECONDS))
  return Math.min(Math.max(wanted, MIN_TTL_SECONDS), max)
}

/**
 * Resolve the hard LiteLLM budget for one session. Raising the normal session
 * budget alone cannot silently raise the safety ceiling: an operator must also
 * raise CC_MAX_SESSION_BUDGET_USD explicitly.
 */
export function resolveSessionBudgetUsd(
  requested: string | number | undefined,
  configuredMax: string | number | undefined = process.env.CC_MAX_SESSION_BUDGET_USD,
): number {
  const max = Math.max(
    MIN_SESSION_BUDGET_USD,
    positiveNumber(configuredMax, DEFAULT_SESSION_BUDGET_USD),
  )
  const wanted = positiveNumber(requested, DEFAULT_SESSION_BUDGET_USD)
  return Math.round(Math.min(Math.max(wanted, MIN_SESSION_BUDGET_USD), max) * 100) / 100
}

/**
 * An uncapped provider key is permitted only for an explicit local/dev setup.
 * Reads process.env only when the caller omits the whole options object, so an
 * explicit `{ nodeEnv: undefined }` (e.g. from a test) is never silently
 * replaced by the live environment.
 */
export function allowsDirectProviderKey(options?: {
  nodeEnv?: string | undefined
  explicitFlag?: string | undefined
}): boolean {
  const nodeEnv = options ? options.nodeEnv : process.env.NODE_ENV
  const explicitFlag = options ? options.explicitFlag : process.env.CC_ALLOW_UNCAPPED_LOCAL
  return (nodeEnv === 'development' || nodeEnv === 'test') && explicitFlag === 'true'
}
