import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

// A/B test: 50/50 split between waitlist variants.
// Uses a stable cookie-based split (set in middleware) if available,
// otherwise falls back to random assignment per request.
export default async function RootPage() {
  const headersList = await headers()
  const abVariant = headersList.get('x-ab-waitlist')

  if (abVariant === 'b') {
    redirect('/waitlist-b')
  }
  redirect('/waitlist')
}
