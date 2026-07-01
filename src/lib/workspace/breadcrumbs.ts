/**
 * Origin-aware workspace breadcrumbs.
 *
 * The `(workspace)` group rendered zero breadcrumbs and the only escape was a
 * bare `history.back()` arrow, so deep-linking or arriving via grading dropped
 * the user out of the app. This builds one identical, origin-aware trail used by
 * every workspace shell (FLOW / canvas / coding / analytics) so the chrome is
 * consistent and the exit is a real navigable Link.
 *
 * Convention (matches AppBreadcrumbs everywhere else): NO "Dashboard" root.
 * Every trail starts at its section hub.
 *   - default        → Practice > {title}
 *   - from a plan     → Study Plans > {plan} > {title}
 *   - from a domain   → Explore > {domain} > {title}
 */

import type { BreadcrumbItem } from '@/components/navigation/AppBreadcrumbs'

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

/** Turn a slug like "frame-like-a-pm" into "Frame Like A Pm" as a last resort. */
function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Build the origin-aware trail for a workspace challenge. The final item is the
 * challenge title (no href — it is the current page).
 */
export function workspaceBreadcrumbs(
  challengeTitle: string,
  origin: WorkspaceOrigin = {},
): BreadcrumbItem[] {
  const title = challengeTitle?.trim() || 'Challenge'

  if (origin.fromPlan) {
    const planLabel = origin.fromPlanTitle?.trim() || humanizeSlug(origin.fromPlan)
    return [
      { label: 'Study Plans', href: '/explore/plans' },
      { label: planLabel, href: `/explore/plans/${origin.fromPlan}` },
      { label: title },
    ]
  }

  if (origin.fromDomain) {
    const domainLabel = origin.fromDomainTitle?.trim() || humanizeSlug(origin.fromDomain)
    return [
      { label: 'Explore', href: '/explore' },
      { label: domainLabel, href: `/explore/domains/${origin.fromDomain}` },
      { label: title },
    ]
  }

  return [
    { label: 'Practice', href: '/challenges' },
    { label: title },
  ]
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
