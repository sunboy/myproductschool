import { NavRail } from '@/components/shell/NavRail'
import { BottomTabs } from '@/components/shell/BottomTabs'
import { TopBar } from '@/components/shell/TopBar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <NavRail />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <BottomTabs />
    </div>
  )
}
