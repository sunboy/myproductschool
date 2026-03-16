"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getModelAnswer,
  type ModelAnswer,
  type AnswerBlock,
  type AlternativeApproach,
} from "@/lib/model-answers";
import { getChallengeDetail } from "@/lib/challenge-detail";
import { LumaSymbol } from "@/components/luma-symbol";

/* ─── Scroll progress bar ────────────────────────────────────── */
function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? (scrolled / max) * 100 : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-transparent"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-primary transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/* ─── Reveal wrapper ─────────────────────────────────────────── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const prefersReduced =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  useEffect(() => {
    if (prefersReduced) { setVisible(true); return; }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay, prefersReduced]);

  return (
    <div
      ref={ref}
      style={{
        transition: prefersReduced ? "none" : "opacity 0.5s ease, transform 0.5s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
      }}
    >
      {children}
    </div>
  );
}

/* ─── Highlighted term ───────────────────────────────────────── */
function HighlightedTerm({ term, text }: { term: string; text: string }) {
  if (!term || !text.includes(term)) {
    return <span>{text}</span>;
  }
  const parts = text.split(term);
  return (
    <span>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <mark className="rounded-sm px-1 py-0.5 font-medium bg-primary/10 text-primary not-italic">
              {term}
            </mark>
          )}
        </span>
      ))}
    </span>
  );
}

/* ─── Answer block renderer ──────────────────────────────────── */
function Block({ block }: { block: AnswerBlock }) {
  if (block.type === "prose") {
    return (
      <p className="text-foreground leading-[1.85] text-[17px]">
        {block.content}
      </p>
    );
  }

  if (block.type === "coaching") {
    return (
      <div className="flex gap-3 pl-4 border-l-2 border-primary/30 my-1">
        <p className="text-muted-foreground italic leading-[1.8] text-[15.5px]">
          {block.content}
        </p>
      </div>
    );
  }

  if (block.type === "trap") {
    return (
      <div className="rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/5 px-5 py-4 flex gap-3">
        <Lightbulb
          className="mt-0.5 shrink-0 text-[var(--warning)]"
          size={16}
          aria-hidden="true"
        />
        <p className="text-foreground/90 leading-[1.75] text-[15.5px]">
          <span className="font-semibold text-[var(--warning)]">The trap: </span>
          {block.content}
        </p>
      </div>
    );
  }

  if (block.type === "highlight") {
    return (
      <p className="text-foreground leading-[1.85] text-[17px]">
        <HighlightedTerm term={block.term ?? ""} text={block.content} />
      </p>
    );
  }

  return null;
}

/* ─── Section ────────────────────────────────────────────────── */
function Section({
  title,
  blocks,
  index,
}: {
  title: string;
  blocks: AnswerBlock[];
  index: number;
}) {
  return (
    <Reveal delay={index * 80}>
      <section className="mb-14">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[11px] font-mono font-semibold tracking-[0.12em] uppercase text-muted-foreground/60">
            {title}
          </span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Blocks */}
        <div className="flex flex-col gap-5">
          {blocks.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </div>
      </section>
    </Reveal>
  );
}

/* ─── Alternative approach card ──────────────────────────────── */
function AlternativeCard({
  approach,
  index,
}: {
  approach: AlternativeApproach;
  index: number;
}) {
  return (
    <Reveal delay={index * 100}>
      <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-3 hover:border-foreground transition-colors duration-200 cursor-default">
        <h3 className="text-[15px] font-semibold text-foreground">
          {approach.name}
        </h3>
        <p className="text-[15px] leading-[1.75] text-foreground/80">
          {approach.summary}
        </p>
        <p className="text-[13px] text-muted-foreground italic border-t border-border pt-3 mt-1">
          {approach.tradeoff}
        </p>
      </div>
    </Reveal>
  );
}

/* ─── Loading skeleton ───────────────────────────────────────── */
function ModelAnswerLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[680px] px-5 py-12">
        <div className="h-4 w-32 rounded bg-muted animate-pulse mb-10" />
        <div className="h-8 w-3/4 rounded bg-muted animate-pulse mb-3" />
        <div className="h-5 w-1/3 rounded bg-muted animate-pulse mb-12" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="mb-12">
            <div className="h-3 w-20 rounded bg-muted animate-pulse mb-6" />
            <div className="flex flex-col gap-3">
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
              <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Tab system ─────────────────────────────────────────────── */
const TABS = [
  { id: "luma", label: "Luma's Answer" },
  { id: "alternatives", label: "Other Approaches" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/* ─── Main page ──────────────────────────────────────────────── */
export default function ModelAnswerPage() {
  const { id } = useParams<{ id: string }>();
  const [answer, setAnswer] = useState<ModelAnswer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("luma");

  useEffect(() => {
    const t = setTimeout(() => {
      setAnswer(getModelAnswer(id));
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [id]);

  if (loading) return <ModelAnswerLoading />;

  if (!answer) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center px-5">
        <BookOpen className="text-muted-foreground" size={40} />
        <p className="text-lg text-foreground font-medium">
          Model answer not yet available
        </p>
        <p className="text-sm text-muted-foreground">
          Luma is still writing this one.
        </p>
        <Link href={`/challenges/${id}/feedback`}>
          <Button variant="outline" size="sm">
            <ArrowLeft size={14} className="mr-1.5" />
            Back to feedback
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <ScrollProgress />

      <div className="min-h-screen bg-background">
        {/* Nav bar */}
        <nav className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-md">
          <div className="mx-auto max-w-[680px] px-5 h-14 flex items-center justify-between gap-4">
            <Link
              href={`/challenges/${id}/feedback`}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              Back to feedback
            </Link>

            <div className="flex items-center gap-2">
              <LumaSymbol size="sm" active />
              <span className="text-xs font-mono font-medium text-muted-foreground">
                Model Answer
              </span>
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="mx-auto max-w-[680px] px-5 pb-24">
          {/* Header */}
          <Reveal delay={0}>
            <header className="pt-12 pb-10 border-b border-border/50">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[11px] font-mono font-semibold tracking-[0.12em] uppercase text-muted-foreground/60">
                  Challenge {id.toUpperCase()}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-[11px] font-mono font-semibold tracking-[0.12em] uppercase text-muted-foreground/60">
                  {answer.domain}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 leading-[1.25]">
                {answer.challengeTitle}
              </h1>

              {/* Byline */}
              <div className="flex items-center gap-2.5 mt-5">
                <LumaSymbol size={22} active />
                <div>
                  <p className="text-[13px] font-semibold text-foreground">
                    Written by Luma
                  </p>
                  <p className="text-[12px] font-mono text-muted-foreground">
                    Model answer · expert level
                  </p>
                </div>
              </div>
            </header>
          </Reveal>

          {/* Tab switcher */}
          <Reveal delay={100}>
            <div className="flex gap-1 mt-8 mb-10 p-1 rounded-xl bg-muted/50 w-fit">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={activeTab === tab.id}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </Reveal>

          {/* Tab: Luma's Answer */}
          {activeTab === "luma" && (
            <>
              {/* Sections */}
              {answer.sections.map((section, i) => (
                <Section
                  key={section.title}
                  title={section.title}
                  blocks={section.blocks}
                  index={i}
                />
              ))}

              {/* The One Thing closing callout */}
              <Reveal delay={answer.sections.length * 80 + 80}>
                <div className="rounded-lg bg-accent/10 border border-accent/20 px-7 py-7 mb-14 relative overflow-hidden">
                  {/* Decorative quote */}
                  <span
                    className="absolute -top-4 -left-1 text-[120px] leading-none text-primary/8 select-none pointer-events-none"
                    aria-hidden="true"
                  >
                    &ldquo;
                  </span>

                  <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                      <LumaSymbol size={18} active />
                      <span className="text-[11px] font-mono font-semibold tracking-[0.12em] uppercase text-primary/70">
                        The one thing that makes this great
                      </span>
                    </div>
                    <p className="text-foreground leading-[1.85] text-[16px]">
                      {answer.oneThing}
                    </p>
                  </div>
                </div>
              </Reveal>
            </>
          )}

          {/* Tab: Other Approaches */}
          {activeTab === "alternatives" && (
            <div className="flex flex-col gap-5 mb-14">
              <Reveal delay={0}>
                <p className="text-[15px] text-muted-foreground leading-[1.75] mb-2">
                  There's more than one right answer here. These are all valid approaches —
                  each reflects a different set of assumptions and tradeoffs.
                </p>
              </Reveal>
              {answer.alternatives.map((alt, i) => (
                <AlternativeCard key={alt.name} approach={alt} index={i} />
              ))}
            </div>
          )}

          {/* Bottom CTA row */}
          <Reveal delay={20}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-6 border-t border-border/50">
              <Link href={`/challenges/${id}/feedback`} className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto cursor-pointer">
                  <ArrowLeft size={14} className="mr-1.5" />
                  Back to feedback
                </Button>
              </Link>

              <div className="flex-1" />

              <Link href="/challenges" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                  Next challenge
                  <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </main>
      </div>
    </>
  );
}
