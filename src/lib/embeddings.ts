/**
 * Embeddings pipeline for pgvector similarity search.
 * Uses Supabase's built-in AI (gte-small, 384 dims) — no external API key needed.
 * Falls back to null if called outside a Supabase edge function context (e.g. batch scripts use the admin client directly).
 */

import { createAdminClient } from '@/lib/supabase/admin'

export const EMBEDDING_DIMS = 384
export const EMBEDDING_MODEL = 'gte-small'

export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.functions.invoke('embed', {
      body: { input: text.slice(0, 2000) },
    })

    if (error) {
      console.error('[embeddings] Supabase function error', error)
      return null
    }

    const embedding = data?.embedding as number[] | undefined
    if (!embedding || embedding.length !== EMBEDDING_DIMS) {
      console.error('[embeddings] Unexpected response shape', data)
      return null
    }

    return embedding
  } catch (err) {
    console.error('[embeddings] generateEmbedding failed', err)
    return null
  }
}
