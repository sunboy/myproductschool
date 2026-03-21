"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LumaSymbol } from "@/components/luma-symbol";

/* ─── Mock debrief data ──────────────────────────────────────── */
const DEBRIEF = {
  company: "Hex",
  scenario: "Design success metrics for a real-time collaboration feature",
  duration: "14:32",
  totalScore: 11,
  maxScore: 16,
  dimensions: [
    { label: "Structure",     score: 3, max: 4, note: "You organized your thinking logically but revealed the north star metric late." },
    { label: "Depth",         score: 2, max: 4, note: "The metric definitions were present but lacked specific numerical targets." },
    { label: "Handling pushback", score: 3, max: 4, note: "You defended your choices well and adjusted when challenged on DAU." },
    { label: "Communication", score: 3, max: 4, note: "Clear articulation throughout. Stayed concise under pressure." },
  ],
  whatWorked: {
    headline: "You separated adoption from engagement",
    body: "Distinguishing 'users who tried collaboration' from 'users who made it habitual' was the sharpest move in this session. That distinction forces a completely different intervention if adoption is high but habit isn't forming.",
  },
  whatToFix: {
    headline: "No concrete targets until you were pushed",
    body: "You listed metrics without numbers until pressed. A strong answer names the target upfront: '40% of workspaces with ≥2 members have a live session in week 1.' That specificity tells the interviewer you understand what good looks like.",
  },
  theOneThing: "When you list metrics in an interview, always anchor the first one with a number. 'Collaboration adoption' is a metric. '40% of eligible workspaces' is a target. Interviewers are waiting for the number. Give it to them before they have to ask.",
};

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTimeout(() => setVisible(true), delay); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return (
    <div ref={ref} style={{ transition: "opacity 0.5s ease, transform 0.5s ease", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)" }}>
      {children}
    </div>
  );
}

function DotScore({ score, max, visible }: { score: number; max: number; visible: boolean }) {
  const [filled, setFilled] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let i = 0;
    const id = setInterval(() => { i++; setFilled(i); if (i >= score) clearInterval(id); }, 120);
    return () => clearInterval(id);
  }, [visible, score]);
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`block h-2 w-2 rounded-full transition-colors duration-150 ${i < filled ? "bg-primary" : "bg-muted"}`}
        />
      ))}
    </div>
  );
}

export default function SimulationDebriefPage() {
  const [dimsVisible, setDimsVisible] = useState(false);
  const dimsRef = useRef<HTMLDivElement>(null);
  const pct = Math.round((DEBRIEF.totalScore / DEBRIEF.maxScore) * 100);
  const scoreColor = pct >= 75 ? "text-success" : pct >= 55 ? "text-[var(--warning)]" : "text-danger";

  useEffect(() => {
    const el = dimsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setDimsVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-[680px] px-5 h-14 flex items-center justify-between">
          <Link href="/simulation" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <ArrowLeft size={14} />
            New simulation
          </Link>
          <div className="flex items-center gap-2">
            <LumaSymbol size="sm" active />
            <span className="text-xs font-mono text-muted-foreground">Simulation Debrief</span>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[680px] px-5 pb-24">
        {/* Header */}
        <Reveal delay={0}>
          <header className="pt-10 pb-8 border-b border-border/50">
            <p className="text-[11px] font-mono font-semibold tracking-[0.12em] uppercase text-muted-foreground/60 mb-2">
              Simulation — {DEBRIEF.company}
            </p>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Debrief
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {DEBRIEF.scenario} · <span className="font-mono tabular-nums">{DEBRIEF.duration}</span>
            </p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold font-mono tabular-nums ${scoreColor}`}>
                {DEBRIEF.totalScore}
              </span>
              <span className="text-lg font-mono text-muted-foreground">/ {DEBRIEF.maxScore}</span>
              <span className="ml-2 text-sm font-mono text-muted-foreground">(<span className="tabular-nums">{pct}%</span>)</span>
            </div>
          </header>
        </Reveal>

        {/* What worked */}
        <Reveal delay={100}>
          <section className="py-8 border-b border-border/50">
            <p className="text-[11px] font-mono font-semibold tracking-[0.12em] uppercase text-muted-foreground/60 mb-5">What Worked</p>
            <h2 className="text-lg font-semibold text-foreground mb-3 border-l-[3px] border-success pl-4">
              {DEBRIEF.whatWorked.headline}
            </h2>
            <p className="text-[16px] leading-[1.8] text-foreground/90 pl-4 border-l-[3px] border-success/20">
              {DEBRIEF.whatWorked.body}
            </p>
          </section>
        </Reveal>

        {/* What to fix */}
        <Reveal delay={200}>
          <section className="py-8 border-b border-border/50">
            <p className="text-[11px] font-mono font-semibold tracking-[0.12em] uppercase text-muted-foreground/60 mb-5">What to Fix</p>
            <h2 className="text-lg font-semibold text-foreground mb-3 border-l-[3px] border-[var(--warning)] pl-4">
              {DEBRIEF.whatToFix.headline}
            </h2>
            <p className="text-[16px] leading-[1.8] text-foreground/90 pl-4 border-l-[3px] border-[var(--warning)]/20">
              {DEBRIEF.whatToFix.body}
            </p>
          </section>
        </Reveal>

        {/* Dimensions */}
        <Reveal delay={300}>
          <section className="py-8 border-b border-border/50" ref={dimsRef}>
            <p className="text-[11px] font-mono font-semibold tracking-[0.12em] uppercase text-muted-foreground/60 mb-5">Dimensions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DEBRIEF.dimensions.map((dim) => (
                <div key={dim.label} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{dim.label}</p>
                    <span className="text-xs font-mono tabular-nums text-muted-foreground">{dim.score}/{dim.max}</span>
                  </div>
                  <DotScore score={dim.score} max={dim.max} visible={dimsVisible} />
                  <p className="text-xs text-muted-foreground leading-[1.6]">{dim.note}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* The one thing */}
        <Reveal delay={400}>
          <section className="py-8 border-b border-border/50">
            <div className="rounded-lg bg-accent/10 border border-accent/20 px-6 py-6 relative overflow-hidden">
              <span className="absolute -top-4 -left-1 text-[110px] leading-none text-primary/8 select-none pointer-events-none" aria-hidden="true">&ldquo;</span>
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <LumaSymbol size="sm" active />
                  <span className="text-[11px] font-mono font-semibold tracking-[0.12em] uppercase text-primary/70">The one thing</span>
                </div>
                <p className="text-[16px] leading-[1.8] text-foreground">{DEBRIEF.theOneThing}</p>
              </div>
            </div>
          </section>
        </Reveal>

        {/* CTA */}
        <Reveal delay={500}>
          <div className="pt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/simulation" className="w-full sm:w-auto">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                Run another simulation
                <RotateCcw size={14} className="ml-1.5" />
              </Button>
            </Link>
            <Link href="/challenges" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full cursor-pointer">
                Practice a challenge
                <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </Link>
          </div>
        </Reveal>
      </main>
    </div>
  );
}
