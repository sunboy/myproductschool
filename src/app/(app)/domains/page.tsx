import { getDomains } from '@/lib/data/domains'
import { DomainCard } from '@/components/learning/DomainCard'

export default async function DomainsPage() {
  const domains = await getDomains()

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold text-on-surface">Domains</h1>
        <p className="text-on-surface-variant mt-1">Core areas of product thinking — pick one to dive in.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {domains.map(domain => (
          <DomainCard key={domain.id} domain={domain} />
        ))}
      </div>
    </div>
  )
}
