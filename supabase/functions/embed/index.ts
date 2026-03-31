import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// Supabase AI is available as a built-in in edge functions runtime
// @ts-ignore — Supabase edge runtime global
const { session } = Deno.env.get('SUPABASE_AI_MODEL') ? { session: null } : { session: null }

serve(async (req) => {
  try {
    const { input } = await req.json()
    if (!input || typeof input !== 'string') {
      return new Response(JSON.stringify({ error: 'input string required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Use Supabase's built-in AI session for gte-small embeddings
    // @ts-ignore — Supabase edge runtime provides Supabase global
    const model = new Supabase.ai.Session('gte-small')
    const embedding = await model.run(input.slice(0, 2000), { mean_pool: true, normalize: true })

    return new Response(JSON.stringify({ embedding: Array.from(embedding) }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
