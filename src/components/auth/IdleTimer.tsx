'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const DEFAULT_TIMEOUT_MIN = 30
const WARNING_SECONDS = 60

function idleTimeoutMs() {
  const raw = process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MIN
  const minutes = raw ? Number(raw) : DEFAULT_TIMEOUT_MIN
  if (!Number.isFinite(minutes) || minutes <= 0) return null
  return minutes * 60 * 1000
}

export function IdleTimer() {
  const router = useRouter()
  const timeoutMs = idleTimeoutMs()
  const warningOpenRef = useRef(false)
  const warningTimerRef = useRef<number | null>(null)
  const countdownTimerRef = useRef<number | null>(null)
  const [warningOpen, setWarningOpen] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS)
  const [resetCount, setResetCount] = useState(0)

  useEffect(() => {
    warningOpenRef.current = warningOpen
  }, [warningOpen])

  useEffect(() => {
    if (!timeoutMs) return
    const activeTimeoutMs = timeoutMs

    function clearWarningTimer() {
      if (warningTimerRef.current !== null) {
        window.clearTimeout(warningTimerRef.current)
        warningTimerRef.current = null
      }
    }

    function clearCountdownTimer() {
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current)
        countdownTimerRef.current = null
      }
    }

    async function signOutForIdle() {
      clearWarningTimer()
      clearCountdownTimer()
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login?reason=idle')
      router.refresh()
    }

    function openWarning() {
      setSecondsLeft(WARNING_SECONDS)
      setWarningOpen(true)
      clearCountdownTimer()
      countdownTimerRef.current = window.setInterval(() => {
        setSecondsLeft(current => {
          if (current <= 1) {
            void signOutForIdle()
            return 0
          }
          return current - 1
        })
      }, 1000)
    }

    function scheduleWarning() {
      clearWarningTimer()
      warningTimerRef.current = window.setTimeout(openWarning, activeTimeoutMs)
    }

    function markActivity() {
      if (warningOpenRef.current) return
      scheduleWarning()
    }

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
    ]
    activityEvents.forEach(event => window.addEventListener(event, markActivity, { passive: true }))

    scheduleWarning()

    return () => {
      clearWarningTimer()
      clearCountdownTimer()
      activityEvents.forEach(event => window.removeEventListener(event, markActivity))
    }
  }, [router, timeoutMs, resetCount])

  function staySignedIn() {
    setWarningOpen(false)
    setSecondsLeft(WARNING_SECONDS)
    setResetCount(value => value + 1)
  }

  async function signOutNow() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login?reason=idle')
    router.refresh()
  }

  if (!warningOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="idle-timeout-title"
        className="w-full max-w-[420px] rounded-[22px] border border-outline-variant/50 bg-background p-5 shadow-[0_24px_70px_rgba(20,18,14,0.28)]"
      >
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-fixed text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            timer
          </span>
          <div>
            <h2 id="idle-timeout-title" className="font-headline text-xl font-bold leading-tight text-on-surface">
              Still working?
            </h2>
            <p className="mt-1 text-sm font-body leading-relaxed text-on-surface-variant">
              You will be signed out in {secondsLeft}s.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={signOutNow}
            className="rounded-2xl border border-outline-variant/70 px-4 py-2.5 text-sm font-label font-bold text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            Sign out
          </button>
          <button
            type="button"
            onClick={staySignedIn}
            className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-label font-bold text-on-primary transition-opacity hover:opacity-95"
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  )
}
