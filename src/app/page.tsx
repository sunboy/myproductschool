import '@/app/(marketing)/home/solid-landing.css'
import { SolidLanding } from '@/components/landing-solid/SolidLanding'
import { JsonLdScript } from '@/lib/seo/json-ld'
import { buildMetadata } from '@/lib/seo/site'
import { organizationJsonLd, softwareApplicationJsonLd, websiteJsonLd } from '@/lib/seo/directory-content'

export const metadata = buildMetadata({
  title: 'HackProduct | Build Product Judgment Before the Room Tests It',
  description:
    'Practice messy product, system, data, SQL, coding, and AI-workflow scenarios. Hatch pushes your reasoning. FLOW shows the weak move.',
  path: '/',
  keywords: [
    'product judgment practice',
    'product sense practice',
    'system design practice',
    'SQL interview practice',
    'AI workflow practice',
    'live AI interview practice',
  ],
})

export default function RootPage() {
  return (
    <>
      <JsonLdScript data={[organizationJsonLd(), websiteJsonLd(), softwareApplicationJsonLd()]} />
      <SolidLanding />
    </>
  )
}
