'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, LockKeyhole, Menu, Sparkles, X } from 'lucide-react'
import { landingMenuItems, type LandingMenuItem } from '@/lib/landing/content'

function statusClass(status: LandingMenuItem['status']) {
  if (status === 'Public preview') return 'solid-menu-card__status--public'
  if (status === 'In-app') return 'solid-menu-card__status--app'
  return 'solid-menu-card__status--gated'
}

export function CuriosityMenu() {
  const [open, setOpen] = useState(false)
  const [activeTitle, setActiveTitle] = useState(landingMenuItems[0]?.title ?? '')
  const titleId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousOpen = useRef(open)

  const activeItem = useMemo(
    () => landingMenuItems.find((item) => item.title === activeTitle) ?? landingMenuItems[0],
    [activeTitle],
  )

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    closeButtonRef.current?.focus()

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (previousOpen.current && !open) {
      document.querySelector<HTMLButtonElement>('[data-solid-menu-trigger]')?.focus()
    }
    previousOpen.current = open
  }, [open])

  return (
    <>
      <button
        type="button"
        className="solid-menu-trigger"
        aria-label="Open preview menu"
        aria-expanded={open}
        aria-controls={titleId}
        data-solid-menu-trigger
        onClick={() => setOpen(true)}
      >
        <Menu aria-hidden="true" size={19} />
        <span>Menu</span>
      </button>

      {open ? (
        <div className="solid-menu-layer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <button type="button" className="solid-menu-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="solid-menu-panel">
            <div className="solid-menu-panel__top">
              <div>
                <p className="solid-eyebrow solid-eyebrow--light">Curiosity menu</p>
                <h2 id={titleId}>Peek inside before signup.</h2>
              </div>
              <button ref={closeButtonRef} type="button" className="solid-menu-close" aria-label="Close preview menu" onClick={() => setOpen(false)}>
                <X aria-hidden="true" size={20} />
              </button>
            </div>

            <div className="solid-menu-layout">
              <div className="solid-menu-list" aria-label="Preview areas">
                {landingMenuItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="solid-menu-card"
                    onMouseEnter={() => setActiveTitle(item.title)}
                    onFocus={() => setActiveTitle(item.title)}
                    onClick={() => setOpen(false)}
                  >
                    <span className={`solid-menu-card__status ${statusClass(item.status)}`}>
                      {item.status === 'Public preview' ? <Sparkles aria-hidden="true" size={14} /> : <LockKeyhole aria-hidden="true" size={14} />}
                      {item.status}
                    </span>
                    <span className="solid-menu-card__title">
                      {item.title}
                      <ArrowUpRight aria-hidden="true" size={16} />
                    </span>
                    <span className="solid-menu-card__description">{item.description}</span>
                  </Link>
                ))}
              </div>

              <aside className="solid-menu-preview" aria-live="polite">
                <p>{activeItem?.eyebrow}</p>
                <h3>{activeItem?.title}</h3>
                <span>{activeItem?.description}</span>
                <div className="solid-menu-preview__lock">
                  <LockKeyhole aria-hidden="true" size={17} />
                  Gated depth, public curiosity.
                </div>
              </aside>
            </div>

            <div className="solid-menu-panel__bottom">
              <span>Hatch lets you inspect the map. Signup opens the workspace.</span>
              <Link href="/signup" onClick={() => setOpen(false)}>
                Start free
                <ArrowUpRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
