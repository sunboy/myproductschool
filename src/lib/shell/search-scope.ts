export interface SearchScope {
  placeholder: string
  buildHref: (q: string) => string
}

export function searchScopeFor(pathname: string, total?: number): SearchScope {
  const enc = (q: string) => encodeURIComponent(q.trim())
  if (pathname.startsWith('/explore')) {
    return { placeholder: 'Search guides, companies, or skills', buildHref: q => (q.trim() ? `/explore?q=${enc(q)}` : '/explore') }
  }
  if (pathname.startsWith('/live-interviews')) {
    return { placeholder: 'Search companies or roles', buildHref: q => (q.trim() ? `/live-interviews?q=${enc(q)}` : '/live-interviews') }
  }
  const count = total ? `${total} challenges` : 'challenges'
  return { placeholder: `Search ${count} by title, company, technique`, buildHref: q => (q.trim() ? `/challenges?q=${enc(q)}` : '/challenges') }
}
