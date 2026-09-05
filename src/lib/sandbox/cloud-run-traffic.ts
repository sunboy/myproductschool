// Pure traffic-list helpers for the Cloud Run provider. Keeping reconciliation
// here makes the two cost-sensitive invariants testable:
//   1. creating one session never drops another live session's tag;
//   2. tearing one session down removes only that session's tag.

export interface CloudRunTrafficTarget {
  type?: string
  revision?: string
  tag?: string
  percent?: number
  [key: string]: unknown
}

export interface CloudRunServiceState {
  etag?: unknown
  traffic?: unknown
  trafficStatuses?: unknown
}

const LATEST = 'TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST'
const REVISION = 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION'

export function resolveBaseRevision(
  serviceName: string,
  traffic: CloudRunTrafficTarget[],
  trafficStatuses: CloudRunTrafficTarget[],
  configured?: string,
): string | undefined {
  if (configured) {
    const trimmed = configured.trim()
    if (!trimmed) return undefined
    const revision = trimmed.split('/').pop() ?? ''
    const escapedService = serviceName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const sessionRevision = new RegExp(`^${escapedService}-s[0-9a-z]{1,20}$`)
    return sessionRevision.test(revision) ? undefined : revision
  }

  const candidate = [...traffic, ...trafficStatuses].find(
    (target) => target.percent === 100 && !target.tag && target.revision,
  )?.revision
  if (!candidate) return undefined

  // Session revisions are `${serviceName}-s<id>`. For inferred state, accept
  // only an auto-named base revision (`${serviceName}-00001-abc`). Explicitly
  // configured custom revision names are handled above and Cloud Run validates
  // that the target exists and belongs to this service.
  const prefix = `${serviceName}-`
  const tail = candidate.startsWith(prefix) ? candidate.slice(prefix.length) : ''
  return /^\d{5,}-/.test(tail) ? candidate : undefined
}

function otherSessionTargets(
  existing: CloudRunTrafficTarget[],
  excludedTag: string,
): CloudRunTrafficTarget[] {
  return existing.filter(
    (target) =>
      target.type === REVISION &&
      Boolean(target.tag) &&
      target.tag !== excludedTag,
  )
}

export function trafficWithSession(
  existing: CloudRunTrafficTarget[],
  tag: string,
  revision: string,
  baseRevision?: string,
): CloudRunTrafficTarget[] {
  return [
    baseRevision
      ? { type: REVISION, revision: baseRevision, percent: 100 }
      : { type: LATEST, percent: 100 },
    ...otherSessionTargets(existing, tag),
    { type: REVISION, revision, tag, percent: 0 },
  ]
}

export function trafficWithoutSession(
  existing: CloudRunTrafficTarget[],
  tag: string,
  baseRevision?: string,
): CloudRunTrafficTarget[] {
  return [
    baseRevision
      ? { type: REVISION, revision: baseRevision, percent: 100 }
      : { type: LATEST, percent: 100 },
    ...otherSessionTargets(existing, tag),
  ]
}

function serviceTraffic(service: CloudRunServiceState): CloudRunTrafficTarget[] {
  return Array.isArray(service.traffic) ? service.traffic : []
}

function requiredServiceState(
  serviceName: string,
  service: CloudRunServiceState,
  configuredBase?: string,
): { etag: string; baseRevision: string; traffic: CloudRunTrafficTarget[] } {
  if (typeof service.etag !== 'string' || !service.etag) {
    throw new Error('Cloud Run service read returned no etag')
  }
  const traffic = serviceTraffic(service)
  const baseRevision = resolveBaseRevision(
    serviceName,
    traffic,
    Array.isArray(service.trafficStatuses) ? service.trafficStatuses : [],
    configuredBase,
  )
  if (!baseRevision) {
    throw new Error('Cloud Run sterile base revision is unresolved')
  }
  return { etag: service.etag, baseRevision, traffic }
}

export function planSessionTrafficCreate(
  serviceName: string,
  service: CloudRunServiceState,
  tag: string,
  revision: string,
  configuredBase?: string,
): { etag: string; traffic: CloudRunTrafficTarget[] } {
  const state = requiredServiceState(serviceName, service, configuredBase)
  return {
    etag: state.etag,
    traffic: trafficWithSession(state.traffic, tag, revision, state.baseRevision),
  }
}

export function planSessionTrafficRemoval(
  serviceName: string,
  service: CloudRunServiceState,
  tag: string,
  configuredBase?: string,
): { etag: string; traffic: CloudRunTrafficTarget[] } {
  const state = requiredServiceState(serviceName, service, configuredBase)
  return {
    etag: state.etag,
    traffic: trafficWithoutSession(state.traffic, tag, state.baseRevision),
  }
}
