import type { Metadata } from 'next'
import { OutcomePage } from '@/components/marketing/OutcomePage'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl, SITE_NAME, SITE_URL } from '@/lib/seo/site'
import { getOutcome } from '@/lib/seo/outcomes'

const outcome = getOutcome('uplevel')

export const metadata: Metadata = buildMetadata({
  title: outcome!.metaTitle,
  description: outcome!.metaDescription,
  path: outcome!.path,
  keywords: ['promotion readiness', 'staff engineer product strategy', 'senior engineer uplevel', 'technical judgment'],
})

export default function UplevelOutcomePage() {
  return (
    <>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: SITE_NAME, path: SITE_URL },
            { name: outcome!.title, path: canonicalUrl(outcome!.path) },
          ]),
        ]}
      />
      <OutcomePage outcome={outcome!} />
    </>
  )
}
