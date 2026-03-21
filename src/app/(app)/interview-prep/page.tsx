import Link from 'next/link'
import { MOCK_COMPANIES } from '@/lib/mock-data'

export default function InterviewPrepPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold text-on-surface">Interview Prep</h1>
        <p className="text-on-surface-variant mt-1">Company-specific product sense preparation.</p>
      </div>

      {/* What is this */}
      <div className="p-5 bg-primary-container rounded-2xl space-y-2">
        <h2 className="font-medium text-on-primary-container">How it works</h2>
        <p className="text-sm text-primary">Pick a company, study their product interview style, then run a simulation with Luma acting as a PM interviewer — tailored to how that company actually interviews.</p>
      </div>

      {/* Companies */}
      <section>
        <h2 className="font-headline text-xl font-bold text-on-surface mb-4">Company Profiles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {MOCK_COMPANIES.map(company => (
            <Link
              key={company.id}
              href={`/interview-prep/${company.slug}`}
              className="p-5 bg-surface-container rounded-2xl border border-outline-variant hover:bg-surface-container-high hover:border-primary/30 transition-all"
            >
              <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center mb-3">
                <span className="font-headline font-bold text-primary text-lg">{company.name[0]}</span>
              </div>
              <h3 className="font-medium text-on-surface">{company.name}</h3>
              <p className="text-sm text-on-surface-variant mt-0.5">{company.industry}</p>
              {company.stage && (
                <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded-full capitalize">{company.stage}</span>
              )}
            </Link>
          ))}

          {/* Coming soon cards */}
          {['Google', 'Meta', 'Airbnb', 'Linear', 'Figma'].map(name => (
            <div
              key={name}
              className="p-5 bg-surface-container rounded-2xl border border-outline-variant opacity-50"
            >
              <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center mb-3">
                <span className="font-headline font-bold text-on-surface-variant text-lg">{name[0]}</span>
              </div>
              <h3 className="font-medium text-on-surface-variant">{name}</h3>
              <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-surface-container-high text-on-surface-variant rounded-full">Coming soon</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
