// lib/sandbox/index.ts — server-side only.
//
// Singleton entry point for the sandbox host. Reads SANDBOX_PROVIDER and
// constructs the matching HostProvider. Import `getSandbox()` from the session
// API routes; never import a concrete provider directly.

import type { HostProvider, SandboxProviderName } from './types'
import { SandboxUnconfiguredError } from './types'
import { CloudRunProvider } from './providers/cloud-run-provider'

export * from './types'

let instance: HostProvider | null = null

export function getSandbox(): HostProvider {
  if (instance) return instance
  const name = (process.env.SANDBOX_PROVIDER ?? 'cloud_run') as SandboxProviderName
  switch (name) {
    case 'cloud_run':
      instance = new CloudRunProvider()
      return instance
    // 'gke' | 'e2b' | 'fly' providers slot in here behind the same interface.
    default:
      throw new SandboxUnconfiguredError(`Unknown SANDBOX_PROVIDER: ${name}`)
  }
}
