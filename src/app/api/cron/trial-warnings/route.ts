import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const now = new Date()

  // Find users whose trial ends in 1-4 days
  const warningWindow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString()
  const urgentWindow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()

  const { data: trialingUsers } = await supabase
    .from('subscriptions')
    .select('user_id, trial_end, profiles(email)')
    .eq('status', 'trialing')
    .lt('trial_end', warningWindow)
    .gt('trial_end', now.toISOString())

  const results = { t3_notified: 0, t1_notified: 0, errors: 0 }

  for (const sub of trialingUsers || []) {
    const trialEnd = new Date(sub.trial_end)
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const isUrgent = trialEnd < new Date(urgentWindow)

    // Log the notification event (actual email sending would use Resend/Loops/etc)
    console.log(`Trial warning: user=${sub.user_id} daysLeft=${daysLeft} urgent=${isUrgent}`)

    if (isUrgent) results.t1_notified++
    else results.t3_notified++
  }

  return NextResponse.json({ ok: true, ...results })
}
