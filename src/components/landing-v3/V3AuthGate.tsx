'use client'

import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthForm } from '@/components/auth/AuthForm'

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

export function V3AuthGate() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [modalTarget, setModalTarget] = useState<string | null>(null)

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

      if (!path || isAuthenticated) {
        return
      }

      event.preventDefault()
      const AUTH_PATHS = ['/login', '/signup', '/register']
      setModalTarget(AUTH_PATHS.includes(path) ? '/dashboard' : path)
    }

    document.addEventListener('click', onClick, { capture: true })

    return () => {
      document.removeEventListener('click', onClick, { capture: true })
    }
  }, [isAuthenticated])

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
        aria-label="Close login modal"
        className="v3-auth-modal-backdrop"
        onClick={closeModal}
        type="button"
      />
      <div className="v3-auth-modal-panel">
        <button
          aria-label="Close login modal"
          className="v3-auth-modal-close"
          onClick={closeModal}
          type="button"
        >
          <X aria-hidden="true" />
        </button>
        <div className="v3-auth-modal-copy">
          <p>Sign in to continue</p>
          <h2 id="v3-auth-modal-title">Train with Hatch in one connected loop.</h2>
        </div>
        <div className="v3-auth-modal-form">
          <AuthForm mode="login" redirectTo={modalTarget} />
        </div>
      </div>
    </div>
  )
}
