import { NextResponse, type NextRequest } from 'next/server'

const DAILY_CRON_PATHS = [
  '/api/cron/streak-reminders',
  '/api/cron/trial-ending',
] as const

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}

function appUrl(request: NextRequest, path: string) {
  return new URL(path, process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin).toString()
}

async function runCronPath(request: NextRequest, path: typeof DAILY_CRON_PATHS[number]) {
  const response = await fetch(appUrl(request, path), {
    method: 'GET',
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    cache: 'no-store',
  })

  const body = await response.json().catch(() => null)
  return {
    path,
    ok: response.ok,
    status: response.status,
    body,
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized()

  const results = await Promise.all(DAILY_CRON_PATHS.map(path => runCronPath(request, path)))
  const ok = results.every(result => result.ok)

  return NextResponse.json({ ok, results }, { status: ok ? 200 : 502 })
}
