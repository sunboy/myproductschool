// Per-variant data shapes — narrowed from IllustrationConfig.data

export interface ComparisonBarsData {
  bars: Array<{
    label: string
    value: number          // 0–100
    color?: 'primary' | 'secondary' | 'tertiary'
  }>
  insightText?: string
}

export interface FlywheelData {
  steps: Array<{ label: string; icon?: string }>
  centerLabel?: string
}

export interface ToolStackData {
  replaced: Array<{ name: string; icon?: string }>
  replacement: string
}

export interface BlockAnatomyData {
  blocks: Array<{
    type: string
    label: string
    color?: 'primary' | 'secondary' | 'tertiary'
  }>
}

export interface PricingTiersData {
  tiers: Array<{
    name: string
    price: string
    features: string[]
    highlighted?: boolean
  }>
}
