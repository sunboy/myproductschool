import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserRoleV2 } from '@/lib/types'

interface RoleLensPublic {
  role_id: UserRoleV2
  label: string
  short_label: string
}

export async function GET() {
  const supabase = await createClient()

  const { data: roles, error } = await supabase
    .from('role_lenses')
    .select('role_id, label, short_label')
    .order('role_id', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
  }

  return NextResponse.json({ roles: (roles ?? []) as RoleLensPublic[] })
}
