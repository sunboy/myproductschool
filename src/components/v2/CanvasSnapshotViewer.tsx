'use client'

import dynamic from 'next/dynamic'
import type { BinaryFiles } from '@excalidraw/excalidraw/types'

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then(m => m.Excalidraw),
  { ssr: false, loading: () => <div className="h-80 bg-surface-container-low animate-pulse rounded-xl" /> }
)

interface Annotation {
  target_label: string
  text: string
  severity?: string | null
}

interface CanvasSnapshotViewerProps {
  snapshot: Record<string, unknown>
  annotations?: Annotation[] | null
}

function severityColor(severity?: string | null) {
  if (severity === 'critical') return { dot: 'bg-error', badge: 'bg-error/10 text-error border-error/20' }
  if (severity === 'suggestion') return { dot: 'bg-primary', badge: 'bg-primary-container text-on-primary-container border-primary/20' }
  return { dot: 'bg-tertiary', badge: 'bg-tertiary-container text-on-secondary-container border-tertiary/20' }
}

export function CanvasSnapshotViewer({ snapshot, annotations }: CanvasSnapshotViewerProps) {
  if (!snapshot || Object.keys(snapshot).length === 0) return null

  const elements = Array.isArray(snapshot.elements) ? snapshot.elements : []
  const appState = (snapshot.appState && typeof snapshot.appState === 'object') ? snapshot.appState as Record<string, unknown> : {}
  const files = (snapshot.files && typeof snapshot.files === 'object') ? snapshot.files as BinaryFiles : {} as BinaryFiles

  const initialData = {
    elements,
    appState: { ...appState, viewModeEnabled: true },
    files,
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl overflow-hidden border border-outline-variant bg-surface-container-low" style={{ height: '400px' }}>
        <Excalidraw
          initialData={initialData}
          viewModeEnabled={true}
          UIOptions={{ canvasActions: { export: false, saveToActiveFile: false, saveAsImage: false, loadScene: false, clearCanvas: false, changeViewBackgroundColor: false, toggleTheme: false } }}
        />
      </div>

      {annotations && annotations.length > 0 && (
        <div className="space-y-2">
          <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
            Hatch annotations
          </p>
          {annotations.map((ann, i) => {
            const colors = severityColor(ann.severity)
            return (
              <div
                key={i}
                className={`flex gap-3 items-start rounded-xl border px-4 py-3 ${colors.badge}`}
              >
                <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${colors.dot}`} />
                <div className="min-w-0">
                  <p className="font-label text-xs font-semibold mb-0.5">{ann.target_label}</p>
                  <p className="font-body text-sm leading-relaxed">{ann.text}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
