import Link from 'next/link'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface AppBreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * Compact single back link for pages where a full trail would crop (long story
 * titles in narrow fixed bars). Points at the previous page in the hierarchy.
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

export function AppBreadcrumbs({ items, className = '' }: AppBreadcrumbsProps) {
  // A lone crumb only ever duplicates the page H1 (and the active nav pill), so
  // render nothing. Multi-item trails (length >= 2) provide real context.
  if (items.length <= 1) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={[
        'flex items-center gap-1.5 text-xs text-on-surface-variant font-label',
        className,
      ].filter(Boolean).join(' ')}
    >
      <ol className="flex min-w-0 items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="max-w-[13rem] truncate rounded-sm font-semibold text-on-surface-variant transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={[
                    'max-w-[16rem] truncate',
                    isLast ? 'font-bold text-on-surface' : 'font-semibold text-on-surface-variant',
                  ].join(' ')}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[14px] leading-none text-on-surface-variant/60"
                >
                  chevron_right
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
