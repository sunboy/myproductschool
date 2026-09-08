'use client'
import { LayoutGrid, List } from 'lucide-react'
import { useUiShell } from '@/components/shell-v2/UiShellContext'
export function ViewToggle() {
  const { practiceView, setPracticeView } = useUiShell()
  const b = (on: boolean) => `grid size-7 place-items-center ${on ? 'bg-forest-800 text-white' : 'bg-card-bright text-ink-secondary'}`
  return (
    <div role="group" aria-label="View" className="inline-flex overflow-hidden rounded-lg border border-hairline">
      <button type="button" data-testid="view-cards" aria-pressed={practiceView === 'cards'} onClick={() => setPracticeView('cards')} className={b(practiceView === 'cards')}><LayoutGrid size={14} aria-hidden /></button>
      <button type="button" data-testid="view-list" aria-pressed={practiceView === 'list'} onClick={() => setPracticeView('list')} className={b(practiceView === 'list')}><List size={14} aria-hidden /></button>
    </div>
  )
}
