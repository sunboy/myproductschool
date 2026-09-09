'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Volume2, VolumeX, Bell } from 'lucide-react'
import { AvatarMenu } from '@/components/redesign/AppTopShell'
import { useHatchSonics } from '@/hooks/useHatchSonics'
import { useSession } from '@/context/SessionContext'
import { searchScopeFor } from '@/lib/shell/search-scope'
import { IconButton, Badge } from '@/design'

/** 48px top bar. Left slot is the route-scoped search unless a page supplies a
 *  back link through ReaderChromeContext. Right: usage pill (free users),
 *  sound, notifications, account. The intro tour starts from the Hatch card. */
export function AppTopBarV2({ searchTotal, leftSlot, rightSlot }: { searchTotal?: number; leftSlot?: ReactNode; rightSlot?: ReactNode }) {
  const pathname = usePathname() ?? '/'
  const router = useRouter()
  const { profile, usage } = useSession()
  const { muted, toggleMuted } = useHatchSonics()
  const scope = searchScopeFor(pathname, searchTotal)
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const isPro = profile?.plan === 'pro'
  const repsLeft = Math.max(0, (usage?.challenges?.limit ?? 0) - (usage?.challenges?.used ?? 0))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); inputRef.current?.focus() } }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header data-testid="shell-topbar" data-topnav className="flex h-(--shell-top-h) shrink-0 items-center gap-2.5 border-b border-hairline bg-background px-4">
      {leftSlot ?? (
        <form role="search" onSubmit={e => { e.preventDefault(); router.push(scope.buildHref(inputRef.current?.value ?? q)) }} className="flex h-control-md w-full max-w-[360px] items-center gap-2 rounded-control border border-hairline bg-card-bright px-3 text-ui font-ui text-ink-secondary">
          <Search size={16} aria-hidden />
          <input ref={inputRef} data-testid="shell-search" value={q} onChange={e => setQ(e.target.value)} placeholder={scope.placeholder} aria-label={scope.placeholder} className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-muted" />
          <kbd className="rounded bg-surface-container px-1 text-caption font-ui">⌘K</kbd>
        </form>
      )}
      <div className="flex-1" />
      {rightSlot}
      {!isPro && usage && (
        <button type="button" data-testid="reps-left" onClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-modal'))} className="hidden rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:block" aria-label={`${repsLeft} free reps left this month. Upgrade for unlimited.`}>
          <Badge tone={repsLeft === 0 ? 'warn' : 'neutral'} className="h-6 px-2.5">{repsLeft} {repsLeft === 1 ? 'rep' : 'reps'} left</Badge>
        </button>
      )}
      <IconButton label={muted ? 'Unmute Hatch' : 'Mute Hatch'} aria-pressed={muted} onClick={toggleMuted}>
        {muted ? <VolumeX aria-hidden /> : <Volume2 aria-hidden />}
      </IconButton>
      <IconButton label="Notifications" onClick={() => router.push('/settings/notifications')}>
        <Bell aria-hidden />
      </IconButton>
      <AvatarMenu />
    </header>
  )
}
