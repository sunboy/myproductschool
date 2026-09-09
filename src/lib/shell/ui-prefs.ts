import { z } from 'zod'

export const UiPrefsSchema = z.object({
  nav_collapsed: z.boolean().optional(),
  practice_view: z.enum(['list', 'cards']).optional(),
}).strict()

export type UiPrefs = z.infer<typeof UiPrefsSchema>

export const UI_PREFS_STORAGE_KEY = 'hp:ui-prefs'

export function mergeUiPrefs(current: UiPrefs | null | undefined, patch: UiPrefs): UiPrefs {
  return { ...(current ?? {}), ...patch }
}

export function readLocalUiPrefs(storage: Storage | undefined = typeof window !== 'undefined' ? window.localStorage : undefined): UiPrefs {
  if (!storage) return {}
  try {
    const raw = storage.getItem(UI_PREFS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = UiPrefsSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : {}
  } catch {
    return {}
  }
}

export function writeLocalUiPrefs(prefs: UiPrefs, storage: Storage | undefined = typeof window !== 'undefined' ? window.localStorage : undefined) {
  if (!storage) return
  try { storage.setItem(UI_PREFS_STORAGE_KEY, JSON.stringify(prefs)) } catch { /* quota or private mode: ignore */ }
}

/** Persist a prefs patch: local mirror first (instant), then the server. Returns the merged prefs. */
export async function persistUiPrefs(current: UiPrefs | null | undefined, patch: UiPrefs): Promise<UiPrefs> {
  const merged = mergeUiPrefs(current, patch)
  writeLocalUiPrefs(merged)
  try {
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ui_prefs: patch }),
    })
  } catch { /* offline: local mirror still applied */ }
  return merged
}
