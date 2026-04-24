'use client'

import dynamic from 'next/dynamic'
import { useRef, useCallback, useEffect } from 'react'
import type { CanvasAnnotation } from '@/lib/types'
import '@excalidraw/excalidraw/index.css'
import './excalidraw-theme.css'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExcalidrawAPI = any

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((m) => m.Excalidraw),
  { ssr: false }
)

interface ExcalidrawCanvasProps {
  sessionId: string
  onSnapshot: (scene: { elements: unknown[]; appState: unknown }) => void
  onElementsAdded?: (count: number) => void
  initialData?: { elements?: unknown[]; appState?: unknown }
  readOnly?: boolean
  annotations?: CanvasAnnotation[]
  apiRef?: React.MutableRefObject<ExcalidrawAPI | null>
}

export default function ExcalidrawCanvas({
  sessionId: _sessionId,
  onSnapshot,
  onElementsAdded,
  initialData,
  readOnly = false,
  annotations = [],
  apiRef: externalApiRef,
}: ExcalidrawCanvasProps) {
  const internalApiRef = useRef<ExcalidrawAPI | null>(null)
  const apiRef = externalApiRef ?? internalApiRef
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevElementCount = useRef(0)

  useEffect(() => {
    if (!apiRef.current) return
    fetch('/excalidraw-libraries/bundled-library.json')
      .then((r) => r.json())
      .then((lib) => {
        apiRef.current?.updateLibrary({ libraryItems: lib.libraryItems, merge: false })
      })
      .catch(() => {/* non-fatal */})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiRef.current])

  useEffect(() => {
    if (!readOnly || !annotations.length || !apiRef.current) return
    const existing = apiRef.current.getSceneElements() as Array<{
      x?: number; y?: number; width?: number; height?: number
      label?: { text?: string }; text?: string
    }>
    const annotationEls = annotations.map((ann, i) => {
      const target = existing.find(
        (el) => el.label?.text === ann.target_label || el.text === ann.target_label
      )
      const x = target ? (target.x ?? 0) + (target.width ?? 0) + 10 : 100 + i * 160
      const y = target ? (target.y ?? 0) : 100 + i * 60
      return {
        id: `annotation-${i}`,
        type: 'text' as const,
        x, y, width: 200, height: 40,
        text: `⚠ ${ann.text}`,
        fontSize: 13, fontFamily: 1,
        strokeColor: '#92400e',
        backgroundColor: '#fef3c7',
        fillStyle: 'solid' as const,
        roughness: 0, opacity: 100,
        version: 1,
        versionNonce: Math.floor(Math.random() * 1e9),
        isDeleted: false, groupIds: [], frameId: null,
        roundness: null, boundElements: null,
        updated: Date.now(), link: null, locked: true, angle: 0,
      }
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiRef.current.updateScene({ elements: [...existing, ...annotationEls] as any })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, annotations])

  const handleChange = useCallback(
    (elements: readonly unknown[]) => {
      if (readOnly) return
      const count = elements.length
      if (count > prevElementCount.current) {
        onElementsAdded?.(count - prevElementCount.current)
      }
      prevElementCount.current = count

      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
        if (!apiRef.current) return
        const scene = {
          elements: apiRef.current.getSceneElements() as unknown[],
          appState: apiRef.current.getAppState() as unknown,
        }
        onSnapshot(scene)
      }, 2000)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readOnly, onSnapshot, onElementsAdded]
  )

  // Per Excalidraw docs: just give it a parent with explicit dimensions.
  // .hatch-canvas scopes our theme overrides so they don't leak to other pages.
  return (
    <div className="hatch-canvas" style={{ height: '100%', width: '100%' }}>
      <Excalidraw
        excalidrawAPI={(api: ExcalidrawAPI) => { apiRef.current = api }}
        onChange={handleChange}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialData={{
          ...(initialData ?? {}),
          appState: {
            // Default new text to Nunito (FONT_FAMILY = 6) — matches the app font.
            currentItemFontFamily: 6,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...((initialData?.appState as any) ?? {}),
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any}
        viewModeEnabled={readOnly}
        UIOptions={{
          canvasActions: {
            export: false,
            saveAsImage: false,
            loadScene: false,
            clearCanvas: !readOnly,
          },
        }}
      />
    </div>
  )
}
