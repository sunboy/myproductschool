import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { IS_MOCK } from '@/lib/mock'

const RequestSchema = z.object({
  companyId: z.string().uuid().nullable().optional(),
})

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await req.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', issues: validationIssues(error) },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { companyId } = body

  if (IS_MOCK) {
    return NextResponse.json({ sessionId: 'mock-session-001' })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase.from('simulation_sessions').insert({
    user_id: user.id,
    company_id: companyId || null,
    transcript_json: [],
  }).select().single()

  if (error) return NextResponse.json({ error: 'Failed to start session' }, { status: 500 })

  return NextResponse.json({ sessionId: data.id })
}
