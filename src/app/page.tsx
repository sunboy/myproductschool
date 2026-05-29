import { V3LandingPage, v3LandingMetadata } from '@/components/landing-v3/V3LandingPage'
import '@/app/(marketing)/v3/v3-landing.css'

export const metadata = v3LandingMetadata

export default function RootPage() {
  return <V3LandingPage />
}
