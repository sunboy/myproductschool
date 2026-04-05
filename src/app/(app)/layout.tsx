import { NavRail } from '@/components/shell/NavRail'
import { BottomTabs } from '@/components/shell/BottomTabs'
import { TopBar } from '@/components/shell/TopBar'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let dailyDone = 0
  if (user) {
    const today = new Date().toISOString().split('T')[0]
    const { count } = await supabase
      .from('challenge_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today)
    dailyDone = count ?? 0
  }

  return (
    <div className="flex min-h-screen bg-background">
      <NavRail dailyDone={dailyDone} dailyTotal={5} />
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
