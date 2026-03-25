'use client'
import { useState } from 'react'
import { MOCK_FRAMEWORKS } from '@/lib/mock-data/frameworks'

interface FrameworkDrawerProps {
  open: boolean
  onClose: () => void
}

export function FrameworkDrawer({ open, onClose }: FrameworkDrawerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <>
      {/* Backdrop */}
      {open && <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-surface border-l border-outline-variant shadow-lg z-50 transform transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24", fontSize: 20 }}
            >
              lightbulb
            </span>
            <h3 className="font-headline font-semibold text-on-surface">Framework Reference</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-surface-container-high transition-colors"
            aria-label="Close drawer"
          >
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* Scrollable list */}
        <div className="overflow-y-auto h-[calc(100%-64px)] p-4 space-y-2">
          {MOCK_FRAMEWORKS.map((fw) => (
            <div key={fw.id} className="bg-surface-container rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === fw.id ? null : fw.id)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-surface-container-high transition-colors"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <span className="font-label font-semibold text-sm text-on-surface block">{fw.name}</span>
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">{fw.purpose}</p>
                </div>
                <span
                  className={`material-symbols-outlined text-on-surface-variant flex-shrink-0 transition-transform duration-200 ${
                    expandedId === fw.id ? 'rotate-180' : ''
                  }`}
                  style={{ fontSize: 18 }}
                >
                  expand_more
                </span>
              </button>

              {expandedId === fw.id && (
                <div className="px-3 pb-3 pt-0">
                  <div className="border-t border-outline-variant pt-2 space-y-2">
                    <p className="text-xs font-label font-semibold text-on-surface-variant uppercase tracking-wider">
                      Steps
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5">
                      {fw.steps.map((step, i) => (
                        <li key={i} className="text-xs text-on-surface leading-snug">
                          {step}
                        </li>
                      ))}
                    </ol>
                    <div className="mt-2 bg-primary-fixed rounded-lg p-2.5">
                      <p className="text-xs italic text-on-surface-variant leading-snug">{fw.when_to_use}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
