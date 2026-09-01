"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { ArrowIcon } from "./icons";

const roles = [
  { label: "SWE", value: "Software Engineer" },
  { label: "Staff Engineer", value: "Staff Engineer" },
  { label: "FDE", value: "Forward-Deployed Engineer" },
  { label: "AI Engineer", value: "AI Engineer" },
  { label: "Tech Lead", value: "Tech Lead" },
  { label: "EM", value: "Engineering Manager" },
];

const dimensions = [
  ["System Design", 88],
  ["Product Judgment", 84],
  ["Scalability", 82],
  ["Tradeoffs", 80],
  ["Communication", 86],
] as const;

function emitRole(role: string | null) {
  window.dispatchEvent(new CustomEvent("hp-role-focus", { detail: role }));
}

function openSignup() {
  window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { mode: "signup" } }));
}

export function V5Hero() {
  const visualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const visual = visualRef.current;
    if (!visual) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const pointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = visual.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width - 0.5;
        const ny = (event.clientY - rect.top) / rect.height - 0.5;
        visual.style.setProperty("--mx", `${nx}`);
        visual.style.setProperty("--my", `${ny}`);
      });
    };
    const reset = () => {
      visual.style.setProperty("--mx", "0");
      visual.style.setProperty("--my", "0");
    };
    visual.addEventListener("pointermove", pointer);
    visual.addEventListener("pointerleave", reset);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      visual.removeEventListener("pointermove", pointer);
      visual.removeEventListener("pointerleave", reset);
    };
  }, []);

  return (
    <section className="hero-reference" id="top">
      <div className="hero-reference-shell">
        <div className="hero-reference-copy">
          <div className="hero-reference-kicker">
            <span aria-hidden="true">✣</span>
            ACE INTERVIEWS. BUILD WHAT&apos;S NEXT.
          </div>

          <h1>
            Practice for<br />
            engineering<br />
            interviews that<br />
            test <em>more than code.</em>
          </h1>

          <p className="hero-reference-lede">
            Graded practice for software engineers, tech leads,{" "}
            <br className="hero-reference-desktop-break" />
            staff engineers, EMs, AI engineers and FDEs across{" "}
            <br className="hero-reference-desktop-break" />
            coding, SQL, system design, product judgment{" "}
            <br className="hero-reference-desktop-break" />
            and AI-directed work.
          </p>

          <div className="hero-reference-roles" aria-label="Prep for">
            {roles.map((role, index) => (
              <button
                key={role.value}
                className={`hero-reference-role ${index === 0 ? "is-active" : ""}`}
                type="button"
                onMouseEnter={() => emitRole(role.value)}
                onMouseLeave={() => emitRole(null)}
                onFocus={() => emitRole(role.value)}
                onBlur={() => emitRole(null)}
                onClick={() => emitRole(role.value)}
              >
                {role.label}
                {index === 0 && <span className="hero-reference-role-dot" aria-hidden="true" />}
              </button>
            ))}
          </div>

          <div className="hero-reference-actions">
            <button type="button" className="hero-reference-primary" onClick={openSignup}>
              Start a practice session <ArrowIcon size={18} />
            </button>
            <a className="hero-reference-secondary" href="#grading">
              <span className="hero-reference-play" aria-hidden="true">▶</span>
              See what gets graded
            </a>
          </div>
        </div>

        <div className="hero-reference-visual" ref={visualRef}>
          <div className="hero-reference-taupe-shape" aria-hidden="true" />
          <div className="hero-reference-green-shape" aria-hidden="true" />
          <div className="hero-reference-amber-shape" aria-hidden="true" />

          <div className="hero-reference-note hero-reference-layer-note">
            You chose eventual<br />consistency. <strong>Defend<br />that decision.</strong>
            <span className="hero-reference-note-tail" aria-hidden="true" />
          </div>

          <div className="hero-reference-hatch hero-reference-layer-hatch" aria-hidden="true">
            <Image src="/landing-v5/hatch-peek.png" alt="" width={840} height={522} priority />
          </div>

          {/* Decorative sample of graded output; not an interactive control. */}
          <article className="hero-reference-review hero-reference-layer-card" aria-label="Sample graded feedback">
            <header className="hero-reference-review-head">
              <div>
                <span className="hero-reference-network-icon" aria-hidden="true">⌘</span>
                <strong>SYSTEM DESIGN</strong>
                <span>•</span>
                <strong>URL SHORTENER</strong>
              </div>
              <time>Completed 2 min ago</time>
            </header>

            <div className="hero-reference-review-main">
              <div className="hero-reference-score" aria-label="Score 86 out of 100">
                <span>86</span>
              </div>
              <div className="hero-reference-strength">
                <h3>Strong</h3>
                <ul>
                  <li>Clarified traffic assumptions</li>
                  <li>Separated read/write paths</li>
                  <li>Explained caching tradeoff</li>
                </ul>
              </div>
            </div>

            <div className="hero-reference-needs">
              <h3>Needs work</h3>
              <span>Failure recovery</span>
              <span>Consistency model</span>
            </div>

            <a className="hero-reference-feedback-link" href="#grading">
              View full feedback <ArrowIcon size={16} />
            </a>
          </article>

          <aside className="hero-reference-dimensions hero-reference-layer-side" aria-label="Dimension breakdown">
            <div className="hero-reference-dimensions-head">
              <span>DIMENSION BREAKDOWN</span>
              <span aria-hidden="true">⌄</span>
            </div>
            {dimensions.map(([label, score]) => (
              <div className="hero-reference-dimension" key={label}>
                <span>{label}</span>
                <i><b style={{ width: `${score}%` }} /></i>
                <strong>{score}</strong>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </section>
  );
}
