import type { Metadata } from 'next'
import Image from 'next/image'

import { HatchCssSpriteLoop, HatchSpritePlayer } from '@/components/hatch/HatchSpritePlayer'

export const metadata: Metadata = {
  title: 'Hatch Motion Preview | HackProduct',
  description: 'Transparent Hatch clap assets rendered as animated WebP and sprite-sheet frame players.',
  robots: {
    index: false,
    follow: false,
  },
}

const assets = [
  {
    label: 'Animated WebP',
    path: '/videos/hatch/clap-32.webp',
    detail: '512 x 512, 32 frames, alpha',
  },
  {
    label: 'Sprite Sheet',
    path: '/videos/hatch/clap-32-sprite-sheet.png',
    detail: '4096 x 2048, 8 columns x 4 rows',
  },
  {
    label: 'GIF Fallback',
    path: '/videos/hatch/clap-32-transparent.gif',
    detail: '512 x 512, transparent fallback',
  },
]

export default function HatchMotionPage() {
  return (
    <main className="min-h-screen bg-[#f6f1e8] px-5 py-8 text-[#173f2b] sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="max-w-3xl">
          <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-[#5e8569]">Hatch motion state</p>
          <h1 className="mt-3 font-headline text-4xl font-bold tracking-normal text-[#173f2b] sm:text-5xl">
            Clapping loop from the original Hatch PNG
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#4f6156]">
            Same transparent 32-frame source, rendered three ways for product surfaces: animated WebP,
            CSS sprite loop, and a controllable JS sprite player.
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-lg border border-[#d8d0bd] bg-white/80 p-5 shadow-sm">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-headline text-xl font-bold">Animated WebP</h2>
              <span className="font-mono text-xs text-[#6f7f73]">32 frames</span>
            </div>
            <div className="mt-5 grid aspect-square place-items-center rounded-lg bg-[#f4f0e6]">
              <Image
                alt="Hatch clapping as an animated transparent WebP"
                className="h-full w-full object-contain"
                height={512}
                src="/videos/hatch/clap-32.webp"
                unoptimized
                width={512}
              />
            </div>
          </article>

          <article className="rounded-lg border border-[#d8d0bd] bg-white/80 p-5 shadow-sm">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-headline text-xl font-bold">CSS Sheet Loop</h2>
              <span className="font-mono text-xs text-[#6f7f73]">8 x 4</span>
            </div>
            <div className="mt-5">
              <HatchCssSpriteLoop />
            </div>
          </article>

          <article className="rounded-lg border border-[#d8d0bd] bg-white/80 p-5 shadow-sm">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-headline text-xl font-bold">JS Frame Player</h2>
              <span className="font-mono text-xs text-[#6f7f73]">scrubbable</span>
            </div>
            <div className="mt-5">
              <HatchSpritePlayer />
            </div>
          </article>
        </section>

        <section className="rounded-lg border border-[#d8d0bd] bg-white/80 p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-headline text-2xl font-bold">Source Sheet</h2>
              <p className="mt-2 text-sm leading-6 text-[#5a6a60]">
                The player uses this single transparent PNG as a deterministic animation source.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {assets.map((asset) => (
                <a
                  className="rounded-md border border-[#cfd8ca] bg-[#f4f0e6] px-3 py-2 text-xs font-bold text-[#2f7048] transition hover:bg-[#e7f1e4]"
                  href={asset.path}
                  key={asset.path}
                >
                  {asset.label}
                </a>
              ))}
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-lg bg-[#f4f0e6] p-4">
            <Image
              alt="Hatch clapping sprite sheet with 32 transparent frames"
              className="max-w-none"
              height={2048}
              src="/videos/hatch/clap-32-sprite-sheet.png"
              unoptimized
              width={4096}
            />
          </div>

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            {assets.map((asset) => (
              <div className="rounded-lg bg-[#f4f0e6] p-4" key={asset.path}>
                <dt className="font-bold text-[#173f2b]">{asset.label}</dt>
                <dd className="mt-1 text-[#5a6a60]">{asset.detail}</dd>
                <dd className="mt-2 font-mono text-xs text-[#6f7f73]">{asset.path}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  )
}
