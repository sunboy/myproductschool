import Link from 'next/link'
import { MOCK_COMPANIES } from '@/lib/mock-data'
import { getChallenges } from '@/lib/data/challenges'
import { notFound } from 'next/navigation'
import { StartSimulationButton } from '@/components/interview/StartSimulationButton'

export default async function CompanyProfilePage({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params
  const company = MOCK_COMPANIES.find(c => c.slug === companySlug)
  if (!company) notFound()

  const challenges = await getChallenges()
  // Show a curated subset (first 3) as recommended challenges
  const recommended = challenges.slice(0, 3)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/interview-prep" className="hover:text-primary transition-colors">Interview Prep</Link>
        <span>/</span>
        <span className="text-on-surface">{company.name}</span>
      </div>

      {/* Company header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="font-headline font-bold text-primary text-2xl">{company.name[0]}</span>
        </div>
        <div>
          <h1 className="font-headline text-3xl font-bold text-on-surface">{company.name}</h1>
          <p className="text-on-surface-variant">{company.industry} · {company.stage && <span className="capitalize">{company.stage}</span>}</p>
        </div>
      </div>

      {/* Interview style */}
      <div className="p-5 bg-surface-container rounded-2xl border border-outline-variant space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">psychology</span>
          <h2 className="font-medium text-on-surface">Interview Style</h2>
        </div>
        <p className="text-sm text-on-surface leading-relaxed">{company.interview_style}</p>
        {company.notes && (
          <div className="mt-3 pt-3 border-t border-outline-variant">
            <p className="text-sm text-on-surface-variant italic">{company.notes}</p>
          </div>
        )}
      </div>

      {/* Start simulation CTA */}
      <div className="p-5 bg-primary-container rounded-2xl space-y-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">record_voice_over</span>
          <div>
            <h2 className="font-medium text-on-primary-container">Run a simulation</h2>
            <p className="text-sm text-primary">Luma will act as a {company.name} PM interviewer.</p>
          </div>
        </div>
        <StartSimulationButton companyId={company.id} companyName={company.name} />
      </div>

      {/* Recommended challenges */}
      <section>
        <h2 className="font-headline text-xl font-bold text-on-surface mb-4">Recommended Challenges</h2>
        <div className="space-y-3">
          {recommended.map(challenge => (
            <Link
              key={challenge.id}
              href={`/challenges/${challenge.id}`}
              className="flex items-start gap-4 p-4 bg-surface-container rounded-xl border border-outline-variant hover:bg-surface-container-high transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-on-surface">{challenge.title}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{challenge.domain.title} · {challenge.difficulty} · ~{challenge.estimated_minutes} min</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant flex-shrink-0">chevron_right</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
