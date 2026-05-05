import Link from 'next/link'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

type MagicLinkSentPageProps = {
  searchParams: Promise<{ email?: string | string[] | undefined }>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function MagicLinkSentPage({ searchParams }: MagicLinkSentPageProps) {
  const params = await searchParams
  const email = firstParam(params.email)?.trim() ?? ''

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-outline-variant bg-surface p-6 text-center shadow-sm">
        <div className="flex justify-center">
          <HatchGlyph size={40} state="speaking" className="text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="font-headline text-2xl font-bold text-on-surface">Check your email</h1>
          <p className="text-sm text-on-surface-variant">
            {email ? <>We sent a magic link to <span className="font-medium text-on-surface">{email}</span>.</> : 'We sent you a magic link.'}
          </p>
        </div>

        <p className="text-sm text-on-surface-variant">
          The link signs you in once and then expires.
        </p>

        <Link
          href="/login"
          className="block w-full rounded-xl border border-outline-variant px-4 py-3 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
        >
          Back to log in
        </Link>
      </div>
    </div>
  )
}
