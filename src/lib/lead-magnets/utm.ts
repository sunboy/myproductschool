// Client-safe UTM capture and persistence for /go/* lead-magnet pages.
//
// All functions guard against SSR (typeof window check). The session storage key
// 'hp_magnet_utm' merges on a first-touch-wins basis: once a param is stored it
// is never overwritten by a later navigation in the same browser session.
//
// 'hp_magnet_source' in localStorage carries the source_slug of the last /go/*
// page the visitor landed on. It is written by rememberMagnetSource() and read
// + cleared by the signup completion path to fire EVENT_SIGNUP_FROM_MAGNET.

const UTM_SESSION_KEY = 'hp_magnet_utm'
const MAGNET_SOURCE_LS_KEY = 'hp_magnet_source'

const UTM_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'ttclid',
] as const

/**
 * Reads UTM / click-id params from the current URL, merges them into
 * sessionStorage (first-touch-wins), and returns the merged set.
 *
 * Safe to call in a useEffect on every page render. No-ops on the server.
 */
export function captureUtmFromLocation(): Record<string, string> {
  if (typeof window === 'undefined') return {}

  const existing = getStoredUtm()
  const search = new URLSearchParams(window.location.search)
  const fresh: Record<string, string> = {}

  for (const param of UTM_PARAMS) {
    const value = search.get(param)
    if (value) fresh[param] = value
  }

  // First-touch-wins merge: only write params that are not already stored.
  const merged: Record<string, string> = { ...fresh, ...existing }

  if (Object.keys(merged).length > 0) {
    try {
      sessionStorage.setItem(UTM_SESSION_KEY, JSON.stringify(merged))
    } catch {
      // Storage full or unavailable — proceed without persisting.
    }
  }

  return merged
}

/**
 * Returns the UTM params stored in sessionStorage for the current session.
 * Returns an empty object if nothing is stored or storage is unavailable.
 */
export function getStoredUtm(): Record<string, string> {
  if (typeof window === 'undefined') return {}

  try {
    const raw = sessionStorage.getItem(UTM_SESSION_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, string>
    }
    return {}
  } catch {
    return {}
  }
}

/**
 * Writes the source_slug of the visited lead-magnet page to localStorage so
 * that the signup completion path can attribute the new account to the magnet.
 *
 * Overwrites any previous value (last-touch, intentional — the visitor just
 * engaged with this magnet so it is the strongest signal).
 */
export function rememberMagnetSource(slug: string): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(MAGNET_SOURCE_LS_KEY, slug)
  } catch {
    // Storage unavailable — skip silently.
  }
}

/**
 * Reads and clears the stored magnet source slug from localStorage.
 * Returns the slug string if one was stored, null otherwise.
 *
 * Called once at signup completion to attribute the new user and then remove
 * the attribution so it does not fire again on a subsequent re-register attempt.
 */
export function consumeMagnetSource(): string | null {
  if (typeof window === 'undefined') return null

  try {
    const slug = localStorage.getItem(MAGNET_SOURCE_LS_KEY)
    if (slug) localStorage.removeItem(MAGNET_SOURCE_LS_KEY)
    return slug
  } catch {
    return null
  }
}
