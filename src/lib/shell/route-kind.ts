export type RouteKind = 'hub' | 'reader' | 'workspace' | 'interview-room'
export type NavKey = 'home' | 'practice' | 'library' | 'progress'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function routeKind(pathname: string): RouteKind {
  if (pathname.startsWith('/workspace/')) return 'workspace'
  if (/^\/explore\/modules\/[^/]+/.test(pathname)) return 'reader'
  if (/^\/explore\/autopsies\/[^/]+\/stories\/[^/]+/.test(pathname)) return 'reader'
  const live = pathname.match(/^\/live-interviews\/([^/]+)(\/.*)?$/)
  if (live && UUID.test(live[1]) && !(live[2] ?? '').startsWith('/debrief')) return 'interview-room'
  return 'hub'
}

export function forcedRail(pathname: string): boolean {
  return routeKind(pathname) !== 'hub'
}

export function activeNavKey(pathname: string): NavKey | null {
  if (pathname === '/' || pathname.startsWith('/dashboard')) return 'home'
  if (pathname.startsWith('/challenges') || pathname.startsWith('/workspace') || pathname.startsWith('/live-interviews')) return 'practice'
  if (pathname.startsWith('/explore')) return 'library'
  if (pathname.startsWith('/progress')) return 'progress'
  return null
}
