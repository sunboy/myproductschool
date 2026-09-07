"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { V5Brand } from "./V5Brand";
import { ArrowIcon, CloseIcon, MenuIcon } from "./icons";

const practiceLinks = [
  { label: "Coding / DSA", href: "/challenges?type=algorithm" },
  { label: "SQL & Data", href: "/challenges?type=sql" },
  { label: "System Design", href: "/challenges?type=system_design" },
  { label: "Product Judgment", href: "/challenges?type=product_sense" },
  { label: "AI-Directed Analytics", href: "/claude-code-analytics" },
];

const resourceLinks = [
  { label: "Autopsies", href: "/autopsies" },
  { label: "Study plans", href: "/study-plans" },
  { label: "Glossary", href: "/glossary" },
  { label: "Blog", href: "/blog" },
  { label: "Interviews", href: "/interviews/live-ai-interviews" },
];

function NavDropdown({ label, links, viewAllHref }: { label: string; links: typeof practiceLinks; viewAllHref: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="reference-nav-dropdown" ref={ref}>
      <button
        type="button"
        className="reference-nav-dropdown-trigger"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        {label} <span aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="reference-nav-dropdown-menu" role="menu">
          {links.map((link) => (
            <Link key={link.href} href={link.href} role="menuitem" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link className="reference-nav-dropdown-viewall" href={viewAllHref} role="menuitem" onClick={() => setOpen(false)}>
            View all →
          </Link>
        </div>
      )}
    </div>
  );
}

export function V5Header() {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    function onKeyDown(event: KeyboardEvent) {
      if (open && event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function openLogin() {
    window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { mode: "login" } }));
  }
  function openSignup() {
    window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { mode: "signup" } }));
  }

  return (
    <header className="site-header reference-header">
      <div className="header-inner reference-header-inner">
        <V5Brand />
        <nav className="desktop-nav reference-nav" aria-label="Primary navigation">
          <Link href="/">Home</Link>
          <NavDropdown label="Practice" links={practiceLinks} viewAllHref="/practice" />
          <NavDropdown label="Library" links={resourceLinks} viewAllHref="/explore" />
          <Link href="/progress">Progress</Link>
        </nav>
        <div className="header-actions reference-header-actions">
          <button type="button" className="text-link desktop-only" onClick={openLogin}>Log in</button>
          <button type="button" className="reference-header-cta desktop-only" onClick={openSignup}>
            Start practicing <ArrowIcon size={18} />
          </button>
          <button ref={menuButtonRef} className="menu-button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"}>
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      {open && (
        <div className="mobile-menu">
          <nav>
            <Link onClick={() => setOpen(false)} href="/">Home</Link>
            <Link onClick={() => setOpen(false)} href="/practice">Practice</Link>
            <Link onClick={() => setOpen(false)} href="/explore">Library</Link>
            <Link onClick={() => setOpen(false)} href="/progress">Progress</Link>
          </nav>
          <button className="button" onClick={() => { setOpen(false); openSignup(); }} type="button">
            Start practicing
          </button>
        </div>
      )}
    </header>
  );
}
