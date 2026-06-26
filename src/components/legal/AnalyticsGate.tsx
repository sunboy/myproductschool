'use client'

import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import { useEffect, useState } from 'react'
import {
  COOKIE_CHOICE_EVENT,
  COOKIE_CHOICE_STORAGE_KEY,
  isCookieChoice,
  type CookieChoice,
} from '@/lib/privacy/cookies'

function hasAnalyticsConsent() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(COOKIE_CHOICE_STORAGE_KEY) === 'all'
}

function eventChoice(event: Event): CookieChoice | null {
  const detail = (event as CustomEvent<unknown>).detail
  return typeof detail === 'string' && isCookieChoice(detail) ? detail : null
}

export function AnalyticsGate() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    queueMicrotask(() => setEnabled(hasAnalyticsConsent()))

    const onChoice = (event: Event) => {
      setEnabled(eventChoice(event) === 'all')
    }

    window.addEventListener(COOKIE_CHOICE_EVENT, onChoice)
    return () => window.removeEventListener(COOKIE_CHOICE_EVENT, onChoice)
  }, [])

  if (!enabled) return null

  return (
    <>
      <Analytics />
      {/* Google tag (gtag.js) — Google Ads conversion tracking. Loaded only
          after the user has accepted all cookies, alongside Vercel Analytics. */}
      <Script
        id="gtag-src"
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=AW-18255128704"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-18255128704');
        `}
      </Script>
    </>
  )
}
