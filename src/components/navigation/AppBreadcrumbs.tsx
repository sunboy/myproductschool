import Link from 'next/link'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface AppBreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function AppBreadcrumbs({ items, className = '' }: AppBreadcrumbsProps) {
  if (items.length === 0) return null

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
