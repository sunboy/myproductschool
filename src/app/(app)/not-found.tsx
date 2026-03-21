import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">search_off</span>
      <h2 className="font-headline text-3xl font-bold text-on-surface mb-2">Page not found</h2>
      <p className="text-on-surface-variant mb-6">This page doesn&apos;t exist or has been moved.</p>
      <Link href="/dashboard" className="px-5 py-3 bg-primary text-on-primary rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
        Back to dashboard
      </Link>
    </div>
  )
}
