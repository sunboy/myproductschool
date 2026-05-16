import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import { FlowFrameworkPage } from './FlowFrameworkPage'

export const metadata: Metadata = buildMetadata({
  title: 'FLOW Framework | HackProduct',
  description:
    'Learn how HackProduct scores career-changing judgment practice with FLOW: Frame, List, Optimize, and Win across product and technical disciplines.',
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
  return <FlowFrameworkPage />
}
