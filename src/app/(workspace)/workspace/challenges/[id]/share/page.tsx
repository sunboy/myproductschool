import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateAttemptShare } from '@/lib/share/attempt-scorecard'

interface SharePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ attempt?: string | string[] }>
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function ShareScoreCardGatePage({ params, searchParams }: SharePageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const attemptId = firstValue(query.attempt)

  if (attemptId) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const scorecard = await getOrCreateAttemptShare(createAdminClient(), {
        attemptId,
        userId: user.id,
        challengeId: id,
      })

      if (scorecard) redirect(`/workspace/challenges/${id}/share/${scorecard.shareId}`)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 text-on-surface">
      <section className="max-w-md rounded-xl border border-outline-variant bg-surface p-6 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Scorecard</p>
        <h1 className="mt-3 font-headline text-2xl font-bold">This scorecard link is not ready.</h1>
        <p className="mt-3 text-sm leading-6 text-on-surface-variant">
          Open the completed attempt from your feedback page and use Share scorecard again.
        </p>
        <Link
          href={`/workspace/challenges/${id}`}
          className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
        >
          Back to challenge
        </Link>
      </section>
    </main>
  )
}
