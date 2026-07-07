import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/seo/site'
import { getPostBySlug } from '@/lib/blog/queries'

export const alt = 'HackProduct blog post'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'
export const dynamic = 'force-dynamic'

const FALLBACK_TITLE = 'The HackProduct Letter'
const FALLBACK_DEK = 'Product judgment and AI-native engineering, written by Hatch.'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  const title = post?.title ?? FALLBACK_TITLE
  const dek = post?.dek ?? FALLBACK_DEK

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#faf6f0',
          color: '#2e3230',
          fontFamily: 'Arial, sans-serif',
          padding: 64,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                background: '#4a7c59',
                color: '#faf6f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 38,
                fontWeight: 900,
              }}
            >
              H
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, color: '#4a7c59' }}>{SITE_NAME}</div>
          </div>
          <div style={{ color: '#6b6358', fontSize: 20, fontWeight: 800 }}>The HackProduct Letter</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 1000 }}>
          <div style={{ color: '#705c30', fontSize: 22, fontWeight: 900, letterSpacing: 4 }}>
            HACKPRODUCT.COM/BLOG
          </div>
          <div style={{ fontSize: title.length > 60 ? 52 : 64, lineHeight: 1.08, fontWeight: 900, color: '#2e3230' }}>
            {title}
          </div>
          <div style={{ maxWidth: 940, color: '#4a4e4a', fontSize: 26, lineHeight: 1.4 }}>{dek}</div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {['Frame', 'List', 'Optimize', 'Win'].map((label) => (
            <div
              key={label}
              style={{
                borderRadius: 999,
                background: '#f0e8db',
                color: '#4a7c59',
                padding: '16px 22px',
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  )
}
