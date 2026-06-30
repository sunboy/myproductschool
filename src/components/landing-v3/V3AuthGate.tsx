'use client'

import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthForm } from '@/components/auth/AuthForm'
import { isPublicPath } from '@/lib/routes/public'

function getInternalPath(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute('href')

  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return null
  }

  const url = new URL(anchor.href)

  if (url.origin !== window.location.origin) {
    return null
  }

  if (url.pathname === window.location.pathname && url.hash) {
    return null
  }

  return `${url.pathname}${url.search}${url.hash}`
}

type AuthModalMode = 'login' | 'signup'

export function V3AuthGate() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [modalTarget, setModalTarget] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<AuthModalMode>('login')

  const closeModal = useCallback(() => {
    setModalTarget(null)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setIsAuthenticated(Boolean(data.session))
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session))
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const anchor = (event.target as Element | null)?.closest('a[href]') as HTMLAnchorElement | null

      if (!anchor || anchor.target || anchor.dataset.authModalIgnore === 'true') {
        return
      }

      const path = getInternalPath(anchor)

      if (!path) {
        return
      }

      // Let authenticated users and any public destination navigate normally.
      // Only genuinely gated app routes (/dashboard, /challenges, /explore/*,
      // /progress, …) fall through to the login modal. Use the bare pathname
      // for the public check; `path` carries search/hash for the modal target.
      const pathname = new URL(anchor.href).pathname
      if (isAuthenticated || isPublicPath(pathname)) {
        return
      }

      event.preventDefault()
      setModalMode('login')
      setModalTarget(path)
    }

    document.addEventListener('click', onClick, { capture: true })

    return () => {
      document.removeEventListener('click', onClick, { capture: true })
    }
  }, [isAuthenticated])

  // Intentional open trigger: any CTA can dispatch `open-auth-modal` to open
  // the modal directly (defaults to signup) without navigating away.
  useEffect(() => {
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<{ mode?: AuthModalMode; next?: string }>).detail
      setModalMode(detail?.mode ?? 'signup')
      setModalTarget(detail?.next ?? '/dashboard')
    }

    window.addEventListener('open-auth-modal', onOpen)

    return () => {
      window.removeEventListener('open-auth-modal', onOpen)
    }
  }, [])

  useEffect(() => {
    if (!modalTarget) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeModal()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [closeModal, modalTarget])

  if (!modalTarget) {
    return null
  }

  return (
    <div
      aria-labelledby="v3-auth-modal-title"
      aria-modal="true"
      className="v3-auth-modal"
      role="dialog"
    >
      <button
        aria-label="Close"
        className="v3-auth-modal-backdrop"
        onClick={closeModal}
        type="button"
      />
      <div className="v3-auth-modal-panel">
        <button
          aria-label="Close"
          className="v3-auth-modal-close"
          onClick={closeModal}
          type="button"
        >
          <X aria-hidden="true" />
        </button>
        <div className="v3-auth-modal-copy">
          <p>{modalMode === 'signup' ? 'Create your account' : 'Sign in to continue'}</p>
          <h2 id="v3-auth-modal-title">
            {modalMode === 'signup'
              ? 'Start free today.'
              : 'Train with Hatch in one connected loop.'}
          </h2>
        </div>
        <div className="v3-auth-modal-form">
          <AuthForm mode={modalMode} redirectTo={modalTarget} />
        </div>
      </div>
    </div>
  )
}
