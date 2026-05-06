import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasValidReauthToken, REAUTH_COOKIE_NAME } from '@/lib/auth/reauth'
import { z, ZodError } from 'zod'

const RequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  confirmation: z.literal('DELETE'),
})

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasValidReauthToken(request, user.id)) {
    return NextResponse.json({ error: 'reauth_required' }, { status: 403 })
  }

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', issues: validationIssues(error) },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { email, confirmation } = body

  if (!user.email || email !== user.email.toLowerCase() || confirmation !== 'DELETE') {
    return NextResponse.json({ error: 'Account deletion confirmation did not match.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return NextResponse.json({ error: 'Could not delete account.' }, { status: 500 })

  const response = NextResponse.json({ ok: true })
  response.cookies.delete(REAUTH_COOKIE_NAME)
  return response
}
