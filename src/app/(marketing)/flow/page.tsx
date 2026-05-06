import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import FlowPageClient from './FlowPageClient'

export const metadata: Metadata = buildMetadata({
  title: 'FLOW Framework | HackProduct',
  description:
    'Learn the four FLOW moves behind HackProduct practice: Frame, List, Optimize, and Win.',
  path: '/flow',
  keywords: [
    'FLOW framework',
    'product thinking framework',
    'product sense practice',
    'product interview framework',
    'HackProduct FLOW',
  ],
})

export default function FlowPage() {
  return <FlowPageClient />
}
