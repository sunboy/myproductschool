import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { QUALITY_TO_POINTS, GRADE_LABELS } from '@/lib/showcase/adapters/autopsyAdapter'
import type { AutopsyChallengeOption } from '@/lib/types'

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
  const { selected_option_label } = body as { selected_option_label: string }

  if (!selected_option_label) {
    return NextResponse.json({ error: 'Missing selected_option_label' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  const { data: product, error: productError } = await adminClient
    .from('autopsy_products')
    .select('id')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Fetch only the Nth decision row directly
  const { data: decisions, error: decisionsError } = await adminClient
    .from('autopsy_decisions')
    .select('id')
    .eq('product_id', product.id)
    .order('sort_order', { ascending: true })
    .range(decisionIndex, decisionIndex)

  if (decisionsError || !decisions || decisions.length === 0) {
    return NextResponse.json({ error: 'Decision not found' }, { status: 404 })
  }

  const decision = decisions[0]

  const { data: challenge, error: challengeError } = await adminClient
    .from('autopsy_challenges')
    .select('id, options, insight')
    .eq('decision_id', decision.id)
    .single()

  if (challengeError || !challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  const options = challenge.options as AutopsyChallengeOption[]

  const selectedOption = options.find(o => o.id === selected_option_label)
  if (!selectedOption) {
    return NextResponse.json({ error: 'Invalid selected_option_label' }, { status: 400 })
  }

  const points = QUALITY_TO_POINTS[selectedOption.quality] ?? 0
  const grade_label = GRADE_LABELS[points] ?? 'Missed'

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

  const revealed_options = options.map(o => ({
    id: o.id,
    text: o.text,
    quality: o.quality,
    points: QUALITY_TO_POINTS[o.quality] ?? 0,
    explanation: o.explanation,
  }))

  return NextResponse.json({
    points,
    grade_label,
    revealed_options,
    insight: challenge.insight,
  })
}
