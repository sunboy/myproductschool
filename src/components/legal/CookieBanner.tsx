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
    <div className="fixed inset-x-2 bottom-2 z-[70] rounded-2xl border border-outline-variant bg-surface-container-low/95 px-3 py-3 shadow-[0_-10px_34px_rgba(0,0,0,0.12)] backdrop-blur sm:inset-x-0 sm:bottom-0 sm:rounded-none sm:border-x-0 sm:border-b-0 sm:px-4 sm:py-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-[13px] font-black text-on-surface sm:text-sm">Cookie choices</p>
          <p className="mt-0.5 text-xs leading-5 text-on-surface-variant sm:mt-1 sm:text-sm sm:leading-6">
            HackProduct uses essential storage for login, security, billing, and core product state. Optional analytics help us see what needs fixing.
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:flex-row">
          <button
            type="button"
            onClick={() => choose('essential')}
            className="rounded-md border border-outline-variant px-3 py-2 text-xs font-black text-on-surface transition-colors hover:bg-surface-container sm:px-4 sm:text-sm"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => choose('all')}
            className="rounded-md bg-primary px-3 py-2 text-xs font-black text-on-primary transition-opacity hover:opacity-90 sm:px-4 sm:text-sm"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}
