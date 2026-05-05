'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type TurnstileTheme = 'auto' | 'light' | 'dark'

interface TurnstileRenderOptions {
  sitekey: string
  theme?: TurnstileTheme
  callback?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
}

interface TurnstileApi {
  ready: (callback: () => void) => void
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string
  reset: (widgetId?: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

interface TurnstileWidgetProps {
  onToken: (token: string) => void
  resetSignal?: number
  className?: string
  theme?: TurnstileTheme
}

export function isTurnstileClientEnabled() {
  return Boolean(TURNSTILE_SITE_KEY)
}

export function TurnstileWidget({
  onToken,
  resetSignal = 0,
  className,
  theme = 'auto',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const renderedRef = useRef(false)
  const onTokenRef = useRef(onToken)
  const [scriptReady, setScriptReady] = useState(false)

  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !scriptReady || !containerRef.current || renderedRef.current) return
    const turnstile = window.turnstile
    if (!turnstile) return

    turnstile.ready(() => {
      if (!containerRef.current || renderedRef.current) return
      widgetIdRef.current = turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme,
        callback: token => onTokenRef.current(token),
        'expired-callback': () => onTokenRef.current(''),
        'error-callback': () => onTokenRef.current(''),
      })
      renderedRef.current = true
    })

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
      widgetIdRef.current = null
      renderedRef.current = false
    }
  }, [scriptReady, theme])

  useEffect(() => {
    onTokenRef.current('')
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
    }
  }, [resetSignal])

  if (!TURNSTILE_SITE_KEY) return null

  return (
    <div className={className}>
      <Script
        src={TURNSTILE_SCRIPT_SRC}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={containerRef} />
    </div>
  )
}
