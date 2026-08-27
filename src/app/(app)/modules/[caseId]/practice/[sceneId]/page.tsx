import { notFound } from 'next/navigation'
import { PracticeClient } from './PracticeClient'

// Minimal authenticated Practice route. Server component just validates the
// params and hands off; data fetching happens client-side (currently
// against a typed fixture, since the API owner has not shipped the real
// route yet). Keep this small.
export default async function PracticePage({
  params,
}: {
  params: Promise<{ caseId: string; sceneId: string }>
}) {
  const { caseId, sceneId } = await params
  if (!caseId || !sceneId) notFound()

  return <PracticeClient caseId={caseId} sceneId={sceneId} />
}
