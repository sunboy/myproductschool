'use client'

import { useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  count?: number
  total?: number
  defaultOpen?: boolean
  children: React.ReactNode
  rightLink?: React.ReactNode
}

export function CollapsibleSection({
  title,
  count,
  total,
  defaultOpen = false,
  children,
  rightLink,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-outline-variant/30 last:border-b-0">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between py-3 px-0 text-left hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <span className="font-headline text-lg font-medium text-on-surface">{title}</span>
          {(count !== undefined || total !== undefined) && (
            <span className="px-2 py-0.5 rounded-full text-xs font-label font-bold bg-primary-container text-on-primary-container">
              {count ?? 0}/{total ?? 0} done
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {rightLink && !open && rightLink}
          <span
            className="material-symbols-outlined text-on-surface-variant transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'none' }}
          >
            expand_more
          </span>
        </div>
      </button>

      {open && (
        <div className="pb-4">
          {rightLink && (
            <div className="flex justify-end mb-2">{rightLink}</div>
          )}
          {children}
        </div>
      )}
    </div>
  )
}
