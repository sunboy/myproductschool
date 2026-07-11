export function QuietInviteRow({ text }: { text: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-hairline bg-card-bright px-[18px] py-4">
      <div className="text-[13px] leading-[1.4] text-ink-secondary">{text}</div>
    </div>
  )
}

export function QuietInviteRail({ title, text }: { title: string; text: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-hairline bg-card-bright p-4">
      <div className="mb-1.5 text-[15.5px] font-bold text-ink-strong">{title}</div>
      <div className="text-[12.5px] leading-[1.5] text-ink-secondary">{text}</div>
    </div>
  )
}
