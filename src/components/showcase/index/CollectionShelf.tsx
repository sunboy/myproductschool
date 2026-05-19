'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

interface CollectionShelfProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

export function CollectionShelf({
  title,
  subtitle,
  action,
  children,
  columns = 3,
}: CollectionShelfProps) {
  const shouldReduce = useReducedMotion();

  const colClass = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <section className="relative z-10 px-6 py-10 lg:px-8">
      {/* Section header */}
      <motion.div
        initial={shouldReduce ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6 flex items-end justify-between gap-4"
      >
        <div>
          <h2
            className="text-xl font-bold sm:text-2xl"
            style={{
              color: 'var(--color-on-surface)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="mt-1 text-sm"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="shrink-0">{action}</div>
        )}
      </motion.div>

      {/* Tile grid */}
      <div className={`grid grid-cols-1 gap-4 ${colClass}`}>
        {children}
      </div>
    </section>
  );
}
