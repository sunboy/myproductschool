'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface TocItem {
  id: string;
  label: string;
}

interface TocOverlayProps {
  items: TocItem[];
  activeSection: string | null;
  open: boolean;
  onClose: () => void;
  onNavigate: (id: string) => void;
}

export function TocOverlay({ items, activeSection, open, onClose, onNavigate }: TocOverlayProps) {
  const shouldReduce = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="toc-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduce ? 0 : 0.2 }}
          className="sc-toc-overlay"
          onClick={onClose}
        >
          <motion.nav
            role="navigation"
            aria-label="Table of contents"
            initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: shouldReduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="sc-toc-panel"
            onClick={event => event.stopPropagation()}
          >
            <div className="sc-toc-panel__header">
              <div>
                <div className="sc-eyebrow">Contents</div>
                <h2>Jump to section</h2>
              </div>
              <button className="sc-icon-btn" type="button" onClick={onClose} aria-label="Close table of contents">
                <span className="material-symbols-outlined msi-sm" aria-hidden="true">close</span>
              </button>
            </div>
            <div className="sc-toc-list">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className={activeSection === item.id ? 'active' : ''}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <span>{item.label}</span>
                  {activeSection === item.id && <i aria-hidden="true" />}
                </button>
              ))}
            </div>
          </motion.nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
