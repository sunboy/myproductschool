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
      {/* Drawer — absolute within the right pane, slides from right edge */}
      <div
        className={`absolute top-12 right-0 bottom-12 w-[320px] bg-white border-l border-outline-variant/30 z-40 transform transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ boxShadow: '-10px 0 30px -5px rgba(0,0,0,0.1)' }}
      >
        {/* Pull tab — visible when closed, indicates slideable */}
        {!open && (
          <div className="absolute top-4 -left-6 bg-white border border-r-0 border-outline-variant/30 rounded-l-lg py-2 px-1 text-on-surface-variant flex flex-col items-center gap-1 shadow-sm">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </div>
        )}

        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Framework Reference</h3>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Close drawer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            </button>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-surface-container-low">
            {MOCK_FRAMEWORKS.map((fw) => (
              <div key={fw.id} className="overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === fw.id ? null : fw.id)}
                  className="w-full text-left p-3 rounded-lg hover:bg-surface-container transition-colors border border-transparent hover:border-outline-variant/20"
                >
                  <div className="text-xs font-bold text-primary mb-1">{fw.name}</div>
                  <div className="text-[10px] text-on-surface-variant leading-tight">{fw.purpose}</div>
                </button>

                {expandedId === fw.id && (
                  <div className="px-3 pb-3 pt-0">
                    <div className="border-t border-outline-variant/20 pt-2 space-y-2">
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
      </div>

      {/* Backdrop — only covers the pane area when open */}
      {open && (
        <div
          className="absolute inset-0 z-30"
          onClick={onClose}
        />
      )}
    </>
  )
}
