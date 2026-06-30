/**
 * The single source of truth for the four FLOW moves: their canonical label,
 * key, short tagline, Material Symbol icon, and Terra-harmonious color.
 *
 * Before this, FLOW move colors were defined at least three incompatible ways
 * (generic blue/green/amber/purple in MoveLevelsCard, a Terra-ish set in
 * live-interviews, and CSS --color-flow-* tokens), and the labels drifted
 * ("Weigh/Sell" on the skill ladder vs "Optimize/Win" everywhere else). Both
 * are now resolved here: import from this module, never hardcode a move color
 * or relabel a move.
 *
 * Color discipline: a single accent identity (forest green) with warm tonal
 * variations, NOT four unrelated hues. Each move reads as part of one family.
 */

export type FlowMoveKey = 'frame' | 'list' | 'optimize' | 'win'

export interface FlowMove {
  key: FlowMoveKey
  /** Canonical user-facing label. Never "Weigh" or "Sell". */
  label: string
  /** Material Symbols Outlined icon name. */
  icon: string
  /** One-line description of the reasoning move. */
  tagline: string
  /** Solid accent (text / bar / dot). */
  color: string
  /** Soft tinted background (rgba) for chips and tracks. */
  soft: string
  /** Border tint (rgba). */
  border: string
}

export const FLOW_MOVES: Record<FlowMoveKey, FlowMove> = {
  frame: {
    key: 'frame',
    label: 'Frame',
    icon: 'crop_free',
    tagline: 'Find the real problem before designing the fix',
    color: '#4a7c59', // primary forest
    soft: 'rgba(74,124,89,0.10)',
    border: 'rgba(74,124,89,0.28)',
  },
  list: {
    key: 'list',
    label: 'List',
    icon: 'account_tree',
    tagline: 'Generate structurally distinct options, not variations',
    color: '#37706f', // teal-leaning green, same family
    soft: 'rgba(55,112,111,0.10)',
    border: 'rgba(55,112,111,0.28)',
  },
  optimize: {
    key: 'optimize',
    label: 'Optimize',
    icon: 'balance',
    tagline: 'Name the criterion and the tradeoff that resolves it',
    color: '#a9772f', // Terra amber/tertiary
    soft: 'rgba(169,119,47,0.12)',
    border: 'rgba(169,119,47,0.30)',
  },
  win: {
    key: 'win',
    label: 'Win',
    icon: 'flag',
    tagline: 'Make the strategy a falsifiable hypothesis with a metric',
    color: '#7a5d33', // deep warm brown, anchors the set
    soft: 'rgba(122,93,51,0.12)',
    border: 'rgba(122,93,51,0.30)',
  },
}

export const FLOW_MOVE_ORDER: FlowMoveKey[] = ['frame', 'list', 'optimize', 'win']

/** Resolve a move color from a key/label in any casing; falls back to primary. */
export function flowMoveColor(keyOrLabel: string | null | undefined): string {
  if (!keyOrLabel) return '#4a7c59'
  const k = keyOrLabel.toLowerCase() as FlowMoveKey
  return FLOW_MOVES[k]?.color ?? '#4a7c59'
}

/** Canonical label for a move key/label in any casing. */
export function flowMoveLabel(keyOrLabel: string | null | undefined): string {
  if (!keyOrLabel) return ''
  const k = keyOrLabel.toLowerCase() as FlowMoveKey
  return FLOW_MOVES[k]?.label ?? keyOrLabel
}
