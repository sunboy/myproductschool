import Link from 'next/link'

export function GradientFooter() {
  return (
    <footer className="bg-signature-gradient text-[#faf6f0] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-2 md:col-span-1 space-y-6">
            <div className="text-2xl font-headline font-bold">HackProduct</div>
            <p className="text-[#faf6f0]/70 text-sm leading-relaxed max-w-xs">
              The Scholarly Sanctuary for Product Minds. Building the next
              generation of high-impact product thinkers.
            </p>
          </div>
          <div className="space-y-6">
            <h4 className="font-bold text-sm uppercase tracking-widest text-white">
              Platform
            </h4>
            <ul className="space-y-4 text-sm text-[#faf6f0]/70">
              <li>
                <Link className="hover:text-white transition-colors" href="/about">
                  Methodology
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" href="/challenges">
                  Challenges
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" href="/dashboard">
                  AI Coach
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" href="/pricing">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="font-bold text-sm uppercase tracking-widest text-white">
              Resources
            </h4>
            <ul className="space-y-4 text-sm text-[#faf6f0]/70">
              <li>
                <Link className="hover:text-white transition-colors" href="/about">
                  Documentation
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" href="/challenges">
                  Case Studies
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" href="/cohort">
                  Community
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" href="/prep/study-plans">
                  Guides
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="font-bold text-sm uppercase tracking-widest text-white">
              Legal
            </h4>
            <ul className="space-y-4 text-sm text-[#faf6f0]/70">
              <li>
                <Link className="hover:text-white transition-colors" href="/privacy">
                  Privacy
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" href="/terms">
                  Terms
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" href="/privacy">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-[#faf6f0]/50">
            &copy; 2026 HackProduct. The Scholarly Sanctuary for Product Minds.
          </div>
          <div className="flex gap-6">
            <a
              className="text-[#faf6f0]/50 hover:text-white transition-colors"
              href="https://linkedin.com/company/hackproduct"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="material-symbols-outlined text-xl">brand_family</span>
            </a>
            <a
              className="text-[#faf6f0]/50 hover:text-white transition-colors"
              href="https://twitter.com/hackproduct"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="material-symbols-outlined text-xl">share</span>
            </a>
            <a
              className="text-[#faf6f0]/50 hover:text-white transition-colors"
              href="mailto:hello@hackproduct.io"
            >
              <span className="material-symbols-outlined text-xl">alternate_email</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
