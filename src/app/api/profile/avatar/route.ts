import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File must be under 2MB' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const adminClient = createAdminClient()
  const { error: uploadError } = await adminClient.storage
    .from('avatars')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = adminClient.storage.from('avatars').getPublicUrl(path)

  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ avatar_url: publicUrl })
}
