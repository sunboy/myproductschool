import type { Metadata } from 'next'
import {
  CtaBand,
  DirectoryHero,
  DirectorySection,
  DirectoryShell,
} from '@/components/directory/DirectoryChrome'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl } from '@/lib/seo/site'
import { COMPARISON_DIRECTORIES } from '@/lib/seo/directory-content'

const comparison = COMPARISON_DIRECTORIES.leetcode

export const metadata: Metadata = buildMetadata({
  title: comparison.metaTitle,
  description: comparison.metaDescription,
  path: '/alternatives/leetcode',
  keywords: ['LeetCode alternative', 'product sense practice', 'AI interview practice', 'coding interview alternative'],
})

export default function LeetcodeAlternativePage() {
  return (
    <DirectoryShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'HackProduct', path: canonicalUrl('/') },
            { name: 'Alternatives', path: canonicalUrl('/alternatives/leetcode') },
            { name: 'LeetCode alternative', path: canonicalUrl('/alternatives/leetcode') },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: comparison.title,
            description: comparison.summary,
            url: canonicalUrl('/alternatives/leetcode'),
          },
        ]}
      />
      <DirectoryHero
        eyebrow="LeetCode alternative"
        title="Practice more than algorithm recall."
        description={comparison.summary}
        secondaryHref="/skills/coding"
        secondaryLabel="Explore coding practice"
      />
      <DirectorySection title="HackProduct vs. LeetCode">
        <div className="overflow-hidden rounded-2xl bg-surface-container-lowest ring-1 ring-outline-variant/35">
          <div className="grid grid-cols-[0.7fr_1fr_1fr] bg-[#1e3528] px-4 py-3 text-sm font-bold text-[#f3ede0]">
            <div>Dimension</div>
            <div>LeetCode</div>
            <div>HackProduct</div>
          </div>
          {comparison.comparisons.map(([dimension, leetcode, hackproduct]) => (
            <div key={dimension} className="grid grid-cols-[0.7fr_1fr_1fr] border-t border-outline-variant/35 px-4 py-4 text-sm leading-6">
              <div className="font-bold text-on-surface">{dimension}</div>
              <div className="text-on-surface-variant">{leetcode}</div>
              <div className="font-semibold text-on-surface">{hackproduct}</div>
            </div>
          ))}
        </div>
      </DirectorySection>
      <DirectorySection shaded title="When HackProduct is the better fit">
        <div className="grid gap-3 md:grid-cols-2">
          {[
            'You need product sense, system design, SQL, and coding communication in one place.',
            'You are an engineer trying to become more product-minded in the AI era.',
            'You want live interview pressure, not only silent problem solving.',
            'You want feedback on reasoning quality, not only pass/fail test cases.',
          ].map((item) => (
            <div key={item} className="rounded-xl bg-surface-container-lowest p-5 text-sm font-semibold leading-6 ring-1 ring-outline-variant/35">
              {item}
            </div>
          ))}
        </div>
      </DirectorySection>
      <CtaBand title="Keep LeetCode for algorithms. Add HackProduct for judgment." />
    </DirectoryShell>
  )
}
