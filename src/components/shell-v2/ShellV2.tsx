'use client'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { activeNavKey, routeKind } from '@/lib/shell/route-kind'
import { AppSidebarV2 } from './AppSidebarV2'
import { AppTopBarV2 } from './AppTopBarV2'
import { BottomTabs } from '@/components/shell/BottomTabs'
import { ReaderChromeProvider, useReaderChromeSlots } from './ReaderChromeContext'

export function ShellV2({ children, topLeft, topRight, hideTopBar = false, fullBleed = false }: {
  children: ReactNode
  topLeft?: ReactNode
  topRight?: ReactNode
  hideTopBar?: boolean
  fullBleed?: boolean
}) {
  return (
    <ReaderChromeProvider>
      <ShellV2Inner topLeft={topLeft} topRight={topRight} hideTopBar={hideTopBar} fullBleed={fullBleed}>{children}</ShellV2Inner>
    </ReaderChromeProvider>
  )
}

function ShellV2Inner({ children, topLeft, topRight, hideTopBar, fullBleed }: {
  children: ReactNode
  topLeft?: ReactNode
  topRight?: ReactNode
  hideTopBar: boolean
  fullBleed: boolean
}) {
  const pathname = usePathname() ?? '/'
  const kind = routeKind(pathname)
  const slots = useReaderChromeSlots()
  return (
    <div className="hp-learning-shell min-h-screen bg-background" data-shell="v2" data-route-kind={kind}>
      <div className="flex min-h-screen w-full">
        <div className="sticky top-0 z-30 hidden h-screen shrink-0 lg:block"><AppSidebarV2 active={activeNavKey(pathname)} /></div>
        <div className="flex min-w-0 flex-1 flex-col">
          {!hideTopBar && <AppTopBarV2 leftSlot={topLeft ?? slots.left} rightSlot={topRight ?? slots.right} />}
          <main className={fullBleed ? 'min-w-0 flex-1' : 'min-w-0 flex-1 pb-20 lg:pb-6'}>{children}</main>
        </div>
      </div>
      {kind === 'hub' && <BottomTabs />}
    </div>
  )
}
