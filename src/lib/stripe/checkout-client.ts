export type EmbeddedCheckoutOutcome =
  | { kind: 'checkout'; clientSecret: string }
  | { kind: 'redirect'; url: string }
  | { kind: 'error'; message: string }

export function embeddedCheckoutOutcome(value: unknown): EmbeddedCheckoutOutcome {
  if (!value || typeof value !== 'object') {
    return { kind: 'error', message: 'Could not start checkout. Please try again.' }
  }

  const response = value as {
    clientSecret?: unknown
    url?: unknown
    action?: unknown
    error?: unknown
  }

  if (typeof response.clientSecret === 'string' && response.clientSecret) {
    return { kind: 'checkout', clientSecret: response.clientSecret }
  }

  if (
    response.action === 'manage_subscription'
    && typeof response.url === 'string'
    && response.url
  ) {
    return { kind: 'redirect', url: response.url }
  }

  return {
    kind: 'error',
    message: typeof response.error === 'string'
      ? response.error
      : 'Could not start checkout. Please try again.',
  }
}
