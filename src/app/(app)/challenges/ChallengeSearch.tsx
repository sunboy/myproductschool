'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

export function ChallengeSearch({ total }: { total: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep input in sync if URL changes externally (e.g. back/forward)
  useEffect(() => {
    setValue(searchParams.get('q') ?? '')
  }, [searchParams])

  const push = useCallback((q: string) => {
    const p = new URLSearchParams(searchParams.toString())
    if (q) p.set('q', q)
    else p.delete('q')
    router.push(`${pathname}?${p.toString()}`)
  }, [router, pathname, searchParams])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setValue(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => push(v), 300)
  }

  return (
    <div className="relative">
      <span
        className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]"
        style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
      >
        search
      </span>
      <input
        value={value}
        onChange={onChange}
        placeholder={`Search ${total} challenges…`}
        className="pl-9 pr-4 py-2.5 rounded-full bg-surface border border-outline-variant text-sm font-body text-on-surface outline-none focus:border-primary min-w-[220px]"
      />
    </div>
  )
}
