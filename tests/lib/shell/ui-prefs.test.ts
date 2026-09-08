import { describe, it, expect } from 'vitest'
import { UiPrefsSchema, mergeUiPrefs, readLocalUiPrefs, writeLocalUiPrefs, UI_PREFS_STORAGE_KEY } from '@/lib/shell/ui-prefs'

describe('ui-prefs', () => {
  it('accepts partial prefs and rejects unknown view values', () => {
    expect(UiPrefsSchema.parse({ nav_collapsed: true })).toEqual({ nav_collapsed: true })
    expect(UiPrefsSchema.parse({ practice_view: 'cards' })).toEqual({ practice_view: 'cards' })
    expect(() => UiPrefsSchema.parse({ practice_view: 'grid' })).toThrow()
  })
  it('merges without dropping existing keys', () => {
    expect(mergeUiPrefs({ nav_collapsed: true }, { practice_view: 'list' })).toEqual({ nav_collapsed: true, practice_view: 'list' })
  })
  it('mirrors to localStorage', () => {
    const store: Record<string, string> = {}
    const ls = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v } } as unknown as Storage
    writeLocalUiPrefs({ nav_collapsed: true }, ls)
    expect(store[UI_PREFS_STORAGE_KEY]).toBe('{"nav_collapsed":true}')
    expect(readLocalUiPrefs(ls)).toEqual({ nav_collapsed: true })
  })
})
