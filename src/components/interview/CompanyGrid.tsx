'use client'

const COMPANIES = [
  { name: 'Meta', icon: 'groups', slug: 'meta' },
  { name: 'Google', icon: 'search', slug: 'google' },
  { name: 'Stripe', icon: 'credit_card', slug: 'stripe' },
  { name: 'Airbnb', icon: 'home', slug: 'airbnb' },
  { name: 'Uber', icon: 'local_taxi', slug: 'uber' },
  { name: 'DoorDash', icon: 'delivery_dining', slug: 'doordash' },
  { name: 'Anthropic', icon: 'psychology', slug: 'anthropic' },
  { name: 'Notion', icon: 'description', slug: 'notion' },
  { name: 'Figma', icon: 'palette', slug: 'figma' },
  { name: 'Linear', icon: 'linear_scale', slug: 'linear' },
]

interface CompanyGridProps {
  selectedSlug?: string
  onSelect?: (slug: string) => void
}

export function CompanyGrid({ selectedSlug, onSelect }: CompanyGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {COMPANIES.map(company => (
        <a
          key={company.slug}
          href={`/interview-prep/${company.slug}`}
          onClick={() => onSelect?.(company.slug)}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all hover:bg-surface-container-high ${selectedSlug === company.slug ? 'border-primary bg-primary-fixed' : 'border-outline-variant bg-surface-container'}`}
        >
          <span className="material-symbols-outlined text-2xl text-primary">{company.icon}</span>
          <span className="text-xs font-label font-semibold text-on-surface text-center">{company.name}</span>
        </a>
      ))}
      <button className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-dashed border-outline-variant bg-surface cursor-pointer hover:bg-surface-container transition-all">
        <span className="material-symbols-outlined text-2xl text-on-surface-variant">add_circle</span>
        <span className="text-xs font-label font-semibold text-on-surface-variant text-center">Add Custom</span>
      </button>
    </div>
  )
}
