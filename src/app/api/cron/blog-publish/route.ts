import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { canonicalUrl } from '@/lib/seo/site'
import { estimateReadingMinutes } from '@/lib/blog/reading-time'

// Autopilot publish endpoint: the Publisher routine (wave 2) POSTs here once
// a `growth:approved` Linear issue is parsed. Upserts on slug so re-running
// the same issue (e.g. a founder edit) never creates a duplicate post.

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}

interface BlogPublishBody {
  slug?: string
  title?: string
  dek?: string
  body_markdown?: string
  hero_image_url?: string
  tags?: string[]
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  canonical_url?: string
  author_name?: string
  linear_issue_id?: string
  publish?: boolean
  sendNewsletter?: boolean
  atomizeChannels?: string[]
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized()

  const body = (await request.json().catch(() => null)) as BlogPublishBody | null
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!isNonEmptyString(body.slug)) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }
  if (!isNonEmptyString(body.title)) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }
  if (!isNonEmptyString(body.body_markdown)) {
    return NextResponse.json({ error: 'body_markdown is required' }, { status: 400 })
  }

  const slug = body.slug.trim()
  const admin = createAdminClient()
  const shouldPublish = body.publish === true

  const { data: existing, error: existingError } = await admin
    .from('blog_posts')
    .select('id, published_at')
    .eq('slug', slug)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: 'Could not read existing post' }, { status: 500 })
  }

  const readingMinutes = estimateReadingMinutes(body.body_markdown)

  const upsertRow: Record<string, unknown> = {
    slug,
    title: body.title.trim(),
    dek: body.dek ?? null,
    body_markdown: body.body_markdown,
    reading_minutes: readingMinutes,
  }

  if (body.hero_image_url !== undefined) upsertRow.hero_image_url = body.hero_image_url
  if (isStringArray(body.tags)) upsertRow.tags = body.tags
  if (body.seo_title !== undefined) upsertRow.seo_title = body.seo_title
  if (body.seo_description !== undefined) upsertRow.seo_description = body.seo_description
  if (isStringArray(body.seo_keywords)) upsertRow.seo_keywords = body.seo_keywords
  if (body.canonical_url !== undefined) upsertRow.canonical_url = body.canonical_url
  if (isNonEmptyString(body.author_name)) upsertRow.author_name = body.author_name
  if (body.linear_issue_id !== undefined) upsertRow.linear_issue_id = body.linear_issue_id

  if (shouldPublish) {
    upsertRow.status = 'published'
    if (!existing?.published_at) {
      upsertRow.published_at = new Date().toISOString()
    }
  }

  const { data: saved, error: saveError } = await admin
    .from('blog_posts')
    .upsert(upsertRow, { onConflict: 'slug' })
    .select('id, slug, status')
    .single()

  if (saveError || !saved) {
    return NextResponse.json({ error: 'Could not save post' }, { status: 500 })
  }

  if (shouldPublish) {
    revalidatePath('/blog')
    revalidatePath(`/blog/${slug}`)
  }

  const previewUrl = canonicalUrl(`/blog/${slug}/preview`)
  const liveUrl = canonicalUrl(`/blog/${slug}`)

  // The Postiz/Linear social-atomization fan-out is wave 2 work. Acknowledge
  // the request without doing anything so the Publisher routine's response
  // contract is stable now and gains real behavior later.
  const atomizeChannels = (body.atomizeChannels ?? []).map((channel) => ({
    channel,
    acknowledged: false,
  }))

  return NextResponse.json({
    id: saved.id,
    slug: saved.slug,
    status: saved.status,
    previewUrl,
    liveUrl,
    ...(atomizeChannels.length > 0 ? { atomizeChannels } : {}),
    ...(body.sendNewsletter ? { sendNewsletter: { acknowledged: false } } : {}),
  })
}
