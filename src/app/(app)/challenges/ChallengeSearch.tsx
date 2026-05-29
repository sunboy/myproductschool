'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useRef } from 'react'

export function ChallengeSearch({ total }: { total: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentValue = searchParams.get('q') ?? ''

  const push = useCallback((q: string) => {
    const p = new URLSearchParams(searchParams.toString())
    if (q) p.set('q', q)
    else p.delete('q')
    const query = p.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [router, pathname, searchParams])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => push(v), 300)
  }

  return (
    <div className="relative w-full sm:w-auto">
      <span
        className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]"
        style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
      >
        search
      </span>
      <input
        key={currentValue}
        defaultValue={currentValue}
        onChange={onChange}
        placeholder={`Search ${total} challenges…`}
        className="w-full min-w-0 rounded-full border border-outline-variant bg-surface py-2.5 pl-9 pr-4 font-body text-sm text-on-surface outline-none focus:border-primary sm:min-w-[220px]"
      />
    </div>
  )
}
