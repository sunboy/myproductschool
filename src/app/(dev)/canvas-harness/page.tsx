'use client'

/**
 * Dev-only harness for verifying the Hatch canvas render path in a real browser.
 *
 * executeActions builds elements via Excalidraw's native convertToExcalidrawElements
 * (DOM text metrics → browser-only), so it cannot be unit-tested under tsx. This
 * page mounts the real canvas and exposes window helpers so the Playwright spec
 * e2e/canvas-native-render.spec.ts can drive a canned draw and read the scene back.
 * It 404s in production and is allowlisted in the proxy only outside production.
 */

import { useEffect, useRef, useState } from 'react'
import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
import { summarizeScene } from '@/lib/hatch/canvas-scene'
import type { CanvasAction } from '@/lib/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExcalidrawAPI = any

const ExcalidrawCanvas = dynamic(() => import('@/components/challenge/ExcalidrawCanvas'), {
  ssr: false,
})

declare global {
  interface Window {
    __canvasReady?: boolean
    __runDraw?: (actions: unknown[], discipline?: string) => Promise<unknown>
    __getScene?: () => unknown[]
    __summarize?: () => unknown
  }
}

export default function CanvasHarnessPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  const apiRef = useRef<ExcalidrawAPI | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Poll until the imperative Excalidraw API has been captured, then attach
    // the test hooks. ExcalidrawCanvas captures into apiRef via its excalidrawAPI
    // callback, which fires after the dynamic chunk mounts.
    let cancelled = false
    const tick = () => {
      if (cancelled) return
      if (apiRef.current) {
        window.__runDraw = async (actions: unknown[], discipline?: string) => {
          const { executeActions } = await import('@/components/challenge/canvasActionExecutor')
          return executeActions(actions as CanvasAction[], apiRef.current, [], discipline)
        }
        window.__getScene = () => (apiRef.current?.getSceneElements() as unknown[]) ?? []
        window.__summarize = () => summarizeScene((apiRef.current?.getSceneElements() as unknown[]) ?? [])
        window.__canvasReady = true
        setReady(true)
        return
      }
      setTimeout(tick, 100)
    }
    tick()
    return () => {
      cancelled = true
      delete window.__canvasReady
      delete window.__runDraw
      delete window.__getScene
      delete window.__summarize
    }
  }, [])

  return (
    <div className="h-screen w-screen bg-background">
      <div
        data-testid="harness-status"
        className="fixed left-2 top-2 z-50 rounded-full bg-surface-container-high px-3 py-1 font-label text-sm text-on-surface-variant"
      >
        canvas: {ready ? 'ready' : 'mounting'}
      </div>
      <ExcalidrawCanvas sessionId="harness" apiRef={apiRef} onSnapshot={() => {}} />
    </div>
  )
}
