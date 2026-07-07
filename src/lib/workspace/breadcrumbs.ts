/**
 * Origin-aware workspace exit target.
 *
 * Breadcrumb trails were removed platform-wide in favor of a single back
 * affordance; what remains is the resolver that decides where that back
 * affordance points for a workspace challenge.
 */

export interface WorkspaceOrigin {
  /** Slug of the study plan the user came from (`from_plan` param). */
  fromPlan?: string | null
  /** Human label for the plan, if known (else the slug is humanized). */
  fromPlanTitle?: string | null
  /** Slug of the domain the user came from (`from_domain` param). */
  fromDomain?: string | null
  /** Human label for the domain, if known (else the slug is humanized). */
  fromDomainTitle?: string | null
}

/**
 * Resolve the single "exit / back" target for the workspace header. Prefers an
 * explicit `returnTo`, then the origin hub, then the Practice hub. Always a real
 * in-app href so the back affordance never falls out of the app.
 */
export function workspaceExitHref(
  origin: WorkspaceOrigin = {},
  returnTo?: string | null,
): string {
  if (returnTo && returnTo.startsWith('/')) return returnTo
  if (origin.fromPlan) return `/explore/plans/${origin.fromPlan}`
  if (origin.fromDomain) return `/explore/domains/${origin.fromDomain}`
  return '/challenges'
}
