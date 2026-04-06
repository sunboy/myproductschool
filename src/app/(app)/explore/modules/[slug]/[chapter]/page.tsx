'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ChapterRedirect({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>
}) {
  const { slug, chapter } = use(params)
  const router = useRouter()

  useEffect(() => {
    router.replace(`/learn/${slug}?chapter=${chapter}`)
  }, [slug, chapter, router])

  return null
}
