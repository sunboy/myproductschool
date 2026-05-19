'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

interface SectionEnterProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** data-section-id for IntersectionObserver tracking */
  sectionId?: string;
}

/**
 * Wraps a section in a Framer Motion enter animation.
 * Respects prefers-reduced-motion: when true, renders children immediately.
 */
export function SectionEnter({ children, delay = 0, className, sectionId }: SectionEnterProps) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      data-section-id={sectionId}
      className={className}
      initial={shouldReduce ? false : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: 0.65,
        delay: shouldReduce ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
