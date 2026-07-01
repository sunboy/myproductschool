/**
 * Internal-user detection for analytics hygiene.
 *
 * Used to set the `is_internal` person property on identify so PostHog
 * insights/funnels can filter out the team's own usage (E2E runs, manual
 * QA, paywall audits) without it polluting real conversion numbers.
 *
 * Generous by design: ALL @hackproduct.com addresses count as internal,
 * including e2e+/paywall-audit/test-prefixed ones used by automated checks.
 */

const INTERNAL_EMAILS = new Set(['sandeeptnvs@gmail.com'])
const INTERNAL_DOMAIN_RE = /@hackproduct\.com$/i

export function isInternalUser(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  if (INTERNAL_EMAILS.has(normalized)) return true
  return INTERNAL_DOMAIN_RE.test(normalized)
}
