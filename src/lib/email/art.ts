/**
 * Email art assets — Hatch character poses + reused brand assets.
 *
 * All URLs are absolute so they render correctly in email clients
 * (which cannot resolve relative paths).
 */

function emailAssetUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://www.hackproduct.com'
  return `${base}${path}`
}

/** Hatch character poses generated for email use. */
export const EMAIL_ART: Record<string, string> = {
  /** Welcome / greeting emails */
  'hatch-wave': emailAssetUrl('/images/email/hatch-wave.png'),
  /** Resume-a-challenge nudge: Hatch gesturing toward unfinished work */
  'hatch-point': emailAssetUrl('/images/email/hatch-point.png'),
  /** Article / autopsy resume: Hatch reading */
  'hatch-read': emailAssetUrl('/images/email/hatch-read.png'),
  /** Upgrade nudge (free → Pro): Hatch with key/unlock motif */
  'hatch-unlock': emailAssetUrl('/images/email/hatch-unlock.png'),
  /** Wins / paid-track celebration */
  'hatch-celebrate': emailAssetUrl('/images/email/hatch-celebrate.png'),
  /** Paid insights: Hatch with chart + lightbulb */
  'hatch-insight': emailAssetUrl('/images/email/hatch-insight.png'),
}

/** Reused brand assets. */
export const EMAIL_BRAND = {
  wordmark: emailAssetUrl('/images/wordmark.png'),
  clapGif: emailAssetUrl('/videos/hatch/clap-32-transparent.gif'),
}

/**
 * Newsletter-specific art (The HackProduct Letter). Separate from EMAIL_ART
 * since these are layout banners, not per-scenario character poses.
 */
export const NEWSLETTER_ART = {
  /** Email header banner (~1200x300, legible at 600px display width) */
  'newsletter-header': emailAssetUrl('/hatch/newsletter-header.png'),
}
