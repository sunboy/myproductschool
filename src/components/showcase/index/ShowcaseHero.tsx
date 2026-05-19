'use client';

import { useReducedMotion, motion } from 'framer-motion';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface ShowcaseHeroProps {
  totalStories: number;
  totalCompanies: number;
}

export function ShowcaseHero({ totalStories, totalCompanies }: ShowcaseHeroProps) {
  const shouldReduce = useReducedMotion();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [, startTransition] = useTransition();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    startTransition(() => {
      router.push(`/explore/showcase?q=${encodeURIComponent(q)}`);
    });
  };

  return (
    <section className="relative z-10 px-6 pt-20 pb-16 text-center lg:pt-28 lg:pb-20">
      <motion.div
        initial={shouldReduce ? false : { opacity: 0, y: 28, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Eyebrow */}
        <p
          className="mb-4 text-sm font-semibold tracking-widest uppercase"
          style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}
        >
          Product Autopsies
        </p>

        {/* Headline */}
        <h1
          className="mx-auto max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-on-surface)',
          }}
        >
          What actually happened{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-tertiary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            inside the decision.
          </span>
        </h1>

        {/* Subhead */}
        <p
          className="mx-auto mt-5 max-w-xl text-base leading-relaxed sm:text-lg"
          style={{ color: 'var(--color-on-surface-variant)' }}
        >
          {totalStories} stories across {totalCompanies} companies. Every one dissected down to the mechanism that made it work.
        </p>

        {/* Inline search */}
        <form
          onSubmit={handleSearch}
          className="mx-auto mt-8 flex max-w-md items-center gap-2"
          role="search"
          aria-label="Search stories"
        >
          <label htmlFor="showcase-search" className="sr-only">
            Search stories
          </label>
          <div className="relative flex-1">
            <span
              className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl"
              style={{ color: 'var(--color-on-surface-variant)' }}
              aria-hidden="true"
            >
              search
            </span>
            <input
              id="showcase-search"
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search companies, decisions, features…"
              className="w-full rounded-full py-3 pl-10 pr-4 text-sm outline-none transition-shadow focus-visible:ring-2"
              style={{
                background: 'var(--color-surface-container)',
                border: '1px solid var(--color-glass-stroke)',
                color: 'var(--color-on-surface)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-full px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-80 active:opacity-70"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
            }}
          >
            Go
          </button>
        </form>
      </motion.div>
    </section>
  );
}
