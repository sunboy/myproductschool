import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/domains', destination: '/explore', permanent: true },
      { source: '/domains/:slug', destination: '/explore/:slug', permanent: true },
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

export default nextConfig
