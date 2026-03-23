'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import type { GlossaryTerm } from '@/lib/types'

interface GlossaryTooltipProps {
  term: GlossaryTerm
  children: ReactNode
}

export function GlossaryTooltip({ term, children }: GlossaryTooltipProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <span
      ref={wrapperRef}
      className="relative inline"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        className="border-b border-dashed border-primary/50 cursor-help text-on-surface"
        onClick={() => setOpen((v) => !v)}
      >
        {children}
      </span>

      {open && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-72 p-4 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/40 text-left block">
          <span className="block font-headline font-semibold text-sm text-on-surface">
            {term.term}
          </span>
          {term.fullName && (
            <span className="block text-xs text-on-surface-variant mt-0.5">
              {term.fullName}
            </span>
          )}
          <span className="block text-xs text-on-surface-variant mt-2 leading-relaxed">
            {term.definition}
          </span>
          {term.conceptId && (
            <Link
              href={`/concepts/${term.conceptId}`}
              className="inline-flex items-center gap-1 mt-2 text-xs text-primary font-medium hover:underline"
            >
              <span className="material-symbols-outlined text-xs">open_in_new</span>
              Learn more
            </Link>
          )}
        </span>
      )}
    </span>
  )
}
