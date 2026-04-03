import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AutopsyChallengeOption } from '@/lib/types'

// ── Quality → points mapping ─────────────────────────────────

const QUALITY_POINTS: Record<string, number> = {
  best: 3,
  good_but_incomplete: 2,
  surface: 1,
  plausible_wrong: 0,
}

function qualityToGradeLabel(points: number): string {
  if (points === 3) return 'Sharp'
  if (points === 2) return 'Solid'
  if (points === 1) return 'Surface'
  return 'Missed'
}

// ── POST handler ─────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; decisionIndex: string }> }
) {
  const { slug, decisionIndex: decisionIndexParam } = await params
  const decisionIndex = parseInt(decisionIndexParam, 10)

  if (isNaN(decisionIndex) || decisionIndex < 0) {
    return NextResponse.json({ error: 'Invalid decisionIndex' }, { status: 400 })
  }

  const body = await req.json()
  const { selected_option_label, elaboration } = body as {
    selected_option_label: string
    elaboration: string
  }

  if (!selected_option_label) {
    return NextResponse.json({ error: 'Missing selected_option_label' }, { status: 400 })
  }

  // Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  // Look up the product by slug
  const { data: product, error: productError } = await adminClient
    .from('autopsy_products')
    .select('id')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Look up the Nth decision (0-based index → sort by sort_order, pick offset N)
  const { data: decisions, error: decisionsError } = await adminClient
    .from('autopsy_decisions')
    .select('id')
    .eq('product_id', product.id)
    .order('sort_order', { ascending: true })

  if (decisionsError || !decisions || decisions.length === 0) {
    return NextResponse.json({ error: 'No decisions found for product' }, { status: 404 })
  }

  if (decisionIndex >= decisions.length) {
    return NextResponse.json({ error: 'decisionIndex out of range' }, { status: 400 })
  }

  const decision = decisions[decisionIndex]

  // Look up the challenge for this decision
  const { data: challenge, error: challengeError } = await adminClient
    .from('autopsy_challenges')
    .select('id, options, insight')
    .eq('decision_id', decision.id)
    .single()

  if (challengeError || !challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  const options = challenge.options as AutopsyChallengeOption[]

  // Find the selected option by label
  const selectedOption = options.find(o => o.label === selected_option_label)
  if (!selectedOption) {
    return NextResponse.json({ error: 'Invalid selected_option_label' }, { status: 400 })
  }

  // Map quality → points and grade_label
  const points = QUALITY_POINTS[selectedOption.quality] ?? 0
  const grade_label = qualityToGradeLabel(points)

  // Upsert into autopsy_attempts
  const { error: upsertError } = await adminClient
    .from('autopsy_attempts')
    .upsert(
      {
        user_id: user.id,
        product_slug: slug,
        decision_index: decisionIndex,
        selected_option_label,
        points,
        grade_label,
      },
      { onConflict: 'user_id,product_slug,decision_index' }
    )

  if (upsertError) {
    console.error('[showcase/submit] Failed to upsert attempt:', upsertError)
    return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 })
  }

  // Build revealed_options
  const revealed_options = options.map(o => ({
    label: o.label,
    text: o.text,
    quality: o.quality,
    points: QUALITY_POINTS[o.quality] ?? 0,
    explanation: o.explanation,
  }))

  return NextResponse.json({
    points,
    grade_label,
    revealed_options,
    insight: challenge.insight,
  })
}
