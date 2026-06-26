/**
 * Company tags are stored as lowercase kebab slugs ("meta", "openai",
 * "hugging-face", "amazon-(zipline)"). Rendering them raw makes the UI read
 * unprofessional ("Asked at meta", "openai", "tiktok"). This is the single
 * source of truth for turning a stored tag into a properly-cased display name.
 *
 * Strategy:
 *  1. Explicit overrides for irregular brand casing (OpenAI, TikTok, eBay…).
 *  2. Otherwise Title-Case the kebab slug, with a small set of token fixups
 *     (AI → AI, API → API, etc.) and parenthetical preserved+cased.
 *
 * Import `formatCompany` everywhere a company tag is shown. Never render a raw
 * company_tags value.
 */

/** Irregular brand names that title-casing can't produce. Keys are the stored slug. */
const COMPANY_OVERRIDES: Record<string, string> = {
  openai: 'OpenAI',
  tiktok: 'TikTok',
  ebay: 'eBay',
  github: 'GitHub',
  'github-copilot': 'GitHub Copilot',
  gitlab: 'GitLab',
  youtube: 'YouTube',
  paypal: 'PayPal',
  paypal_braintree: 'PayPal',
  paypay: 'PayPay',
  paypal_venmo: 'Venmo',
  whatsapp: 'WhatsApp',
  paytm: 'Paytm',
  hubspot: 'HubSpot',
  doordash: 'DoorDash',
  'hugging-face': 'Hugging Face',
  'weights-and-biases': 'Weights & Biases',
  'scale-ai': 'Scale AI',
  'google-deepmind': 'Google DeepMind',
  google_deepmind: 'Google DeepMind',
  'jpmorgan-chase': 'JPMorgan Chase',
  'goldman-sachs': 'Goldman Sachs',
  'jane-street': 'Jane Street',
  'two-sigma': 'Two Sigma',
  'capital-one': 'Capital One',
  'stack-overflow': 'Stack Overflow',
  'hacker-news': 'Hacker News',
  hackernews: 'Hacker News',
  'the-trade-desk': 'The Trade Desk',
  thoughtworks: 'ThoughtWorks',
  servicenow: 'ServiceNow',
  cockroachdb: 'CockroachDB',
  cosmosdb: 'Cosmos DB',
  faunadb: 'FaunaDB',
  orientdb: 'OrientDB',
  arangodb: 'ArangoDB',
  yugabyte: 'YugabyteDB',
  tidb: 'TiDB',
  'clickhouse-inc.': 'ClickHouse',
  planetscale: 'PlanetScale',
  launchdarkly: 'LaunchDarkly',
  pagerduty: 'PagerDuty',
  dbt_labs: 'dbt Labs',
  'dbt-labs': 'dbt Labs',
  'neptune.ai': 'neptune.ai',
  'neuralink': 'Neuralink',
  appnexus: 'AppNexus',
  namecheap: 'Namecheap',
  godaddy: 'GoDaddy',
  sendgrid: 'SendGrid',
  mailchimp: 'Mailchimp',
  'booking.com': 'Booking.com',
  "sotheby's": "Sotheby's",
  'twitter/x': 'X (Twitter)',
  x: 'X',
  m365: 'Microsoft 365',
  icloud: 'iCloud',
  onedrive: 'OneDrive',
  chatgpt: 'ChatGPT',
  langsmith: 'LangSmith',
  mlflow: 'MLflow',
  vrbo: 'Vrbo',
  wise: 'Wise',
  fict_b2b: 'a B2B company',
  'fict-b2b': 'a B2B company',
  fict_b2c: 'a B2C company',
  'fict-b2c': 'a B2C company',
  internal: 'an internal team',
  marketplace: 'a marketplace',
  real: 'a real product',
  airlines: 'an airline',
}

/** Tokens (after splitting on hyphen/space) that have fixed casing. */
const TOKEN_FIXUPS: Record<string, string> = {
  ai: 'AI',
  api: 'API',
  ml: 'ML',
  ses: 'SES',
  dsp: 'DSP',
  kms: 'KMS',
  apm: 'APM',
  vip: 'VIP',
  b2b: 'B2B',
  b2c: 'B2C',
  ip: 'IP',
  sql: 'SQL',
  aws: 'AWS',
  gcp: 'GCP',
  'co.': 'Co.',
}

function titleizeToken(token: string): string {
  if (TOKEN_FIXUPS[token]) return TOKEN_FIXUPS[token]
  return token.charAt(0).toUpperCase() + token.slice(1)
}

/** Turn a stored company tag/slug into a display name. */
export function formatCompany(tag: string | null | undefined): string {
  if (!tag) return ''
  const slug = tag.trim().toLowerCase()
  if (!slug) return ''
  if (COMPANY_OVERRIDES[slug]) return COMPANY_OVERRIDES[slug]

  // Preserve a trailing parenthetical and case it separately: "amazon-(zipline)".
  const parenMatch = slug.match(/^(.*?)[-\s]*\((.+)\)\s*$/)
  if (parenMatch) {
    const base = formatCompany(parenMatch[1])
    const inner = formatCompany(parenMatch[2])
    return `${base} (${inner})`
  }

  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(titleizeToken)
    .join(' ')
}

/** "Asked at {Company}" helper for challenge cards, skipping fictional tags. */
export function askedAtLabel(tag: string | null | undefined): string | null {
  if (!tag) return null
  const display = formatCompany(tag)
  if (!display) return null
  // Fictional/placeholder tags read better without "Asked at".
  if (/^(a |an |the )/.test(display)) return display
  return `Asked at ${display}`
}
