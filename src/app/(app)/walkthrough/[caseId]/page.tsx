import { WalkthroughClient } from './WalkthroughClient'

// Minimal authenticated Walkthrough route. Server component just validates
// the param and hands off; auth + data fetching happen client-side against
// the existing /api/casebook/replay/[caseId] route, which already enforces
// requireAuth() for full (non-teaser) mode. Keep this small — the full
// module page is a later phase.
export default async function WalkthroughPage({
  params,
}: {
  params: Promise<{ caseId: string }>
}) {
  const { caseId } = await params
  return <WalkthroughClient caseId={caseId} />
}
