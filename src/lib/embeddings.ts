/**
 * Embeddings pipeline for pgvector similarity search.
 * Uses Supabase's built-in AI (gte-small, 384 dims) — no external API key needed.
 * Falls back to null if called outside a Supabase edge function context (e.g. batch scripts use the admin client directly).
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/log'

export const EMBEDDING_DIMS = 384
export const EMBEDDING_MODEL = 'gte-small'

// Without a timeout, a stalled edge function leaves the awaiting route hanging
// indefinitely (the memory-noted "hung screen" failure mode). Cap it so a stall
// fails fast to null instead of blocking the response.
const EMBEDDING_TIMEOUT_MS = Number(process.env.EMBEDDING_TIMEOUT_MS ?? '8000')

export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.functions.invoke('embed', {
      body: { input: text.slice(0, 2000) },
      // @supabase/functions-js supports a native timeout (ms) that aborts the
      // underlying fetch and rejects with an AbortError on stall.
      timeout: EMBEDDING_TIMEOUT_MS,
    })

    if (error) {
      logger.error('[embeddings] Supabase function error', { error: String(error) })
      return null
    }

    const embedding = data?.embedding as number[] | undefined
    if (!embedding || embedding.length !== EMBEDDING_DIMS) {
      logger.error('[embeddings] Unexpected response shape')
      return null
    }

    return embedding
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    if (aborted) {
      logger.warn('[embeddings] timed out, returning null', { timeoutMs: EMBEDDING_TIMEOUT_MS })
    } else {
      logger.error('[embeddings] generateEmbedding failed', { error: String(err) })
    }
    return null
  }
}
