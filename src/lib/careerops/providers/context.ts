// Shared fetch context for source providers. Centralizes timeouts, error
// swallowing (a dead board must not kill a whole scan), and JSON/text parsing.

import type { CompanyEntry } from '../companies'
import type { RawListing } from '../types'

export interface ProviderContext {
  fetchJson<T = unknown>(url: string, init?: RequestInit): Promise<T | null>
  fetchText(url: string, init?: RequestInit): Promise<string | null>
}

// ATS providers (Tier 2) fetch one company's board.
export interface AtsProvider {
  id: CompanyEntry['provider']
  fetch(company: CompanyEntry, ctx: ProviderContext): Promise<RawListing[]>
}

const DEFAULT_TIMEOUT_MS = 12_000

export function createProviderContext(timeoutMs = DEFAULT_TIMEOUT_MS): ProviderContext {
  async function withTimeout(url: string, init?: RequestInit): Promise<Response | null> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        cache: 'no-store',
        headers: { 'user-agent': 'HackProduct-CareerOps/1.0', ...(init?.headers ?? {}) },
      })
      if (!res.ok) {
        console.warn(`[careerops] ${res.status} from ${url}`)
        return null
      }
      return res
    } catch (err) {
      console.warn(`[careerops] fetch failed for ${url}:`, (err as Error).message)
      return null
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    async fetchJson<T>(url: string, init?: RequestInit) {
      const res = await withTimeout(url, init)
      if (!res) return null
      try {
        return (await res.json()) as T
      } catch {
        return null
      }
    },
    async fetchText(url: string, init?: RequestInit) {
      const res = await withTimeout(url, init)
      if (!res) return null
      try {
        return await res.text()
      } catch {
        return null
      }
    },
  }
}
