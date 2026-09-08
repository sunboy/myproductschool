import { V5LandingPage, v5LandingMetadata } from '@/components/landing-v5/V5LandingPage'
import { getAppFlag } from '@/lib/config/app-flags'
import '@/app/(marketing)/v5-landing/v5-landing.css'

export const metadata = v5LandingMetadata

export default async function RootPage() {
  const dense = await getAppFlag('ui_density_v1', false)
  return <V5LandingPage dense={dense} />
}
