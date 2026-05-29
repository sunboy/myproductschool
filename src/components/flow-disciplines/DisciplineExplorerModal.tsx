'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AnimationModeProvider } from './context/AnimationModeContext'
import { Circuit } from './modal/Circuit'
import { InfoPanel } from './modal/InfoPanel'
import { ControlsBar } from './modal/ControlsBar'
import { Hero } from './modal/Hero'
import { CTA } from './modal/CTA'
import { ALL_DISCIPLINES } from '@/lib/data/flow-framework'
import type { Discipline, DisciplineId, FlowStepId } from '@/lib/data/flow-framework/types'

interface DisciplineExplorerModalProps {
  isOpen: boolean
  initialDisciplineId: DisciplineId
  onClose: () => void
}

export function DisciplineExplorerModal({
  isOpen,
  initialDisciplineId,
  onClose,
}: DisciplineExplorerModalProps) {
  const [activeDisciplineId, setActiveDisciplineId] = useState<DisciplineId>(initialDisciplineId)
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [activeNodeType, setActiveNodeType] = useState<'tradition' | 'competency' | 'step' | null>(null)
  const [focusedStep, setFocusedStep] = useState<FlowStepId | null>(null)
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync initial discipline
  useEffect(() => {
    setActiveDisciplineId(initialDisciplineId)
  }, [initialDisciplineId])

  useEffect(() => {
    if (!isOpen) return
    setActiveNodeId(null)
    setActiveNodeType(null)
    setFocusedStep(null)
  }, [isOpen])

  // Reset node selection when discipline changes
  useEffect(() => {
    setActiveNodeId(null)
    setActiveNodeType(null)
    setFocusedStep(null)
  }, [activeDisciplineId])

  // Scroll lock + focus trap
  useEffect(() => {
    if (!isOpen) return

    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus close button on open
    setTimeout(() => closeButtonRef.current?.focus(), 50)

    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  // ESC key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (!isOpen) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  const activeDiscipline: Discipline =
    ALL_DISCIPLINES.find((d) => d.id === activeDisciplineId) ?? ALL_DISCIPLINES[0]

  const handleNodeClick = (id: string, type: 'tradition' | 'competency' | 'step') => {
    if (activeNodeId === id) {
      setActiveNodeId(null)
      setActiveNodeType(null)
    } else {
      setActiveNodeId(id)
      setActiveNodeType(type)
    }
  }

  const handleStepFocus = (step: FlowStepId | null) => {
    setFocusedStep(step)
    if (step) {
      // Find the step node id in the active discipline and select it
      const stepNode = activeDiscipline.steps.find((s) => s.id === step)
      if (stepNode) {
        setActiveNodeId(stepNode.id)
        setActiveNodeType('step')
      }
    } else {
      setActiveNodeId(null)
      setActiveNodeType(null)
    }
  }

  const handleStepHeroClick = (step: FlowStepId) => {
    const next = focusedStep === step ? null : step
    handleStepFocus(next)
  }

  if (!mounted) return null

  return createPortal(
    <AnimationModeProvider>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
              aria-hidden="true"
            />

            {/* Panel */}
            <motion.div
              key="panel"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={`${activeDiscipline.name} discipline explorer`}
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-2 top-[2vh] bottom-[2vh] z-50 mx-auto flex flex-col overflow-hidden rounded-2xl shadow-2xl sm:inset-x-4 sm:top-[4vh] sm:bottom-[4vh]"
              style={{ maxWidth: 1180, background: '#1a2f26', border: '1px solid rgba(212,165,116,0.2)' }}
            >
              {/* Discipline tab bar */}
              <div
                className="flex items-end gap-1.5 px-3 pt-2 pb-0 shrink-0"
                style={{ background: '#162620', borderBottom: '1px solid rgba(212,165,116,0.15)' }}
              >
                <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
                  {ALL_DISCIPLINES.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setActiveDisciplineId(d.id)}
                      className="font-label text-[13px] px-3 py-1.5 rounded-t-md transition-all duration-200 border-b-2 -mb-px whitespace-nowrap"
                      style={
                        activeDisciplineId === d.id
                          ? { borderColor: '#d4a574', color: '#ffc580', background: '#1a2f26', fontWeight: 600 }
                          : { borderColor: 'transparent', color: 'rgba(245,240,230,0.45)' }
                      }
                    >
                      {d.tabLabel ?? d.name}
                    </button>
                  ))}
                </div>

                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  className="mb-0.5 p-1.5 rounded-full transition-colors duration-150 focus-visible:outline-2"
                  style={{ color: 'rgba(245,240,230,0.45)' }}
                  aria-label="Close discipline explorer"
                >
                  <span className="material-symbols-outlined text-[19px]" aria-hidden="true">
                    close
                  </span>
                </button>
              </div>

              {/* Hero bar */}
              <Hero
                discipline={activeDiscipline}
                focusedStep={focusedStep}
                onStepClick={handleStepHeroClick}
              />

              {/* Main content: Circuit + InfoPanel */}
              <div className="grid min-h-0 flex-1 grid-rows-[minmax(250px,54%)_minmax(0,1fr)] overflow-hidden lg:grid-cols-[minmax(0,1fr)_288px] lg:grid-rows-none">
                <div className="min-h-0 overflow-hidden p-2.5 sm:p-3" style={{ background: '#1a2f26' }}>
                  <div
                    className="flex h-full min-h-0 flex-col rounded-xl"
                    style={{
                      background: 'radial-gradient(circle at 50% 50%, rgba(212,165,116,0.08), rgba(22,38,32,0.08) 48%, rgba(22,38,32,0.18) 100%)',
                      border: '1px solid rgba(212,165,116,0.14)',
                    }}
                  >
                    <div
                      className="grid shrink-0 grid-cols-3 gap-2 px-3 py-2 font-label text-[10px] font-bold uppercase tracking-[0.14em] sm:px-4"
                      style={{ color: 'rgba(212,165,116,0.62)' }}
                    >
                      <span>Source ideas</span>
                      <span className="text-center">Trainable skills</span>
                      <span className="text-right">Scored FLOW moves</span>
                    </div>
                    <div className="min-h-0 flex-1 px-1 pb-2 sm:px-2">
                      <Circuit
                        discipline={activeDiscipline}
                        activeNodeId={activeNodeId}
                        onNodeClick={handleNodeClick}
                      />
                    </div>
                  </div>
                </div>

                <div
                  className="min-h-0 overflow-y-auto p-4 lg:w-72"
                  style={{ background: '#162620', borderLeft: '1px solid rgba(212,165,116,0.15)', borderTop: '1px solid rgba(212,165,116,0.15)' }}
                >
                  <InfoPanel
                    discipline={activeDiscipline}
                    selectedId={activeNodeId}
                    selectedType={activeNodeType}
                  />
                </div>
              </div>

              {/* Controls bar */}
              <ControlsBar
                focusedStep={focusedStep}
                onStepFocus={handleStepFocus}
              />

              {/* CTA */}
              <CTA disciplineId={activeDisciplineId} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AnimationModeProvider>,
    document.body
  )
}
