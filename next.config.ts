import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const projectRoot = process.cwd()
const sentrySourceMapsConfigured = Boolean(
  process.env.SENTRY_AUTH_TOKEN
  && process.env.SENTRY_ORG
  && process.env.SENTRY_PROJECT
)

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.stripe.com challenges.cloudflare.com *.posthog.com va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' fonts.gstatic.com data:",
  "connect-src 'self' *.supabase.co api.anthropic.com api.openai.com api.stripe.com *.posthog.com api.resend.com *.upstash.io *.vercel-insights.com vitals.vercel-insights.com *.sentry.io ws: wss: http://localhost:*",
  "frame-src 'self' *.stripe.com challenges.cloudflare.com",
  "media-src 'self' data: blob: https:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' *.stripe.com",
  "frame-ancestors 'none'",
].join('; ')

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
  async redirects() {
    return [
      { source: '/domains', destination: '/explore/domains', permanent: true },
      { source: '/domains/:slug', destination: '/explore/domains/:slug', permanent: true },
      { source: '/product-75', destination: '/explore', permanent: true },
      { source: '/frameworks', destination: '/explore', permanent: true },
      { source: '/flashcards', destination: '/explore', permanent: true },
      { source: '/simulation', destination: '/prep', permanent: true },
      { source: '/interview-prep', destination: '/prep', permanent: true },
      { source: '/interview-prep/:slug', destination: '/prep/:slug', permanent: true },
      // Learn → Explore redirects (merged sections)
      { source: '/learn', destination: '/explore', permanent: true },
      { source: '/learn/flow', destination: '/explore/flow', permanent: true },
      { source: '/learn/modules', destination: '/explore/modules', permanent: true },
      { source: '/learn/modules/:slug', destination: '/explore/modules/:slug', permanent: true },
      { source: '/learn/domains', destination: '/explore/domains', permanent: true },
      { source: '/learn/plans', destination: '/explore/plans', permanent: true },
      { source: '/learn/plans/:slug', destination: '/explore/plans/:slug', permanent: true },
      { source: '/learn/:slug', destination: '/explore/modules/:slug', permanent: true },
      { source: '/learn/:slug/:chapter', destination: '/explore/modules/:slug/:chapter', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  telemetry: false,
  sourcemaps: {
    disable: !sentrySourceMapsConfigured,
  },
  routeManifestInjection: false,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
})
