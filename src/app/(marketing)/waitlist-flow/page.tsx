import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import WaitlistFlowPageClient from './WaitlistFlowPageClient'

export const metadata: Metadata = buildMetadata({
  title: 'FLOW Product Thinking Waitlist | HackProduct',
  description:
    'Join the HackProduct waitlist to practice FLOW, the four-move product thinking framework for product sense interviews.',
  path: '/waitlist-flow',
  keywords: [
    'FLOW waitlist',
    'product thinking waitlist',
    'product sense interview practice',
    'HackProduct waitlist',
    'product manager interview practice',
  ],
})

export default function WaitlistFlowPage() {
  return <WaitlistFlowPageClient />
}
