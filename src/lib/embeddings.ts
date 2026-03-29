/**
 * Embeddings pipeline for pgvector similarity search.
 * Uses Voyage AI voyage-3-lite (512 dims) when EMBEDDING_API_KEY is set.
 * Returns null when no key is configured — embeddings can be back-filled later.
 */

const EMBEDDING_API_URL = 'https://api.voyageai.com/v1/embeddings'
const EMBEDDING_MODEL = 'voyage-3-lite'
const EMBEDDING_DIMS = 512

export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!process.env.EMBEDDING_API_KEY) return null

  const res = await fetch(EMBEDDING_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.EMBEDDING_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: [text],
    }),
  })

  if (!res.ok) {
    console.error('[embeddings] API error', res.status, await res.text())
    return null
  }

  const json = await res.json() as { data: { embedding: number[] }[] }
  const embedding = json.data?.[0]?.embedding
  if (!embedding || embedding.length !== EMBEDDING_DIMS) {
    console.error('[embeddings] Unexpected response shape', json)
    return null
  }

  return embedding
}

export { EMBEDDING_DIMS, EMBEDDING_MODEL }
