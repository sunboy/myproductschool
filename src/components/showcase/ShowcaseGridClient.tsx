'use client'

import { useEffect, useState } from 'react'
import type { AutopsyProduct } from '@/lib/types'
import { ShowcaseProductCard } from '@/components/showcase/ShowcaseProductCard'

interface Props {
  products: AutopsyProduct[]
}

export function ShowcaseGridClient({ products }: Props) {
  const [progressMap, setProgressMap] = useState<Record<string, number>>({})

  useEffect(() => {
    // Key pattern: hp_showcase_{userId}_{slug}
    // Last segment (split by '_') is the slug
    const map: Record<string, number> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('hp_showcase_')) {
        const parts = key.split('_')
        const slug = parts[parts.length - 1]
        try {
          const data = JSON.parse(localStorage.getItem(key) ?? '{}')
          map[slug] = Object.keys(data).length
        } catch {
          // ignore parse errors
        }
      }
    }
    setProgressMap(map)
  }, [])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map(product => (
        <ShowcaseProductCard
          key={product.id}
          product={product}
          completedCount={progressMap[product.slug] ?? 0}
        />
      ))}
    </div>
  )
}
