import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { INSTANT_SLUGS, INSTANT_HOOKS } from '@/lib/lead-magnets/instant'
import { InstantMagnet } from '@/components/landing-v3/lead-magnet/InstantMagnet'
import { V3AuthGate } from '@/components/landing-v3/V3AuthGate'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (!INSTANT_SLUGS.includes(slug)) return {}

  const hook = INSTANT_HOOKS[slug]
  return {
    title: `${hook.headline} | HackProduct`,
    description: hook.sub,
    robots: { index: true, follow: true },
  }
}

export default async function InstantPage({ params }: Props) {
  const { slug } = await params

  if (!INSTANT_SLUGS.includes(slug)) {
    notFound()
  }

  return (
    <>
      <InstantMagnet slug={slug} />
      <V3AuthGate />
    </>
  )
}
