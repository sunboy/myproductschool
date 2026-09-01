'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'

/**
 * Mobile-only fallback search (lg:hidden at the call site) — the global
 * top-nav pill (AppTopShell) is the one search surface everywhere else,
 * including live-filtering this same page on desktop. The mobile top bar
 * has no search box at all, so this stays as the only way to search
 * challenges on a phone.
 */
export function ChallengeSearch({ total, className }: { total: number; className?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const urlValue = searchParams.get('q') ?? ''
  // Controlled state instead of `key`-forced remount on every URL change —
  // remounting on each debounced push dropped focus/caret mid-typing.
  const [value, setValue] = useState(urlValue)
  useEffect(() => { setValue(urlValue) }, [urlValue])

  const push = useCallback((q: string) => {
    const p = new URLSearchParams(searchParams.toString())
    if (q) p.set('q', q)
    else p.delete('q')
    const query = p.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [router, pathname, searchParams])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setValue(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => push(v), 300)
  }

  return (
    <div className={`relative w-full ${className ?? 'sm:w-auto'}`}>
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
      <input
        value={value}
        onChange={onChange}
        placeholder={`Search ${total} challenges by title, company, technique, or tag…`}
        className="w-full min-w-0 rounded-full border border-hairline bg-card-bright py-2.5 pl-9 pr-4 font-body text-sm text-ink-strong outline-none placeholder:text-ink-muted focus:border-forest-600 sm:min-w-[220px]"
      />
    </div>
  )
}
