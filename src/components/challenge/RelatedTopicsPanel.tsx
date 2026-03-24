const TOPICS = [
  { label: 'Grid Systems', variant: 'primary' as const },
  { label: 'Terra Palette', variant: 'default' as const },
  { label: 'Material 3', variant: 'default' as const },
  { label: 'Warm Neutrals', variant: 'default' as const },
  { label: 'Best Practices', variant: 'tertiary' as const },
  { label: 'Accessibility', variant: 'default' as const },
]

export function RelatedTopicsPanel() {
  return (
    <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10">
      <h3 className="font-headline font-bold text-lg mb-4">Related Topics</h3>
      <div className="flex flex-wrap gap-2">
        {TOPICS.map((topic) => (
          <span
            key={topic.label}
            className={
              topic.variant === 'primary'
                ? 'bg-primary-container text-on-primary-fixed-variant px-3 py-1.5 rounded-full text-xs font-bold'
                : topic.variant === 'tertiary'
                  ? 'bg-tertiary-fixed-dim text-on-tertiary-container px-3 py-1.5 rounded-full text-xs font-bold'
                  : 'bg-surface-container-highest text-on-surface-variant px-3 py-1.5 rounded-full text-xs font-medium'
            }
          >
            {topic.label}
          </span>
        ))}
      </div>
    </div>
  )
}
