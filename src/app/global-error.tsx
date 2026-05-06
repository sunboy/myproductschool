'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

const sentryEnabled = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN)

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    if (sentryEnabled) {
      Sentry.captureException(error)
    }
  }, [error])

  return (
    <html lang="en">
      <body style={{
        minHeight: '100vh',
        margin: 0,
        display: 'grid',
        placeItems: 'center',
        background: '#f9faf5',
        color: '#1b1d19',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <main style={{
          width: 'min(100% - 32px, 440px)',
          border: '1px solid rgba(27, 29, 25, 0.12)',
          borderRadius: 8,
          padding: 28,
          background: '#ffffff',
          boxShadow: '0 18px 60px rgba(27, 29, 25, 0.12)',
        }}>
          <p style={{
            margin: '0 0 8px',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#4a7c59',
          }}>
            HackProduct
          </p>
          <h1 style={{
            margin: '0 0 10px',
            fontSize: 24,
            lineHeight: 1.2,
          }}>
            Something went wrong
          </h1>
          <p style={{
            margin: '0 0 20px',
            fontSize: 15,
            lineHeight: 1.6,
            color: '#5e6258',
          }}>
            Try again, or return to the app.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => unstable_retry()}
              style={{
                border: 0,
                borderRadius: 999,
                padding: '10px 16px',
                background: '#4a7c59',
                color: '#ffffff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/dashboard"
              style={{
                borderRadius: 999,
                padding: '10px 16px',
                color: '#1b1d19',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Go to dashboard
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
