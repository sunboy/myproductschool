import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

export default function ProfilePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="font-headline text-3xl font-bold text-on-surface">Profile</h1>

      {/* Avatar + name */}
      <div className="flex items-center gap-4 p-5 bg-surface-container rounded-2xl border border-outline-variant">
        <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-on-primary-container">person</span>
        </div>
        <div>
          <p className="font-headline text-xl font-bold text-on-surface">Your Name</p>
          <p className="text-on-surface-variant text-sm">Free tier</p>
        </div>
        <Link href="/pricing" className="ml-auto px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
          Upgrade
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Challenges', value: '0', icon: 'fitness_center' },
          { label: 'Streak', value: '0 days', icon: 'local_fire_department' },
          { label: 'XP', value: '0', icon: 'star' },
        ].map(stat => (
          <div key={stat.label} className="p-4 bg-surface-container rounded-xl border border-outline-variant text-center">
            <span className="material-symbols-outlined text-primary text-xl mb-1 block">{stat.icon}</span>
            <div className="font-bold text-on-surface">{stat.value}</div>
            <div className="text-xs text-on-surface-variant">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Settings links */}
      <div className="space-y-2">
        {[
          { href: '/settings/billing', icon: 'payments', label: 'Billing & subscription' },
          { href: '/pricing', icon: 'workspace_premium', label: 'Upgrade to Pro' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 p-4 bg-surface-container rounded-xl border border-outline-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">{item.icon}</span>
            <span className="text-on-surface text-sm">{item.label}</span>
            <span className="material-symbols-outlined text-on-surface-variant ml-auto">chevron_right</span>
          </Link>
        ))}
      </div>

      {/* Luma branding */}
      <div className="flex items-center gap-3 p-4 bg-primary-container rounded-xl">
        <LumaGlyph size={24} className="text-primary" />
        <p className="text-sm text-on-primary-container">Luma is your AI product coach. Complete challenges to build your product instincts.</p>
      </div>
    </div>
  )
}
