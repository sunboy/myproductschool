// src/app/api/admin/content/drafts/[id]/publish/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkAdminSecret } from '@/lib/content/admin-auth'
import { publishDraft } from '@/lib/content/publisher'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminSecret(req)
  if (authErr) return authErr

  const { id } = await params

  try {
    const challengeId = await publishDraft(id)
    return NextResponse.json({ ok: true, challenge_id: challengeId })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
