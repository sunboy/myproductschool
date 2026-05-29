'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { embedNote, embedAndStoreContext } from '@/lib/notes/embeddings'

export async function createNote(content: string, color: string = 'default') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  let embedding: number[] | null = null
  try {
    embedding = await embedNote(content)
  } catch {
    // Embedding optional - continue without it if OpenAI key not set
  }

  const { data: note, error: insertError } = await supabase.from('user_notes').insert({
    user_id: user.id,
    content,
    color,
    embedding,
  }).select('id').single()
  if (insertError) console.error('[createNote] DB insert error:', insertError)

  if (!insertError && note) {
    const adminClient = createAdminClient()

    const { error: streakError } = await adminClient.rpc('update_user_streak', { p_user_id: user.id })
    if (streakError) console.error('[notes] update_user_streak failed:', streakError.message)

    const { error: sessionEventError } = await adminClient.from('session_events').insert({
      user_id: user.id,
      event_type: 'note_saved',
      payload: { note_id: note.id },
    })
    if (sessionEventError) console.error('[notes] session_events insert failed:', sessionEventError.message)
  }

  // Store a notes_summary context entry for Hatch
  try {
    const noteId = note?.id ?? 'default'
    await embedAndStoreContext(
      user.id,
      'notes_summary',
      `You noted: ${content.slice(0, 200)}`,
      noteId
    )
  } catch {
    // Non-critical - don't block note creation
  }

  revalidatePath('/dashboard')
  revalidatePath('/notes')
}

export async function updateNote(
  id: string,
  content: string,
  color: string,
  pinned: boolean
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  let embedding: number[] | null = null
  try {
    embedding = await embedNote(content)
  } catch {
    // Embedding optional
  }

  const updateData: Record<string, unknown> = { content, color, pinned }
  if (embedding) updateData.embedding = embedding

  await supabase
    .from('user_notes')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)

  // Update the notes_summary context entry for Hatch
  try {
    await embedAndStoreContext(
      user.id,
      'notes_summary',
      `You noted: ${content.slice(0, 200)}`,
      id
    )
  } catch {
    // Non-critical
  }

  revalidatePath('/dashboard')
  revalidatePath('/notes')
}

export async function deleteNote(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('user_notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
  revalidatePath('/notes')
}
