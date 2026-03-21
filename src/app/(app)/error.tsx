'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">error</span>
      <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">Something went wrong</h2>
      <p className="text-on-surface-variant mb-6 max-w-sm">An unexpected error occurred. Please try again or go back to the dashboard.</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
        <Link href="/dashboard" className="px-4 py-2.5 bg-surface-container border border-outline-variant text-on-surface rounded-xl text-sm font-medium hover:bg-surface-container-high transition-colors">
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
