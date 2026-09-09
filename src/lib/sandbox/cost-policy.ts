// Cost guardrails shared by the sandbox host and LLM gateway.
//
// These are deliberately pure so every provisioning path applies the same
// bounds before it creates billable infrastructure or a spend-capped key.

const DEFAULT_TTL_SECONDS = 1_800
const MIN_TTL_SECONDS = 60

const DEFAULT_SESSION_BUDGET_USD = 0.5
const MIN_SESSION_BUDGET_USD = 0.01

// LiteLLM enforces spend caps per-request: it blocks a request from *starting*
// once cumulative spend is at/over budget, but lets a request that started
// under budget run to completion at whatever it costs. So a key minted with
// max_budget = the raw ceiling is always overshot by up to one turn's cost —
// observed on staging: +$0.0024 and +$0.0556 over a $0.49 cap. The largest
// observed single Sonnet 4.6 turn on staging was ~$0.059; 0.10 is ~1.7x that,
// so it is the default headroom reserved off the top of every minted key.
// Raising the session ceiling below roughly 2x this default makes the key
// nearly unusable (most/all of the budget would be reserved headroom) — pick
// a higher ceiling or lower CC_WORST_CASE_TURN_USD deliberately, not by
// accident.
// Live evidence 2026-09-07: a BigQuery-analysis session minted at ceiling-$0.10
// still overshot its $0.39 mint to $0.4510 before the gateway 429'd it — a
// $0.061 overshoot, i.e. tool-call turns in the analytics flow are pricier than
// a plain chat turn. Raised the default headroom to $0.15 to cover the largest
// observed single-turn cost with margin. This is a floor, not a proof: LiteLLM
// still lets one in-flight turn finish, so a genuinely huge single turn could
// exceed even this. If overshoot recurs above $0.15, raise CC_WORST_CASE_TURN_USD
// (or teach the flow to cap per-turn max_tokens) rather than assume it holds.
const DEFAULT_WORST_CASE_TURN_USD = 0.15

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
 * Resolve the value to pass as LiteLLM's `max_budget` when minting a session
 * key: the user-facing ceiling minus a worst-case-single-turn headroom, so a
 * turn that starts under budget cannot finish over the intended cap. Floored
 * at MIN_SESSION_BUDGET_USD (never zero/negative — an unusable key is worse
 * than a slightly-too-generous one) and never above the ceiling itself.
 *
 * This is an internal safety buffer, not a user-facing number — see
 * `resolveDisplayCeilingUsd` for what pricing copy and the usage meter should
 * show instead.
 */
export function resolveKeyMaxBudgetUsd(
  ceilingUsd: number,
  options?: { worstCaseTurnUsd?: string | number | undefined },
): number {
  const worstCaseTurnUsd = positiveNumber(
    options ? options.worstCaseTurnUsd : process.env.CC_WORST_CASE_TURN_USD,
    DEFAULT_WORST_CASE_TURN_USD,
  )
  const reduced = ceilingUsd - worstCaseTurnUsd
  const bounded = Math.min(Math.max(reduced, MIN_SESSION_BUDGET_USD), ceilingUsd)
  return Math.round(bounded * 100) / 100
}

/**
 * The ceiling is the number the user agreed to / sees — pricing copy, the
 * live usage meter, session recovery's stored value. The headroom subtracted
 * by `resolveKeyMaxBudgetUsd` is purely an internal enforcement detail; it
 * must never leak into user-facing copy. This helper exists so every display
 * surface can name its intent explicitly instead of reaching for the raw
 * ceiling value directly.
 */
export function resolveDisplayCeilingUsd(ceilingUsd: number): number {
  return ceilingUsd
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
