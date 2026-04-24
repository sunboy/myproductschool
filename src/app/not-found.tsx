import Link from 'next/link'

export default function RootNotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
      <div className="flex items-center gap-2 mb-10">
        <span className="font-headline text-2xl font-bold text-primary">HackProduct</span>
      </div>
      <span
        className="material-symbols-outlined text-6xl text-on-surface-variant mb-4"
        style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}
      >
        search_off
      </span>
      <h1 className="font-headline text-3xl font-bold text-on-surface mb-2">Page not found</h1>
      <p className="text-on-surface-variant text-sm mb-8 max-w-xs">
        This page doesn&apos;t exist or has been moved. Let Hatch guide you back.
      </p>
      <Link
        href="/dashboard"
        className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
