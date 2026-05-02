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

  // Reset node selection when discipline changes
  useEffect(() => {
    setActiveNodeId(null)
    setActiveNodeType(null)
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
              className="fixed inset-x-4 top-[5vh] bottom-[5vh] z-50 mx-auto flex flex-col rounded-2xl overflow-hidden bg-surface border border-outline-variant shadow-2xl"
              style={{ maxWidth: 1120 }}
            >
              {/* Discipline tab bar */}
              <div className="flex items-center gap-0.5 px-4 pt-3 pb-0 border-b border-outline-variant bg-surface-container-low shrink-0">
                {ALL_DISCIPLINES.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setActiveDisciplineId(d.id)}
                    className={`font-label text-xs px-4 py-2.5 rounded-t-lg transition-all duration-200 border-b-2 -mb-px ${
                      activeDisciplineId === d.id
                        ? 'border-primary text-primary bg-surface font-semibold'
                        : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {d.tabLabel ?? d.name}
                  </button>
                ))}

                {/* Spacer + close */}
                <div className="flex-1" />
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  className="mb-1 p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary"
                  aria-label="Close discipline explorer"
                >
                  <span className="material-symbols-outlined text-xl" aria-hidden="true">
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
              <div className="flex flex-1 overflow-hidden">
                {/* Circuit — takes majority of width */}
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                  <Circuit
                    discipline={activeDiscipline}
                    activeNodeId={activeNodeId}
                    onNodeClick={handleNodeClick}
                  />
                </div>

                {/* Info panel — fixed-width sidebar */}
                <div
                  className="w-80 shrink-0 border-l border-outline-variant overflow-y-auto p-5"
                  style={{ background: 'rgba(245,241,234,0.5)' }}
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
