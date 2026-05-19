'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import type { AutopsyCompanyWithStories } from '@/lib/autopsies/types';

interface CompanyDrawerProps {
  company: AutopsyCompanyWithStories | null;
  onClose: () => void;
}

/**
 * A fixed right-side drawer that slides in when a company is selected from
 * the grid. Uses backdrop-filter because it is position:fixed.
 */
export function CompanyDrawer({ company, onClose }: CompanyDrawerProps) {
  const shouldReduce = useReducedMotion();

  return (
    <AnimatePresence>
      {company && (
        <>
          {/* Scrim */}
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduce ? 0 : 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`${company.name} stories`}
            initial={shouldReduce ? { opacity: 0 } : { x: '100%', opacity: 0 }}
            animate={shouldReduce ? { opacity: 1 } : { x: 0, opacity: 1 }}
            exit={shouldReduce ? { opacity: 0 } : { x: '100%', opacity: 0 }}
            transition={{ duration: shouldReduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="glass-overlay fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col overflow-y-auto"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-6"
              style={{ borderBottom: '1px solid var(--color-glass-stroke)' }}
            >
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--color-on-surface-muted)' }}
                >
                  {company.industry}
                </p>
                <h2
                  className="mt-0.5 text-xl font-bold"
                  style={{
                    color: 'var(--color-on-surface)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {company.name}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 transition-colors hover:bg-white/10"
                aria-label="Close drawer"
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={{ color: 'var(--color-on-surface-variant)' }}
                >
                  close
                </span>
              </button>
            </div>

            {/* Company dek */}
            {company.dek && (
              <p
                className="px-6 py-4 text-sm leading-relaxed"
                style={{ color: 'var(--color-on-surface-variant)' }}
              >
                {company.dek}
              </p>
            )}

            {/* Story list */}
            <div className="flex flex-col gap-3 px-6 pb-6">
              {company.stories.map(story => (
                <Link
                  key={story.slug}
                  href={`/explore/showcase/${company.slug}/stories/${story.slug}`}
                  className="glass-tile group flex flex-col gap-1 rounded-xl p-4 transition-all duration-200"
                  onClick={onClose}
                >
                  <h3
                    className="text-sm font-semibold leading-snug"
                    style={{
                      color: 'var(--color-on-surface)',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {story.title}
                  </h3>
                  <div
                    className="flex items-center justify-between text-xs"
                    style={{ color: 'var(--color-on-surface-muted)' }}
                  >
                    <span>{story.estimatedReadTime}</span>
                    <span
                      className="material-symbols-outlined text-base transition-transform group-hover:translate-x-0.5"
                      style={{ color: 'var(--color-primary)', fontSize: '16px' }}
                      aria-hidden="true"
                    >
                      arrow_forward
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Footer link to full hub */}
            <div className="mt-auto px-6 pb-8">
              <Link
                href={`/explore/showcase/${company.slug}`}
                className="block rounded-full py-3 text-center text-sm font-semibold transition-opacity hover:opacity-80"
                style={{
                  background: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                }}
                onClick={onClose}
              >
                View all {company.name} stories
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
