import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { consumesAnalyticsTrial } from '@/lib/sandbox/provision-session'

// Regression guard for the exact bug flagged during the Casebook Loop
// defect-1 fix: `markActiveAndMeter` decides whether a session consumes a
// `claude_code_sessions` analytics-trial unit purely off `sessionKind`. That
// decision was previously verified only LIVE (Phase 3) and had no mechanical
// guard — a new session kind (or a call site that forgets to pass one) could
// silently start double-metering, or the analytics lab could silently STOP
// metering, with CI fully green. This test pins the allowlist's outputs so a
// regression fails loudly instead of shipping.
//
// consumesAnalyticsTrial is an ALLOWLIST, not a negative check (see the long
// comment above ANALYTICS_TRIAL_KINDS in provision-session.ts) — a new kind
// must be added there deliberately. This test is what makes "deliberately"
// enforceable: adding a new kind without also deciding its trial-metering
// behavior here will not fail this test (that's fine — the design says
// under-counting is the safe default), but changing an EXISTING kind's
// behavior by accident will.
describe('consumesAnalyticsTrial', () => {
  it('drill (Practice) sessions do NOT consume an analytics-trial unit', () => {
    // Practice is metered separately by cc_drill_sessions_weekly. Counting it
    // here too would burn a free learner's only analytics-lab unit on their
    // first practice session (see provision-session.ts's ANALYTICS_TRIAL_KINDS
    // comment for the full failure mode).
    assert.equal(consumesAnalyticsTrial('drill'), false)
  })

  it('casebook_case (Challenge) sessions do NOT consume an analytics-trial unit', () => {
    // Challenge has its own cc_case_attempts_total allowance. This is the
    // exact kind that motivated the ALLOWLIST rewrite: an earlier negative
    // check (`sessionKind !== 'drill'`) let 'case'-like kinds fall through
    // and double-meter by accident.
    assert.equal(consumesAnalyticsTrial('casebook_case'), false)
  })

  it("'case' (the analytics lab, explicit) MUST keep consuming an analytics-trial unit", () => {
    assert.equal(consumesAnalyticsTrial('case'), true)
  })

  it('undefined (the analytics lab route, which omits sessionKind) MUST keep consuming an analytics-trial unit', () => {
    // THE TRAP: the original analytics-lab route never passes sessionKind at
    // all. That omission IS the analytics lab and must resolve to the same
    // metering behavior as the explicit 'case' kind above. Regressing the
    // `?? 'case'` fallback (e.g. to default a bare `undefined` to something
    // that does not consume the trial) would silently stop metering every
    // analytics-lab session with CI green — this assertion is what catches
    // that.
    assert.equal(consumesAnalyticsTrial(undefined), true)
  })
})
