'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Volume2, VolumeX, Compass, Bell } from 'lucide-react'
import { AvatarMenu } from '@/components/redesign/AppTopShell'
import { useHatchSonics } from '@/hooks/useHatchSonics'
import { useSession } from '@/context/SessionContext'
import { SpendIndicator } from '@/components/billing/FreemiumUsageSummary'
import { searchScopeFor } from '@/lib/shell/search-scope'

export function AppTopBarV2({ searchTotal, leftSlot, rightSlot }: { searchTotal?: number; leftSlot?: ReactNode; rightSlot?: ReactNode }) {
  const pathname = usePathname() ?? '/'
  const router = useRouter()
  const { profile } = useSession()
  const { muted, toggleMuted } = useHatchSonics()
  const scope = searchScopeFor(pathname, searchTotal)
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const isPro = profile?.plan === 'pro'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); inputRef.current?.focus() } }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header data-testid="shell-topbar" data-topnav className="flex shrink-0 items-center gap-3 border-b border-hairline bg-background px-4" style={{ height: 'var(--shell-top-h)' }}>
      {leftSlot ?? (
        <form role="search" onSubmit={e => { e.preventDefault(); router.push(scope.buildHref(inputRef.current?.value ?? q)) }} className="flex h-8 w-full max-w-[360px] items-center gap-2 rounded-full border border-hairline bg-card-bright px-3 text-[13px] text-ink-secondary">
          <Search size={14} aria-hidden />
          <input ref={inputRef} data-testid="shell-search" value={q} onChange={e => setQ(e.target.value)} placeholder={scope.placeholder} aria-label={scope.placeholder} className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-muted" />
          <kbd className="rounded bg-surface-container px-1 text-[10px]">⌘K</kbd>
        </form>
      )}
      <div className="flex-1" />
      {rightSlot}
      {!isPro && <span className="hidden lg:block"><SpendIndicator /></span>}
      <button type="button" aria-label={muted ? 'Unmute Hatch' : 'Mute Hatch'} aria-pressed={muted} onClick={toggleMuted} className="grid size-8 place-items-center rounded-full border border-hairline bg-card-bright">
        {muted ? <VolumeX size={15} aria-hidden /> : <Volume2 size={15} aria-hidden />}
      </button>
      <button type="button" aria-label="Take the tour" onClick={() => window.dispatchEvent(new Event('start-intro-tour'))} className="grid size-8 place-items-center rounded-full border border-hairline bg-card-bright">
        <Compass size={15} aria-hidden />
      </button>
      <button type="button" aria-label="Notifications" onClick={() => router.push('/settings/notifications')} className="grid size-8 place-items-center rounded-full border border-hairline bg-card-bright">
        <Bell size={15} aria-hidden />
      </button>
      <AvatarMenu />
    </header>
  )
}
