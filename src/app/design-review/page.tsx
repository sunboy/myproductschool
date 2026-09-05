import type { Metadata } from 'next'
import { VisualReview } from './review'
import './review.css'

export const metadata: Metadata = { title: 'Visual design review', robots: { index: false, follow: false } }
export default async function DesignReviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const value = (key: string) => typeof params[key] === 'string' ? params[key] as string : undefined
  return <VisualReview key={`${value('view')}:${value('challenge')}:${value('state')}`} view={value('view') ?? 'home'} challenge={value('challenge')} firstVisit={value('state') === 'new'} embed={value('embed') === '1'} />
}
