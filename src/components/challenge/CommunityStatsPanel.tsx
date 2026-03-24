interface Props {
  participants: string
  solutions: string
}

export function CommunityStatsPanel({ participants, solutions }: Props) {
  return (
    <div className="bg-surface-container-lowest rounded-lg p-6 editorial-shadow ghost-border">
      <h3 className="font-headline font-bold text-xl mb-6 border-b border-outline-variant/10 pb-4">Challenge Stats</h3>
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-3 bg-surface-container-low rounded-lg">
          <p className="text-[10px] uppercase font-bold text-on-surface-variant/60 mb-1">Participants</p>
          <p className="text-xl font-headline font-bold">{participants}</p>
        </div>
        <div className="p-3 bg-surface-container-low rounded-lg">
          <p className="text-[10px] uppercase font-bold text-on-surface-variant/60 mb-1">Solutions</p>
          <p className="text-xl font-headline font-bold">{solutions}</p>
        </div>
      </div>
    </div>
  )
}
