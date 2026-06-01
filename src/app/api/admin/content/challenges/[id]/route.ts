import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAdminAction } from '@/lib/admin/audit-log'
import { checkAdminSecret } from '@/lib/content/admin-auth'
import { slugifyIndustry } from '@/lib/practice/slugify'
import { isValidDomain } from '@/lib/data/taxonomy'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = checkAdminSecret(req)
  if (deny) return deny

  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('challenges')
    .select([
      'id', 'title', 'paradigm', 'difficulty',
      'estimated_minutes', 'primary_competencies', 'secondary_competencies',
      'relevant_roles', 'company_tags',
      'is_published', 'is_premium', 'is_calibration', 'challenge_type',
      'topic_tags', 'technique_tags', 'industry_tags',
      'topic_tags_suggested', 'technique_tags_suggested',
      'is_real_interview', 'source_url', 'domain_id',
    ].join(','))
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  return NextResponse.json({ challenge: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = checkAdminSecret(req)
  if (deny) return deny

  const { id } = await params
  const body = await req.json()

  // Only allow updating tag/taxonomy fields, nothing structural
  const allowed = [
    'paradigm', 'difficulty', 'estimated_minutes',
    'primary_competencies', 'secondary_competencies',
    'relevant_roles', 'company_tags', 'is_premium', 'is_published',
    'topic_tags', 'technique_tags', 'industry_tags',
    'topic_tags_suggested', 'technique_tags_suggested',
    'is_real_interview', 'source_url', 'domain_id',
  ]
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  // Accept domain_slug as a convenience: resolve it to domain_id so reviewers
  // can re-theme a challenge by slug from the canonical DOMAINS vocab.
  if (!('domain_id' in body) && typeof body.domain_slug === 'string' && isValidDomain(body.domain_slug)) {
    const supabaseForDomain = createAdminClient()
    const { data: domainRow } = await supabaseForDomain
      .from('domains')
      .select('id')
      .eq('slug', body.domain_slug)
      .maybeSingle()
    if (domainRow?.id) update.domain_id = domainRow.id
  }

  // Dual-accept legacy → canonical column normalization (R3.A contract window)
  // industry / sub_vertical → industry_tags (append-normalise, don't overwrite canonical if already set)
  if (!('industry_tags' in body)) {
    const derived = [
      typeof body.industry === 'string' ? slugifyIndustry(body.industry) : '',
      typeof body.sub_vertical === 'string' ? slugifyIndustry(body.sub_vertical) : '',
    ].filter(Boolean)
    const deduped = Array.from(new Set(derived))
    if (deduped.length > 0) update.industry_tags = deduped
  }
  // frameworks → technique_tags (conservative: merge, not replace)
  if (!('technique_tags' in body) && Array.isArray(body.frameworks) && body.frameworks.length > 0) {
    const slugs = (body.frameworks as unknown[])
      .filter((v): v is string => typeof v === 'string')
      .map(slugifyIndustry)
      .filter(Boolean)
    if (slugs.length > 0) update.technique_tags = Array.from(new Set(slugs))
  }
  // tags → topic_tags (conservative: treat generic tags as topics)
  if (!('topic_tags' in body) && Array.isArray(body.tags) && body.tags.length > 0) {
    const tags = (body.tags as unknown[]).filter((v): v is string => typeof v === 'string')
    if (tags.length > 0) update.topic_tags = Array.from(new Set(tags))
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('challenges').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAdminAction(supabase, {
    action: 'challenge.update',
    targetType: 'challenges',
    targetId: id,
    after: update,
  })

  return NextResponse.json({ ok: true })
}
