'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface ResumeBannerProps {
  /** label of the section the reader was restored to */
  label: string;
  /** jump back to the top of the story */
  onBackToTop: () => void;
  /** dismiss the banner */
  onDismiss: () => void;
  /** auto-hide after this many ms (0 disables) */
  autoHideMs?: number;
  variant?: 'cinematic' | 'aarrr';
}

/**
 * Brief acknowledgment shown when a reader auto-scrolls a returning user back to
 * where they left off. The scroll restore itself happens in the reader; this is
 * just the "Resumed at X" note plus a back-to-top escape hatch.
 */
export function ResumeBanner({
  label,
  onBackToTop,
  onDismiss,
  autoHideMs = 6000,
  variant = 'cinematic',
}: ResumeBannerProps) {
  const [open, setOpen] = useState(true);
  const reduce = useReducedMotion();
  const dark = variant === 'cinematic';

  useEffect(() => {
    if (!autoHideMs) return;
    const t = setTimeout(() => setOpen(false), autoHideMs);
    return () => clearTimeout(t);
  }, [autoHideMs]);

  const close = () => {
    setOpen(false);
    onDismiss();
  };

  const c = dark
    ? {
        bg: 'rgba(20,22,20,0.82)',
        border: 'rgba(255,255,255,0.1)',
        text: 'rgba(255,255,255,0.88)',
        muted: 'rgba(255,255,255,0.55)',
        accent: '#8ecf9e',
      }
    : {
        bg: '#ffffff',
        border: '#e0d8c8',
        text: '#2e3230',
        muted: '#78715f',
        accent: '#4a7c59',
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-6 flex items-center gap-3"
          style={{
            maxWidth: 640,
            padding: '10px 12px 10px 16px',
            borderRadius: 14,
            background: c.bg,
            border: `1px solid ${c.border}`,
            backdropFilter: dark ? 'blur(16px)' : undefined,
            WebkitBackdropFilter: dark ? 'blur(16px)' : undefined,
            boxShadow: '0 14px 36px -18px rgba(30,27,20,0.35)',
          }}
          role="status"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: c.accent }}
            aria-hidden="true"
          >
            resume
          </span>
          <span
            style={{
              flex: 1,
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: c.text,
              lineHeight: 1.35,
            }}
          >
            Resumed. Picking up at{' '}
            <strong style={{ color: c.accent, fontWeight: 700 }}>{label}</strong>.
          </span>

          <button
            onClick={() => {
              onBackToTop();
              close();
            }}
            style={{
              fontFamily: 'var(--font-label)',
              fontSize: 11,
              fontWeight: 700,
              color: c.muted,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Back to top
          </button>
          <button
            onClick={close}
            aria-label="Dismiss"
            style={{
              display: 'inline-flex',
              color: c.muted,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">
              close
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
