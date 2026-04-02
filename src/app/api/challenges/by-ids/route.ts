import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.getAll('ids').filter(Boolean)

  if (!ids.length) {
    return NextResponse.json({ challenges: [] })
  }

  if (IS_MOCK) {
    return NextResponse.json({
      challenges: ids.map(id => ({
        id,
        slug: id.replace(/^c\d+-/, ''),
        title: id.replace(/-/g, ' ').replace(/^c\d+ ?/, '').replace(/\b\w/g, c => c.toUpperCase()),
      })),
    })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('challenges')
    .select('id, title, slug')
    .in('id', ids)

  if (error) {
    return NextResponse.json({ challenges: [] })
  }

  return NextResponse.json({ challenges: data ?? [] })
}
