import Link from 'next/link'

export function FloatingNav() {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl bg-background/80 backdrop-blur-xl rounded-full editorial-shadow flex justify-between items-center px-8 py-3">
      <div className="flex items-center gap-2">
        <Link href="/" className="text-2xl font-headline font-bold text-primary tracking-tight">
          HackProduct
        </Link>
      </div>
      <div className="hidden md:flex items-center gap-8">
        <Link
          className="text-sm font-label font-medium text-on-background hover:text-primary-container transition-colors"
          href="/challenges"
        >
          Practice
        </Link>
        <Link
          className="text-sm font-label font-medium text-on-background hover:text-primary-container transition-colors"
          href="/domains"
        >
          Curriculum
        </Link>
        <Link
          className="text-sm font-label font-medium text-on-background hover:text-primary-container transition-colors"
          href="/cohort"
        >
          Community
        </Link>
        <Link
          className="text-sm font-label font-medium text-on-background hover:text-primary-container transition-colors"
          href="/pricing"
        >
          Pricing
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Link
          className="hidden sm:block text-sm font-label font-bold text-on-background hover:text-primary transition-colors"
          href="/login"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-label font-bold ambient-glow hover:scale-95 transition-transform"
        >
          Start Free
        </Link>
      </div>
    </nav>
  )
}
