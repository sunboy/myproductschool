// ATS provider registry (Tier 2). Keyed by provider id so the scan can dispatch
// each curated company to the right fetcher.

import type { AtsProvider } from './context'
import type { CompanyEntry } from '../companies'
import { greenhouseProvider } from './greenhouse'
import { leverProvider } from './lever'
import { ashbyProvider } from './ashby'
import { workableProvider } from './workable'

export const ATS_PROVIDERS: Record<CompanyEntry['provider'], AtsProvider> = {
  greenhouse: greenhouseProvider,
  lever: leverProvider,
  ashby: ashbyProvider,
  workable: workableProvider,
}

export { createProviderContext } from './context'
export type { AtsProvider, ProviderContext } from './context'
