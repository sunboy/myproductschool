import { WaitlistForm } from '@/components/marketing/WaitlistForm'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

export default function WaitlistPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <LumaGlyph size={48} className="text-primary mx-auto" animated />
        <div>
          <h1 className="font-headline text-4xl font-bold text-on-surface">Join the waitlist</h1>
          <p className="text-on-surface-variant mt-3">
            Be first to access MyProductSchool — the practice gym for product thinking.
            For engineers in interviews and on the job.
          </p>
        </div>
        <WaitlistForm />
      </div>
    </div>
  )
}
