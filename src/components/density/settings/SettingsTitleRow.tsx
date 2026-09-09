'use client'
import { Badge, Chip, Text } from '@/design'
export function SettingsTitleRow({ isPro }: { isPro: boolean }) {
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return (
    <div data-testid="settings-title" className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <Text variant="h2" as="h1" className="flex items-center gap-2 leading-none">Settings{isPro && <Badge tone="pro">Pro</Badge>}</Text>
      <div className="flex gap-1.5">
        <Chip data-testid="chip-account" onClick={() => go('settings-account')}>Account</Chip>
        <Chip asChild><a href="/settings/notifications" data-testid="chip-notifications">Notifications</a></Chip>
        <Chip data-testid="chip-membership" onClick={() => go('settings-membership')}>Membership</Chip>
      </div>
    </div>
  )
}
