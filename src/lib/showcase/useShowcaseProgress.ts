'use client'

// useShowcaseProgress.ts
// Three-tier persistence for showcase challenge attempts:
// 1. sessionStorage — instant access, current session only
// 2. localStorage — fast hydration, survives refresh
// 3. Supabase — source of truth, cross-device

// Storage key patterns:
// localStorage: `hp_showcase_{userId}_{slug}`  → Record<number, ShowcaseAttempt>
// sessionStorage: `hp_showcase_session_{slug}` → { selectedIndex: number }

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ShowcaseAttempt } from '@/lib/types'

export function useShowcaseProgress(slug: string, total: number) {
  const [attempts, setAttempts] = useState<Record<number, ShowcaseAttempt>>({})

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()

      // 1. Sync load from localStorage
      let localAttempts: Record<number, ShowcaseAttempt> = {}
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const userId = user?.id
        if (userId) {
          const raw = localStorage.getItem(`hp_showcase_${userId}_${slug}`)
          if (raw) {
            localAttempts = JSON.parse(raw)
          }
        }
      } catch {
        localAttempts = {}
      }

      if (!cancelled) {
        setAttempts(localAttempts)
      }

      // 2. Async load from Supabase — merge, Supabase wins on conflict
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('autopsy_attempts')
          .select('decision_index, points, grade_label, selected_option_label')
          .eq('product_slug', slug)
          .eq('user_id', user.id)

        if (error || !data) return

        const remoteAttempts: Record<number, ShowcaseAttempt> = {}
        for (const row of data) {
          remoteAttempts[row.decision_index] = {
            points: row.points,
            grade_label: row.grade_label,
            decision_index: row.decision_index,
            selected_option_label: row.selected_option_label,
          }
        }

        const merged = { ...localAttempts, ...remoteAttempts }

        // Persist merged result back to localStorage
        try {
          localStorage.setItem(`hp_showcase_${user.id}_${slug}`, JSON.stringify(merged))
        } catch {
          // localStorage write failure is non-fatal
        }

        if (!cancelled) {
          setAttempts(merged)
        }
      } catch {
        // Supabase load failure is non-fatal — local data already set
      }
    }

    load()
    return () => { cancelled = true }
  }, [slug])

  const getAttempt = useCallback(
    (index: number): ShowcaseAttempt | null => attempts[index] ?? null,
    [attempts]
  )

  const saveAttempt = useCallback(
    async (index: number, attempt: ShowcaseAttempt): Promise<void> => {
      // Update local state immediately
      const updated = { ...attempts, [index]: attempt }
      setAttempts(updated)

      // Write to localStorage synchronously
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          localStorage.setItem(`hp_showcase_${user.id}_${slug}`, JSON.stringify(updated))
        }
      } catch {
        // localStorage write failure is non-fatal
      }

      // Write to Supabase asynchronously — fire and forget for UX speed
      ;(async () => {
        try {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          await supabase
            .from('autopsy_attempts')
            .upsert(
              {
                user_id: user.id,
                product_slug: slug,
                decision_index: index,
                points: attempt.points,
                grade_label: attempt.grade_label,
                selected_option_label: attempt.selected_option_label,
              },
              { onConflict: 'user_id,product_slug,decision_index' }
            )
        } catch {
          // Supabase write failure is non-fatal
        }
      })()
    },
    [attempts, slug]
  )

  const getProductProgress = useCallback(
    () => ({
      completed: Object.keys(attempts).length,
      total,
    }),
    [attempts, total]
  )

  return {
    attempts,
    getAttempt,
    saveAttempt,
    getProductProgress,
  }
}
