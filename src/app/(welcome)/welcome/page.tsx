import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAppFlag } from '@/lib/config/app-flags'
import { WelcomeFlow } from '@/components/onboarding/welcome/WelcomeFlow'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Welcome to HackProduct' }

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ redo?: string }> }) {
  const { redo } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?returnTo=/welcome')
  const density = await getAppFlag('ui_density_v1', false)
  if (!density) redirect('/dashboard')
  const { data: profile } = await supabase.from('profiles').select('onboarding_completed_at').eq('id', user.id).maybeSingle()
  if (profile?.onboarding_completed_at && redo !== '1') redirect('/dashboard')
  return <WelcomeFlow redo={redo === '1'} />
}
