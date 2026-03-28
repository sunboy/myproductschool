import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { name, email, company } = await req.json()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  if (process.env.USE_MOCK_DATA === 'true') {
    return NextResponse.json({ success: true })
  }

  const supabase = createAdminClient()
  const row: { email: string; name?: string; company?: string } = { email }
  if (name && typeof name === 'string' && name.trim()) {
    row.name = name.trim()
  }
  if (company && typeof company === 'string' && company.trim()) {
    row.company = company.trim()
  }
  const { error } = await supabase.from('waitlist').insert(row)

  if (error?.code === '23505') {
    return NextResponse.json({ error: 'Already on the waitlist' }, { status: 409 })
  }

  if (error) {
    return NextResponse.json({ error: 'Failed to join' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
