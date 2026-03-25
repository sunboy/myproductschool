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
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
