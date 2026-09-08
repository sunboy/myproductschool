'use client'
export function SettingsTitleRow({ isPro }: { isPro: boolean }) {
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const chip = 'rounded-full border border-hairline bg-card-bright px-2.5 py-0.5 text-[11px] font-semibold hover:bg-surface-container'
  return (
    <div data-testid="settings-title" className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <h1 className="font-headline text-[26px] font-bold leading-none">Settings{isPro && <span className="ml-2 rounded-full bg-amber-soft px-2 py-0.5 align-middle text-[10px] font-bold text-tertiary">Pro</span>}</h1>
      <div className="flex gap-1.5">
        <button type="button" data-testid="chip-account" onClick={() => go('settings-account')} className={chip}>Account</button>
        <a href="/settings/notifications" data-testid="chip-notifications" className={chip}>Notifications</a>
        <button type="button" data-testid="chip-membership" onClick={() => go('settings-membership')} className={chip}>Membership</button>
      </div>
    </div>
  )
}
