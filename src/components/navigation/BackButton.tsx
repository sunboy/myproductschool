import Link from 'next/link'

interface BackButtonProps {
  /** In-app destination — the page the user came from. */
  href: string
  /** Visible label, e.g. "Back to Explore". Defaults to "Back". */
  label?: string
  className?: string
}

// The platform's single back affordance. Replaces the old breadcrumb trails:
// every page points at the one place the user came from instead of rendering
// a full ancestry trail.
export function BackButton({ href, label = 'Back', className = '' }: BackButtonProps) {
  return (
    <Link
      href={href}
      className={[
        'inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 bg-surface-container-low',
        'py-1.5 pl-2.5 pr-3.5 text-xs font-label font-bold text-on-surface-variant no-underline',
        'transition-colors hover:bg-surface-container hover:text-primary',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        className,
      ].filter(Boolean).join(' ')}
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[16px] leading-none">
        arrow_back
      </span>
      {label}
    </Link>
  )
}

/**
 * Compact single back link for narrow fixed bars (reader headers) where the
 * pill-style BackButton would be too heavy. Points at the previous page.
 */
export function BackCrumb({ href, label, className = '' }: { href: string; label: string; className?: string }) {
  return (
    <Link
      href={href}
      className={[
        'inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-label font-semibold',
        className,
      ].filter(Boolean).join(' ')}
      aria-label={`Back to ${label}`}
    >
      <span
        className="material-symbols-outlined text-[14px] leading-none"
        style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
        aria-hidden="true"
      >
        arrow_back
      </span>
      {label}
    </Link>
  )
}
