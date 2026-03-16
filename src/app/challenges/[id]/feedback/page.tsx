"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import { getFeedback, type LumaFeedback, type DimensionScore } from "@/lib/feedback";
import { LumaSymbol } from "@/components/luma-symbol";

/* ─── Score badge ────────────────────────────────────────────── */
function ScoreBadge({ score, max }: { score: number; max: number }) {
  const pct = Math.round((score / max) * 100);
  const color =
    pct >= 80 ? "text-success" : pct >= 60 ? "text-[var(--warning)]" : "text-danger";
  return (
    <span className={`text-2xl font-bold font-mono tabular-nums ${color}`}>
      {score}
      <span className="text-base font-medium text-muted-foreground">/{max}</span>
    </span>
  );
}

/* ─── Animated dot score ─────────────────────────────────────── */
function DotScore({ dim, visible }: { dim: DimensionScore; visible: boolean }) {
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setFilled(i);
      if (i >= dim.score) clearInterval(interval);
    }, 120);
    return () => clearInterval(interval);
  }, [visible, dim.score]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground">
          {dim.label}
        </span>
        <span className="text-xs font-bold font-mono tabular-nums text-foreground">
          {dim.score}/{dim.max}
        </span>
      </div>
      {/* Dots */}
      <div className="flex items-center gap-1.5" aria-label={`${dim.label}: ${dim.score} out of ${dim.max}`}>
        {Array.from({ length: dim.max }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              i < filled
                ? "bg-primary scale-100"
                : "bg-muted scale-90"
            }`}
            style={{ transitionDelay: visible ? `${i * 80}ms` : "0ms" }}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {dim.explanation}
      </p>
    </div>
  );
}

/* ─── Reveal section wrapper ─────────────────────────────────── */
function RevealSection({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Respect reduced motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) { setVisible(true); return; }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const id = setTimeout(() => setVisible(true), delay);
          obs.disconnect();
          return () => clearTimeout(id);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Dimensions section with intersection trigger ──────────── */
function DimensionsSection({ dimensions }: { dimensions: DimensionScore[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) { setVisible(true); return; }
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <div className="grid grid-cols-2 gap-5 sm:gap-6">
        {dimensions.map((dim, i) => (
          <DotScore key={dim.label} dim={dim} visible={visible} />
        ))}
      </div>
    </div>
  );
}

/* ─── Loading state ──────────────────────────────────────────── */
function FeedbackLoading({ elapsed }: { elapsed: number }) {
  return (
    <div className="max-w-[720px] mx-auto px-4 md:px-8 py-16 space-y-10">
      {/* Luma thinking indicator */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <LumaSymbol size="md" active />
        </div>
        <p className="text-lg font-semibold text-foreground animate-luma-pulse">
          Luma is reviewing your answer…
        </p>
        {elapsed > 15 && (
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Luma is taking longer than usual.{" "}
            <Link href="/dashboard" className="text-primary hover:underline cursor-pointer">
              We'll email you when it's ready.
            </Link>
          </p>
        )}
      </div>

      {/* Skeleton layout */}
      <div className="space-y-6">
        {/* Overall impression skeleton */}
        <div className="space-y-3 py-6 border-y border-border">
          <div className="h-5 w-3/4 rounded-lg bg-muted/60 animate-pulse mx-auto" />
          <div className="h-5 w-1/2 rounded-lg bg-muted/60 animate-pulse mx-auto" />
        </div>
        {/* What worked skeleton */}
        <div className="rounded-lg border-l-4 border-l-success/40 border border-border bg-card p-5 space-y-2">
          <div className="h-4 w-24 rounded bg-muted/60 animate-pulse" />
          <div className="h-3.5 w-full rounded bg-muted/60 animate-pulse" />
          <div className="h-3.5 w-5/6 rounded bg-muted/60 animate-pulse" />
          <div className="h-3.5 w-4/6 rounded bg-muted/60 animate-pulse" />
        </div>
        {/* What to fix skeleton */}
        <div className="rounded-lg border-l-4 border-l-[var(--warning)]/40 border border-border bg-card p-5 space-y-2">
          <div className="h-4 w-28 rounded bg-muted/60 animate-pulse" />
          <div className="h-3.5 w-full rounded bg-muted/60 animate-pulse" />
          <div className="h-3.5 w-full rounded bg-muted/60 animate-pulse" />
          <div className="h-3.5 w-3/4 rounded bg-muted/60 animate-pulse" />
        </div>
        {/* Scores skeleton */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="h-4 w-32 rounded bg-muted/60 animate-pulse mb-4" />
          <div className="grid grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 rounded bg-muted/60 animate-pulse" />
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="w-4 h-4 rounded-full bg-muted/60 animate-pulse" />
                  ))}
                </div>
                <div className="h-3 w-full rounded bg-muted/60 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        {/* The one thing skeleton */}
        <div className="rounded-lg border border-primary/20 bg-primary/4 p-6 space-y-2">
          <div className="h-3.5 w-40 rounded bg-muted/60 animate-pulse" />
          <div className="h-4 w-full rounded bg-muted/60 animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-muted/60 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main feedback page ─────────────────────────────────────── */
export default function FeedbackPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [feedback, setFeedback] = useState<LumaFeedback | null>(null);

  // Simulate Luma processing (1.2–2.5s)
  useEffect(() => {
    const delay = 1200 + Math.random() * 1300;
    const t = setTimeout(() => {
      const data = getFeedback(id);
      setFeedback(data);
      setLoading(false);
    }, delay);
    return () => clearTimeout(t);
  }, [id]);

  // Track elapsed seconds during loading
  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [loading]);

  if (loading) return <FeedbackLoading elapsed={elapsed} />;

  // Fallback for unknown challenge
  if (!feedback) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-foreground font-semibold">
            Feedback not found
          </p>
          <Link href="/challenges">
            <Button variant="outline" size="sm">Back to challenges</Button>
          </Link>
        </div>
      </div>
    );
  }

  const submittedDate = new Date(feedback.submittedAt);
  const pct = Math.round((feedback.totalScore / feedback.maxScore) * 100);
  const scoreColor =
    pct >= 80 ? "text-success" : pct >= 60 ? "text-[var(--warning)]" : "text-danger";
  const scoreBg =
    pct >= 80 ? "bg-success/8 border-success/25" : pct >= 60 ? "bg-[var(--warning)]/8 border-[var(--warning)]/25" : "bg-danger/8 border-danger/25";

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[720px] mx-auto px-4 md:px-8 h-14 flex items-center gap-2">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer shrink-0"
            >
              <LayoutDashboard size={14} className="inline -mt-0.5" />
            </Link>
            <ChevronRight size={12} className="text-muted-foreground/40 shrink-0" />
            <Link
              href="/challenges"
              className="text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer shrink-0"
            >
              Challenges
            </Link>
            <ChevronRight size={12} className="text-muted-foreground/40 shrink-0" />
            <Link
              href={`/challenges/${id}`}
              className="text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer shrink-0 font-mono"
            >
              {feedback.challengeId}
            </Link>
            <ChevronRight size={12} className="text-muted-foreground/40 shrink-0" />
            <span className="text-foreground font-medium truncate">
              Feedback
            </span>
          </nav>
        </div>
      </header>

      <div className="max-w-[720px] mx-auto px-4 md:px-8 py-12 space-y-10">

        {/* ─── 1. Header ─────────────────────────────────────── */}
        <RevealSection delay={0}>
          <div className="space-y-5">
            {/* Luma symbol + label */}
            <div className="flex items-center gap-3">
              <LumaSymbol size="md" active />
              <div>
                <p className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                  Luma's feedback
                </p>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  {feedback.challengeId} · {feedback.challengeTitle}
                </p>
              </div>
              {/* Score pill — top right */}
              <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${scoreBg}`}>
                <span className={`text-sm font-bold font-mono tabular-nums ${scoreColor}`}>
                  {feedback.totalScore}/{feedback.maxScore}
                </span>
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight leading-[1.2]">
              Luma reviewed your answer.
            </h1>

            <p className="text-xs font-mono text-muted-foreground">
              Submitted {submittedDate.toLocaleDateString("en-US", {
                weekday: "short", month: "short", day: "numeric",
              })} at {submittedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </RevealSection>

        {/* ─── 2. Overall impression ─────────────────────────── */}
        <RevealSection delay={150}>
          <div className="py-8 border-y border-border text-center space-y-1">
            <p className="text-[17px] md:text-[19px] text-foreground leading-[1.75] font-medium max-w-[560px] mx-auto">
              {feedback.overallImpression}
            </p>
          </div>
        </RevealSection>

        {/* ─── 3. What worked ────────────────────────────────── */}
        <RevealSection delay={300}>
          <div className="rounded-lg border border-border border-l-[3px] border-l-success bg-card overflow-hidden">
            <div className="px-5 pt-5 pb-1">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={15} className="text-success shrink-0" />
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-success">
                  What worked
                </p>
              </div>
              <p className="text-sm font-semibold text-foreground mb-2">
                {feedback.whatWorked.headline}
              </p>
            </div>
            <div className="px-5 pb-5">
              <p
                className="text-[14px] text-foreground/85 leading-[1.8]"
                dangerouslySetInnerHTML={{
                  __html: feedback.whatWorked.body.replace(
                    /"([^"]+)"/g,
                    '<span class="text-foreground font-medium bg-success/8 px-0.5 rounded">"$1"</span>'
                  ),
                }}
              />
            </div>
          </div>
        </RevealSection>

        {/* ─── 4. What to fix ────────────────────────────────── */}
        <RevealSection delay={450}>
          <div className="rounded-lg border border-border border-l-[3px] border-l-[var(--warning)] bg-card overflow-hidden">
            <div className="px-5 pt-5 pb-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--warning)] shrink-0" />
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--warning)]">
                  What to fix
                </p>
              </div>
              <p className="text-sm font-semibold text-foreground mb-2">
                {feedback.whatToFix.headline}
              </p>
            </div>
            <div className="px-5 pb-5">
              <p
                className="text-[14px] text-foreground/85 leading-[1.8]"
                dangerouslySetInnerHTML={{
                  __html: feedback.whatToFix.body.replace(
                    /"([^"]+)"/g,
                    '<span class="text-foreground font-medium bg-[var(--warning)]/8 px-0.5 rounded">"$1"</span>'
                  ),
                }}
              />
            </div>
          </div>
        </RevealSection>

        {/* ─── 5. Dimension scores ───────────────────────────── */}
        <RevealSection delay={600}>
          <div className="rounded-lg border border-border bg-card p-5 md:p-6">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-5">
              Dimension scores
            </p>
            <DimensionsSection dimensions={feedback.dimensions} />
          </div>
        </RevealSection>

        {/* ─── 6. The one thing ──────────────────────────────── */}
        <RevealSection delay={750}>
          <div className="rounded-lg border border-accent/20 bg-accent/10 p-6 md:p-8 relative overflow-hidden">
            {/* decorative quote mark */}
            <div
              className="absolute -top-2 -left-1 text-[80px] leading-none text-primary/8 select-none pointer-events-none"
              aria-hidden="true"
            >
              &ldquo;
            </div>
            <div className="relative space-y-3">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
                The one thing that would have made this great
              </p>
              <p className="text-[15px] md:text-base text-foreground leading-[1.85]">
                {feedback.theOneThing}
              </p>
            </div>
          </div>
        </RevealSection>

        {/* ─── Divider ───────────────────────────────────────── */}
        <RevealSection delay={850}>
          <div className="h-px bg-border" />
        </RevealSection>

        {/* ─── 7. CTA row ────────────────────────────────────── */}
        <RevealSection delay={950}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Primary: model answer */}
            <Link href={`/challenges/${id}/model-answer`} className="flex-1 sm:flex-none">
              <Button className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 text-primary-foreground h-11">
                See model answer
                <ArrowRight size={14} />
              </Button>
            </Link>

            {/* Secondary: retry */}
            {feedback.retries > 0 ? (
              <Link href={`/challenges/${id}`} className="flex-1 sm:flex-none">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto gap-2 h-11 border-border hover:border-foreground"
                >
                  <RotateCcw size={13} />
                  Try again
                  <span className="text-muted-foreground text-xs">
                    ({feedback.retries} retry remaining)
                  </span>
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                disabled
                className="flex-1 sm:flex-none w-full sm:w-auto gap-2 h-11 opacity-50"
              >
                <RotateCcw size={13} />
                No retries left
              </Button>
            )}

            {/* Tertiary: next challenge */}
            <Link href="/challenges" className="flex-1 sm:flex-none sm:ml-auto">
              <Button
                variant="ghost"
                className="w-full sm:w-auto gap-1.5 h-11 text-muted-foreground hover:text-foreground"
              >
                Next challenge
                <ArrowRight size={13} />
              </Button>
            </Link>
          </div>
        </RevealSection>

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
}
