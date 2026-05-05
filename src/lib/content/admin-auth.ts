// src/lib/content/admin-auth.ts
import { NextRequest, NextResponse } from 'next/server'

export function checkAdminSecret(req: NextRequest): NextResponse | null {
  const secret = req.headers.get('x-admin-secret')
  const expected = process.env.ADMIN_SECRET
  if (!expected) {
    console.warn('ADMIN_SECRET not set — admin routes are unprotected')
    return null
  }
  if (secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
