// Shared public-route definitions — the single source of truth for which
// paths are reachable without an authenticated session.
//
// IMPORTANT: This module MUST stay dependency-free (no server-only imports,
// no Supabase, no node:* APIs). It is imported by BOTH the edge proxy
// (src/proxy.ts) AND client components (V3AuthGate). Adding a server-only
// import here would break the edge runtime and/or leak into the client bundle.

// Marketing pages — accessible without any session. Prefix-matched.
export const MARKETING_ROUTES = [
  '/',
  '/v3',
  '/about',
  '/contact',
  '/security',
  '/waitlist',
  '/waitlist-quick',
  '/waitlist-flow',
  '/pricing',
  '/offer',
  '/privacy',
  '/terms',
  '/help',
  '/changelog',
  '/r',
  '/flow',
  '/hatch-preview',
  '/hatch-motion',
  '/role-transitions',
  '/uplevel',
  '/salary-negotiation',
  '/skills',
  '/companies',
  '/study-plans',
  '/practice',
  '/autopsies',
  '/autopsy',
  '/glossary',
  '/claude-code-analytics',
  '/interviews',
  '/alternatives',
  '/lp',
  '/landing',
  '/quiz',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/llms.txt',
  '/llms-full.txt',
  '/clone',
]

// Auth pages — reachable without a session. Prefix-matched.
export const AUTH_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/magic-link-sent',
]

// Marketing routes matched EXACTLY (not prefix-matched).
export const EXACT_MARKETING_ROUTES = ['/interview-prep']

// Shared public scorecard pages (and their OG/twitter image routes).
export const PUBLIC_SCORECARD_ROUTE =
  /^\/workspace\/challenges\/[^/]+\/share(?:\/[^/]+(?:\/(?:opengraph-image|twitter-image)[^/]*)?)?$/

const prefixMatch = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(route + '/')

/**
 * Returns true when a pathname can be reached without authentication.
 * Mirrors the classification the edge proxy uses for public buckets.
 *
 * Pass a bare pathname (no search/hash) for correct matching.
 */
export function isPublicPath(pathname: string): boolean {
  return (
    MARKETING_ROUTES.some((r) => prefixMatch(pathname, r)) ||
    AUTH_ROUTES.some((r) => prefixMatch(pathname, r)) ||
    EXACT_MARKETING_ROUTES.includes(pathname) ||
    PUBLIC_SCORECARD_ROUTE.test(pathname)
  )
}
