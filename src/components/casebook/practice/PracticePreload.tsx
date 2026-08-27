'use client'

import { Md } from '@/components/ui/Md'
import type { ScenePreload } from './types'

interface PracticePreloadProps {
  preload: ScenePreload
}

/**
 * "What you know so far" panel. Shows the preloaded context markdown and the
 * tables/views already visible to the learner, so the session never opens
 * on a blank page. Does not render seed_transcript verbatim as a chat log —
 * that belongs to the live terminal once it exists; here it is only used
 * (elsewhere, if needed) to seed the session, not shown twice.
 */
// The scene's context_md already opens with its own "## What you know so
// far" heading (see content/casebook/tuesday-dip/scenes.json), so this
// panel does not render a duplicate section heading above it.
export function PracticePreload({ preload }: PracticePreloadProps) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
      <div className="font-body text-sm leading-relaxed text-on-surface">
        <Md variant="compact">{preload.context_md}</Md>
      </div>

      {preload.visible_tables.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {preload.visible_tables.map((table) => (
            <span
              key={table}
              className="rounded-full bg-surface-container-high px-3 py-1 font-mono text-xs text-on-surface-variant"
            >
              {table}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
