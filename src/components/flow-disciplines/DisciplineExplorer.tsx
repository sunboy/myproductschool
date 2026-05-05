'use client'

import { useState, useCallback } from 'react'
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

  return (
    <>
      <DisciplineCard onClick={handleOpen} />
      <DisciplineExplorerModal
        isOpen={isOpen}
        initialDisciplineId={selectedDisciplineId}
        onClose={handleClose}
      />
    </>
  )
}
