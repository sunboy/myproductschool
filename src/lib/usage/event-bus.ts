'use client'

// Usage event bus — notifies the usage indicator to refetch immediately
// without waiting for the 30s SWR poll interval.
//
// Usage: In client components that call AI endpoints, call usageEventBus.emit()
// after the fetch resolves to immediately refresh the usage indicator.
// Example: after await fetch('/api/hatch/chat', ...) → usageEventBus.emit()

type UsageListener = () => void

const listeners = new Set<UsageListener>()

export const usageEventBus = {
  emit() {
    listeners.forEach(fn => fn())
  },
  subscribe(fn: UsageListener): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
}
