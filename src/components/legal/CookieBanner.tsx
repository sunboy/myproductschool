'use client'

import { useEffect, useState } from 'react'
import {
  COOKIE_CHOICE_EVENT,
  COOKIE_CHOICE_STORAGE_KEY,
  type CookieChoice,
  isCookieChoice,
} from '@/lib/privacy/cookies'

function dispatchCookieChoice(choice: CookieChoice) {
  window.dispatchEvent(new CustomEvent(COOKIE_CHOICE_EVENT, { detail: choice }))
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      const existing = window.localStorage.getItem(COOKIE_CHOICE_STORAGE_KEY)
      setVisible(!isCookieChoice(existing))
    })
  }, [])

  function choose(choice: CookieChoice) {
    window.localStorage.setItem(COOKIE_CHOICE_STORAGE_KEY, choice)
    dispatchCookieChoice(choice)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-outline-variant bg-surface-container-low/95 px-4 py-4 shadow-[0_-12px_40px_rgba(0,0,0,0.12)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-black text-on-surface">Cookie choices</p>
          <p className="mt-1 text-sm leading-6 text-on-surface-variant">
            HackProduct uses essential storage for login, security, billing, and core product state. Optional analytics help us see what needs fixing.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => choose('essential')}
            className="rounded-md border border-outline-variant px-4 py-2 text-sm font-black text-on-surface transition-colors hover:bg-surface-container"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => choose('all')}
            className="rounded-md bg-primary px-4 py-2 text-sm font-black text-on-primary transition-opacity hover:opacity-90"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}
