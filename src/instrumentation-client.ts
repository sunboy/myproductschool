import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    enabled: process.env.NODE_ENV === 'production',
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    sendDefaultPii: false,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    // Session replay: record full sessions rarely, but always capture the
    // replay leading up to an error. This is the primary tool for diagnosing
    // hung screens — it shows exactly what the user saw before things broke.
    replaysSessionSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE ?? '0'
    ),
    replaysOnErrorSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE ?? '1.0'
    ),
    integrations: [
      Sentry.replayIntegration({
        // We already avoid PII, but mask text/media conservatively so replays
        // never leak user-entered answers or uploaded content.
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    beforeSend(event) {
      // Scrub PII from the user context (email can leak into breadcrumbs).
      if (event.user?.email) {
        event.user.email = '[redacted]'
      }
      return event
    },
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
