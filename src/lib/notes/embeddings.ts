import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function embedNote(content: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: content }),
  })
  const data = await res.json()
  return data.data[0].embedding
}

export async function searchSimilarNotes(
  userId: string,
  queryText: string,
  limit = 3
): Promise<{ id: string; content: string; similarity: number }[]> {
  const queryEmbedding = await embedNote(queryText)

  const { data, error } = await supabaseAdmin.rpc('match_user_notes', {
    p_user_id: userId,
    query_embedding: queryEmbedding,
    match_count: limit,
  })

  if (error) {
    console.error('searchSimilarNotes error:', error)
    return []
  }

  return (data ?? []).map((row: { id: string; content: string; similarity: number }) => ({
    id: row.id,
    content: row.content,
    similarity: row.similarity,
  }))
}

/**
 * Upserts a structured context entry into hatch_context table.
 * Uses onConflict on (user_id, context_type, source_id) to update in place.
 */
export async function embedAndStoreContext(
  userId: string,
  contextType: string,
  content: string,
  sourceId: string = 'default',
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('hatch_context')
    .upsert(
      {
        user_id: userId,
        context_type: contextType,
        source_id: sourceId,
        content,
        metadata,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,context_type,source_id' }
    )

  if (error) {
    console.error('embedAndStoreContext error:', error)
  }
}

/**
 * Composes a human-readable Hatch context string from stored context entries.
 * Example: "You're preparing for Final round at Google in 12 days. You noted you need to work on metric framing."
 * Internal helper — not exported. Use getHatchContextFromNotes() from this module,
 * or use getHatchContext from @/lib/hatch-context for rich user context.
 */
async function getStructuredHatchContext(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('hatch_context')
    .select('context_type, content, metadata')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error || !data || data.length === 0) return null

  const parts: string[] = []

  // Interview date context
  const interviewEntry = data.find(d => d.context_type === 'interview_date')
  if (interviewEntry) {
    parts.push(interviewEntry.content)
  }

  // Notes-based weak area or summary context
  const notesSummary = data.find(d => d.context_type === 'notes_summary')
  if (notesSummary) {
    parts.push(notesSummary.content)
  }

  // Any other context types
  for (const entry of data) {
    if (entry.context_type !== 'interview_date' && entry.context_type !== 'notes_summary') {
      parts.push(entry.content)
    }
  }

  if (parts.length === 0) return null

  return parts.join(' ')
}

/**
 * Legacy wrapper — searches notes by semantic similarity for a given topic.
 * Kept for backwards compatibility; new code should use `getHatchContext` from
 * `@/lib/hatch-context` for rich user context.
 */
export async function getHatchContextFromNotes(
  userId: string,
  topic: string
): Promise<string | null> {
  // First try the structured context layer
  const structured = await getStructuredHatchContext(userId)
  if (structured) return structured

  // Fall back to semantic note search
  const notes = await searchSimilarNotes(userId, topic, 3)

  if (notes.length === 0) return null

  const snippets = notes
    .filter(n => n.similarity > 0.3)
    .map(n => n.content.slice(0, 120))
    .join('; ')

  if (!snippets) return null

  return `From your notes: ${snippets}`
}
