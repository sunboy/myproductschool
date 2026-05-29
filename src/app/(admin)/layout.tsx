import Link from 'next/link'
import { redirect } from 'next/navigation'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { isCurrentUserAdmin } from '@/lib/api/admin-helpers'

const adminNav = [
  { href: '/admin', icon: 'dashboard', label: 'Overview' },
  { href: '/admin/content', icon: 'edit_document', label: 'Content' },
  { href: '/admin/users', icon: 'group', label: 'Users' },
  { href: '/admin/community', icon: 'forum', label: 'Community' },
  { href: '/admin/hatch-queue', icon: 'rate_review', label: 'Hatch Queue' },
  { href: '/admin/discussions', icon: 'forum', label: 'Discussions' },
  { href: '/admin/voice-violations', icon: 'rule', label: 'Voice Rules' },
  { href: '/admin/revenue', icon: 'payments', label: 'Revenue' },
  { href: '/admin/coupons', icon: 'local_offer', label: 'Coupons' },
  { href: '/admin/audit-log', icon: 'policy', label: 'Audit Log' },
  { href: '/admin/waitlist', icon: 'mail', label: 'Waitlist' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) redirect('/dashboard')

  return (
    <div className="min-h-screen min-w-0 bg-background md:flex">
      {/* Admin sidebar */}
      <nav className="sticky top-0 z-40 flex w-full flex-col border-b border-outline-variant bg-surface-container-low md:h-screen md:w-56 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 border-b border-outline-variant px-4 py-3 md:py-4">
          <HatchGlyph size={20} className="text-primary" />
          <span className="font-headline text-sm font-bold text-on-surface">Admin</span>
        </div>
        <div className="flex gap-1 overflow-x-auto px-2 py-2 md:block md:flex-1 md:space-y-1 md:overflow-x-visible md:py-3">
          {adminNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface md:w-full md:gap-3"
            >
              <span className="material-symbols-outlined text-base">{item.icon}</span>
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="hidden border-t border-outline-variant px-4 py-4 md:block">
          <Link href="/dashboard" className="text-xs text-on-surface-variant hover:text-on-surface flex items-center gap-1">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to app
          </Link>
        </div>
      </nav>
      <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
    </div>
  )
}
