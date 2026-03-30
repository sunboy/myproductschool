import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

const adminNav = [
  { href: '/admin', icon: 'dashboard', label: 'Overview' },
  { href: '/admin/content', icon: 'edit_document', label: 'Content' },
  { href: '/admin/users', icon: 'group', label: 'Users' },
  { href: '/admin/luma-queue', icon: 'rate_review', label: 'Luma Queue' },
  { href: '/admin/revenue', icon: 'payments', label: 'Revenue' },
  { href: '/admin/waitlist', icon: 'mail', label: 'Waitlist' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Admin sidebar */}
      <nav className="w-56 bg-surface-container-low border-r border-outline-variant flex flex-col">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-outline-variant">
          <LumaGlyph size={20} className="text-primary" />
          <span className="font-headline text-sm font-bold text-on-surface">Admin</span>
        </div>
        <div className="flex-1 px-2 py-3 space-y-1">
          {adminNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors text-sm"
            >
              <span className="material-symbols-outlined text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="px-4 py-4 border-t border-outline-variant">
          <Link href="/dashboard" className="text-xs text-on-surface-variant hover:text-on-surface flex items-center gap-1">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to app
          </Link>
        </div>
      </nav>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
