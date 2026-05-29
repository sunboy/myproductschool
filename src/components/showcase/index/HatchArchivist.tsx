'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { HatchGlyph } from '@/components/shell/HatchGlyph';

/**
 * Phase 1 placeholder for the Hatch Archivist surface.
 * Shows Hatch in "reviewing" state with a teaser message.
 * Phase 2 will connect this to an actual AI-powered recommendation endpoint.
 */
export function HatchArchivist() {
  const shouldReduce = useReducedMotion();

  return (
    <motion.section
      initial={shouldReduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 mx-6 my-8 overflow-hidden rounded-2xl p-6 lg:mx-8"
      style={{
        background: 'linear-gradient(135deg, rgba(61,214,140,0.06) 0%, rgba(240,192,112,0.04) 100%)',
        border: '1px solid var(--color-glass-stroke)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <HatchGlyph size={48} state="reviewing" className="text-primary" />
        </div>
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--color-primary)' }}
          >
            Hatch Archivist
          </p>
          <h3
            className="mt-1 text-base font-bold"
            style={{
              color: 'var(--color-on-surface)',
              fontFamily: 'var(--font-display)',
            }}
          >
            Personalized reading paths, coming soon.
          </h3>
          <p
            className="mt-1.5 max-w-prose text-sm leading-relaxed"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            Hatch is learning which decisions sharpen your reasoning. It will surface stories matched to your gaps, not just what is popular.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
