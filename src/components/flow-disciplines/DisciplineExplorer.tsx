'use client'

import { useState, useCallback, useEffect } from 'react'
import { DisciplineCard } from './DisciplineCard'
import { DisciplineExplorerModal } from './DisciplineExplorerModal'
import type { DisciplineId } from '@/lib/data/flow-framework/types'

export function DisciplineExplorer() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<DisciplineId>('product_sense')

  const handleOpen = useCallback((disciplineId: DisciplineId) => {
    setSelectedDisciplineId(disciplineId)
    setIsOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Listen for the 'open-flow-explorer' event dispatched from the onboarding results screen
  useEffect(() => {
    function handleExternalOpen() {
      setIsOpen(true)
    }
    window.addEventListener('open-flow-explorer', handleExternalOpen)
    return () => window.removeEventListener('open-flow-explorer', handleExternalOpen)
  }, [])

  return (
    <>
      <DisciplineCard onClick={handleOpen} autoRotate={false} />
      <DisciplineExplorerModal
        isOpen={isOpen}
        initialDisciplineId={selectedDisciplineId}
        onClose={handleClose}
      />
    </>
  )
}
