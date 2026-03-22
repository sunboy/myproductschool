const EXPERT_PICKS = [
  {
    content:
      'Started with the activation metric drop, traced it to the new-user cohort from the referral campaign...',
    author: 'Alex R.',
  },
  {
    content:
      'The mechanism matters more than the symptom. DAU drop → which segment → what changed → why.',
    author: 'Priya S.',
  },
  {
    content:
      "I explicitly stated what I would NOT investigate first — that was the key to Luma's top score.",
    author: 'Jordan K.',
  },
]

export function ExpertPicksPanel() {
  return (
    <div className="bg-tertiary-container rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-on-tertiary-container">star</span>
        <h2 className="font-headline font-bold text-on-tertiary-container text-lg">Expert Picks</h2>
      </div>
      <ul>
        {EXPERT_PICKS.map((pick, i) => (
          <li key={i} className="py-3 border-b border-tertiary-fixed/30 last:border-0">
            <p className="text-sm text-on-tertiary-container leading-relaxed line-clamp-2">
              "{pick.content}"
            </p>
            <p className="text-xs text-on-tertiary-container/70 mt-1">— {pick.author}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
