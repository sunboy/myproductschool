import Stripe from 'stripe'
import {
  BILLING_PLANS,
  type BillingPlanConfig,
  type BillingPlanId,
} from '../billing/plans'

export const STRIPE_API_VERSION = '2026-02-25.clover'

export type StripeRuntimeMode = 'live' | 'test'
export type StripeEnv = Record<string, string | undefined>

export interface StripePlanRuntimeConfig extends BillingPlanConfig {
  priceId: string | null
}

export interface StripeRuntimeConfig {
  mode: StripeRuntimeMode
  secretKey: string | null
  publishableKey: string | null
  isConfigured: boolean
  error: string | null
}

function trimEnv(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function isLiveSecretKey(value: string | null): boolean {
  return value?.startsWith('sk_live_') === true || value?.startsWith('rk_live_') === true
}

function isTestSecretKey(value: string | null): boolean {
  return value?.startsWith('sk_test_') === true || value?.startsWith('rk_test_') === true
}

function isLivePublishableKey(value: string | null): boolean {
  return value?.startsWith('pk_live_') === true
}

function isTestPublishableKey(value: string | null): boolean {
  return value?.startsWith('pk_test_') === true
}

export function getStripeMode(env: StripeEnv = process.env): StripeRuntimeMode {
  const explicitMode = trimEnv(env.STRIPE_MODE ?? env.NEXT_PUBLIC_STRIPE_MODE)
  if (explicitMode === 'test' || env.STRIPE_TEST_MODE === 'true') return 'test'
  if (explicitMode === 'live') return 'live'

  const secretKey = trimEnv(env.STRIPE_TEST_SECRET_KEY ?? env.STRIPE_SECRET_KEY)
  if (isTestSecretKey(secretKey)) return 'test'

  const publishableKey = trimEnv(env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  if (isTestPublishableKey(publishableKey)) return 'test'

  return 'live'
}

function getSecretKeyForMode(
  mode: StripeRuntimeMode,
  env: StripeEnv
): string | null {
  if (mode === 'test') {
    return trimEnv(env.STRIPE_TEST_SECRET_KEY) ?? trimEnv(env.STRIPE_SECRET_KEY)
  }

  return trimEnv(env.STRIPE_SECRET_KEY)
}

function getPublishableKeyForMode(
  mode: StripeRuntimeMode,
  env: StripeEnv
): string | null {
  if (mode === 'test') {
    return trimEnv(env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY) ?? trimEnv(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  }

  return trimEnv(env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY) ?? trimEnv(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
}

export function getStripeRuntimeConfig(
  env: StripeEnv = process.env
): StripeRuntimeConfig {
  const mode = getStripeMode(env)
  const secretKey = getSecretKeyForMode(mode, env)
  const publishableKey = getPublishableKeyForMode(mode, env)

  if (!secretKey) {
    return {
      mode,
      secretKey,
      publishableKey,
      isConfigured: false,
      error: `Missing Stripe ${mode} secret key`,
    }
  }

  const secretMatchesMode = mode === 'test'
    ? isTestSecretKey(secretKey)
    : isLiveSecretKey(secretKey)

  if (!secretMatchesMode) {
    return {
      mode,
      secretKey,
      publishableKey,
      isConfigured: false,
      error: mode === 'test'
        ? 'Stripe test mode requires an sk_test_ or rk_test_ secret key'
        : 'Stripe live mode requires an sk_live_ or rk_live_ secret key',
    }
  }

  if (publishableKey) {
    const publishableMatchesMode = mode === 'test'
      ? isTestPublishableKey(publishableKey)
      : isLivePublishableKey(publishableKey)

    if (!publishableMatchesMode) {
      return {
        mode,
        secretKey,
        publishableKey,
        isConfigured: false,
        error: mode === 'test'
          ? 'Stripe test mode requires a pk_test_ publishable key'
          : 'Stripe live mode requires a pk_live_ publishable key',
      }
    }
  }

  return {
    mode,
    secretKey,
    publishableKey,
    isConfigured: true,
    error: null,
  }
}

function getPriceIdForPlan(
  planId: BillingPlanId,
  mode: StripeRuntimeMode,
  env: StripeEnv
): string | null {
  const liveKey = planId === 'monthly' ? 'STRIPE_PRICE_MONTHLY' : 'STRIPE_PRICE_ANNUAL'
  const testKey = planId === 'monthly' ? 'STRIPE_TEST_PRICE_MONTHLY' : 'STRIPE_TEST_PRICE_ANNUAL'

  if (mode === 'test') {
    const explicitTestPrice = trimEnv(env[testKey])
    if (explicitTestPrice) return explicitTestPrice

    const activePrice = trimEnv(env[liveKey])
    return activePrice?.startsWith('price_') && isTestSecretKey(trimEnv(env.STRIPE_SECRET_KEY))
      ? activePrice
      : null
  }

  return trimEnv(env[liveKey])
}

export function getStripePlanConfig(
  planId: BillingPlanId,
  env: StripeEnv = process.env
): StripePlanRuntimeConfig {
  const mode = getStripeMode(env)
  return {
    ...BILLING_PLANS[planId],
    priceId: getPriceIdForPlan(planId, mode, env),
  }
}

export function createStripeClient(
  env: StripeEnv = process.env
): { stripe: Stripe | null; config: StripeRuntimeConfig } {
  const config = getStripeRuntimeConfig(env)
  if (!config.isConfigured || !config.secretKey) return { stripe: null, config }

  return {
    stripe: new Stripe(config.secretKey, { apiVersion: STRIPE_API_VERSION }),
    config,
  }
}

function absoluteAssetUrl(appUrl: string, assetPath: string): string {
  return new URL(assetPath, appUrl).toString()
}

export function getCheckoutBrandingSettings(
  appUrl: string,
  env: StripeEnv = process.env
): Stripe.Checkout.SessionCreateParams.BrandingSettings {
  const logoUrl = trimEnv(env.STRIPE_BRANDING_LOGO_URL)
    ?? absoluteAssetUrl(appUrl, '/images/wordmark.png')
  const iconUrl = trimEnv(env.STRIPE_BRANDING_ICON_URL)
    ?? absoluteAssetUrl(appUrl, '/images/logo.png')

  return {
    display_name: 'HackProduct',
    background_color: '#f8f3ea',
    button_color: '#2d5a3d',
    border_style: 'rounded',
    font_family: 'inter',
    icon: { type: 'url', url: iconUrl },
    logo: { type: 'url', url: logoUrl },
  }
}
