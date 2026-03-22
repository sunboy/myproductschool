import { getDomains } from '@/lib/data/domains'
import { DomainCard } from '@/components/learning/DomainCard'

const DOMAIN_DURATIONS: Record<string, string> = {
  'Product Strategy': '~30 min',
  'User Research': '~25 min',
  'Metrics & Analytics': '~25 min',
  'Prioritization': '~20 min',
  'Go-to-Market': '~20 min',
}

export default async function DomainsPage() {
  const domains = await getDomains()

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold text-on-surface">Domains</h1>
        <p className="text-on-surface-variant mt-1">Core areas of product thinking — pick one to dive in.</p>
      </div>

      <div className="mb-6">
        <span className="text-xs font-semibold font-label text-on-surface-variant uppercase tracking-widest">Layer 1</span>
        <h2 className="font-headline text-2xl text-on-surface mt-1">Build your mental models</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {domains.map(domain => (
          <DomainCard
            key={domain.id}
            domain={domain}
            duration={DOMAIN_DURATIONS[domain.title] ?? '~20 min'}
            isFree={true}
          />
        ))}
      </div>
    </div>
  )
}
