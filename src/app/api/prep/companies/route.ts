import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Static fallback list if no DB table exists
const STATIC_COMPANIES = [
  { id: '1', name: 'Google', slug: 'google', challenge_count: 24 },
  { id: '2', name: 'Meta', slug: 'meta', challenge_count: 18 },
  { id: '3', name: 'Stripe', slug: 'stripe', challenge_count: 12 },
  { id: '4', name: 'Amazon', slug: 'amazon', challenge_count: 15 },
  { id: '5', name: 'Apple', slug: 'apple', challenge_count: 8 },
  { id: '6', name: 'Uber', slug: 'uber', challenge_count: 10 },
  { id: '7', name: 'Airbnb', slug: 'airbnb', challenge_count: 6 },
  { id: '8', name: 'DoorDash', slug: 'doordash', challenge_count: 5 },
]

export async function GET() {
  try {
    const supabase = await createClient()

    // Try to fetch companies from DB; if table doesn't exist, fall back to static
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, slug, challenge_count')
      .order('challenge_count', { ascending: false })
      .limit(12)

    if (error || !data?.length) {
      return NextResponse.json(STATIC_COMPANIES)
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(STATIC_COMPANIES)
  }
}
