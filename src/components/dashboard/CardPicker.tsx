'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { restoreCard } from '@/app/actions/dashboard'
import { CARD_CATALOG } from '@/lib/dashboard-cards'

interface CardPickerProps {
  dismissedCards: string[]
  onClose: () => void
}

export function CardPicker({ dismissedCards, onClose }: CardPickerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const available = CARD_CATALOG.filter(c => dismissedCards.includes(c.id))

  function handleAdd(cardId: string) {
    startTransition(async () => {
      await restoreCard(cardId)
      router.refresh()
      onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-lg w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
          <h2 className="font-headline font-bold text-on-surface text-lg">Add cards</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {available.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">check_circle</span>
              <p className="text-on-surface-variant font-label text-sm">All cards are showing!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {available.map(card => (
                <div
                  key={card.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors"
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-fixed flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl">{card.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-label font-semibold text-on-surface text-sm">{card.label}</p>
                    <p className="text-xs text-on-surface-variant truncate">{card.description}</p>
                  </div>
                  <button
                    onClick={() => handleAdd(card.id)}
                    disabled={isPending}
                    className="flex-shrink-0 bg-primary text-on-primary rounded-full px-4 py-1.5 text-xs font-label font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
