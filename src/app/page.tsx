import { V5LandingPage, v5LandingMetadata } from '@/components/landing-v5/V5LandingPage'
import '@/app/(marketing)/v5-landing/v5-landing.css'

export const metadata = v5LandingMetadata

export default function RootPage() {
  return <V5LandingPage />
}
