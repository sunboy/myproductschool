'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { embedAndStoreContext } from '@/lib/notes/embeddings'

export async function dismissCard(cardId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Fetch current dismissed_cards, append the new one
  const { data: profile } = await supabase
    .from('profiles')
    .select('dismissed_cards')
    .eq('id', user.id)
    .single()

  const current: string[] = profile?.dismissed_cards ?? []
  if (current.includes(cardId)) return

  await supabase
    .from('profiles')
    .update({ dismissed_cards: [...current, cardId] })
    .eq('id', user.id)

  revalidatePath('/dashboard')
}

export async function restoreCard(cardId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('dismissed_cards')
    .eq('id', user.id)
    .single()

  const current: string[] = profile?.dismissed_cards ?? []

  await supabase
    .from('profiles')
    .update({ dismissed_cards: current.filter(id => id !== cardId) })
    .eq('id', user.id)

  revalidatePath('/dashboard')
}

export async function saveCardSizes(sizes: Record<string, number>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('profiles')
    .update({ dashboard_card_sizes: sizes })
    .eq('id', user.id)
  revalidatePath('/dashboard')
}

export async function addInterview(date: string, meta?: { company?: string; round?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: interview, error: insertError } = await supabase
    .from('user_interviews')
    .insert({ user_id: user.id, interview_date: date, company: meta?.company ?? null, round: meta?.round ?? null })
    .select('id')
    .single()
  if (insertError) console.error('[addInterview] insert error:', insertError)

  try {
    const daysUntil = Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86400000))
    const label = [meta?.round, meta?.company].filter(Boolean).join(' at ') || 'upcoming interview'
    const content = daysUntil > 0
      ? `You have a ${label} in ${daysUntil} day${daysUntil === 1 ? '' : 's'}.`
      : `You have a ${label} today — good luck!`
    await embedAndStoreContext(user.id, 'interview_date', content, interview?.id ?? 'profile', {
      interview_date: date, days_until: daysUntil, company: meta?.company, round: meta?.round,
    })
  } catch { /* non-critical */ }

  revalidatePath('/dashboard')
}

export async function deleteInterview(interviewId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('user_interviews').delete().eq('id', interviewId).eq('user_id', user.id)
  revalidatePath('/dashboard')
}

export async function setInterviewDate(date: string, meta?: { company?: string; round?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('profiles')
    .update({ interview_date: date, ...(meta ? { interview_meta: meta } : {}) })
    .eq('id', user.id)

  // Compute days until interview and store Hatch context
  try {
    const daysUntil = Math.max(
      0,
      Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    )
    const content = daysUntil > 0
      ? `You're preparing for an interview in ${daysUntil} day${daysUntil === 1 ? '' : 's'}.`
      : `Your interview is today — good luck!`

    await embedAndStoreContext(
      user.id,
      'interview_date',
      content,
      'profile',
      { interview_date: date, days_until: daysUntil }
    )
  } catch {
    // Non-critical — don't block the date update
  }

  revalidatePath('/dashboard')
}
