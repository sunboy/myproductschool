import { getDomains } from '@/lib/data/domains'
import { getChallenges } from '@/lib/data/challenges'
import { getAllConcepts } from '@/lib/data/concepts'
import Link from 'next/link'

export default async function AdminContentPage() {
  const [domains, challenges, concepts] = await Promise.all([
    getDomains(),
    getChallenges(),
    getAllConcepts(),
  ])

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Content</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage domains, concepts, and challenges ({concepts.length} concepts total)</p>
        </div>
      </div>

      {/* Domains */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-headline text-lg font-bold text-on-surface">Domains ({domains.length})</h2>
        </div>
        <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-high">
              <tr>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Title</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Slug</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Status</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {domains.map(domain => (
                <tr key={domain.id} className="hover:bg-surface-container-high transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">{domain.icon ?? 'grid_view'}</span>
                      <span className="font-medium text-on-surface">{domain.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant font-mono text-xs">{domain.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${domain.is_published ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                      {domain.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/domains/${domain.slug}`} className="text-primary text-xs hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Challenges */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-headline text-lg font-bold text-on-surface">Challenges ({challenges.length})</h2>
        </div>
        <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-high">
              <tr>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Title</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Domain</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Difficulty</th>
                <th className="text-left px-4 py-3 text-on-surface-variant font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {challenges.map(challenge => (
                <tr key={challenge.id} className="hover:bg-surface-container-high transition-colors">
                  <td className="px-4 py-3 font-medium text-on-surface max-w-xs truncate">{challenge.title}</td>
                  <td className="px-4 py-3 text-on-surface-variant text-xs">{challenge.domain.title}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      challenge.difficulty === 'beginner' ? 'bg-primary-container text-on-primary-container' :
                      challenge.difficulty === 'intermediate' ? 'bg-tertiary-container text-on-tertiary-container' :
                      'bg-error-container text-on-error-container'
                    }`}>{challenge.difficulty}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${challenge.is_published ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                      {challenge.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
