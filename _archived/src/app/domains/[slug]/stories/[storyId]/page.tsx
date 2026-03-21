"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
  LayoutDashboard,
} from "lucide-react";
import { getDomain, type VocabTerm } from "@/lib/domains";
import { LumaSymbol } from "@/components/luma-symbol";

/* ─── Scroll progress hook ────────────────────────────────────── */
function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    function onScroll() {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progress;
}

/* ─── Vocab tooltip ───────────────────────────────────────────── */
function VocabTooltip({
  term,
  onClose,
}: {
  term: VocabTerm;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="tooltip"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-fade-in-up"
    >
      <div className="rounded-lg border border-border bg-card shadow-xl shadow-black/10 dark:shadow-black/30 p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {term.term}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {term.shortDef}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1 rounded-lg hover:bg-muted/60 text-muted-foreground transition-colors duration-150 cursor-pointer"
            aria-label="Close definition"
          >
            <X size={14} />
          </button>
        </div>
        <div className="rounded-lg bg-accent/10 border border-accent/20 p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold font-mono uppercase text-accent">Luma: </span>
            {term.lumaNote}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Prose paragraph with vocab highlighting ─────────────────── */
function ProseParagraph({
  text,
  vocabHighlights,
  allVocab,
  onVocabClick,
}: {
  text: string;
  vocabHighlights?: string[];
  allVocab: VocabTerm[];
  onVocabClick: (term: VocabTerm) => void;
}) {
  if (!vocabHighlights?.length) {
    return (
      <p className="text-base md:text-[17px] text-foreground/90 leading-[1.8] mb-5">
        {text}
      </p>
    );
  }

  // Build vocab lookup map
  const vocabMap: Record<string, VocabTerm> = {};
  for (const v of allVocab) {
    vocabMap[v.term.toLowerCase()] = v;
  }

  // Split text into segments, highlighting vocab terms
  const segments: Array<{ text: string; vocab?: VocabTerm }> = [];
  let remaining = text;

  const highlights = vocabHighlights
    .map((h) => {
      const vt = allVocab.find(
        (v) => v.term.toLowerCase().includes(h.toLowerCase()) || h.toLowerCase().includes(v.term.toLowerCase().split(" ")[0])
      );
      return vt;
    })
    .filter((v): v is VocabTerm => !!v);

  // Simple approach: split on sentence boundaries for newlines
  const paragraphs = text.split("\n\n");

  return (
    <>
      {paragraphs.map((para, pi) => (
        <p
          key={pi}
          className="text-base md:text-[17px] text-foreground/90 leading-[1.8] mb-5"
        >
          {para}
        </p>
      ))}
    </>
  );
}

/* ─── Story reader page ───────────────────────────────────────── */
export default function StoryPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const storyId = typeof params.storyId === "string" ? params.storyId : "";

  const domain = getDomain(slug);
  const story = domain?.stories.find((s) => s.id === storyId);

  const scrollProgress = useScrollProgress();
  const [completed, setCompleted] = useState(story?.completed ?? false);
  const [activeVocab, setActiveVocab] = useState<VocabTerm | null>(null);

  const closeVocab = useCallback(() => setActiveVocab(null), []);

  if (!domain || !story) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-foreground font-semibold">Story not found</p>
          <Link href={`/domains/${slug}`}>
            <Button variant="outline" size="sm">Back to {domain?.name ?? "domain"}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const storyIndex = domain.stories.findIndex((s) => s.id === storyId);
  const nextStory = domain.stories[storyIndex + 1] ?? null;
  const isLast = storyIndex === domain.stories.length - 1;

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Sticky reading progress bar ─────────────────────── */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-muted/40"
        aria-hidden="true"
      >
        <div
          className="h-full bg-foreground transition-all duration-100 ease-linear"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* ─── Top nav ──────────────────────────────────────────── */}
      <header className="sticky top-0.5 z-40 bg-background border-b border-border">
        <div className="max-w-3xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer shrink-0"
            >
              <LayoutDashboard size={14} className="inline -mt-0.5" />
            </Link>
            <ChevronRight size={12} className="text-muted-foreground/40 shrink-0" />
            <Link
              href={`/domains/${slug}`}
              className="text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer shrink-0"
            >
              {domain.name}
            </Link>
            <ChevronRight size={12} className="text-muted-foreground/40 shrink-0" />
            <span className="text-foreground font-medium truncate">
              {story.title}
            </span>
          </nav>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <Clock size={12} />
            {story.readingTimeMin} min read
          </div>
        </div>
      </header>

      {/* ─── Story content ────────────────────────────────────── */}
      <main className="max-w-[680px] mx-auto px-4 md:px-8 py-12 md:py-16">
        {/* Story header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href={`/domains/${slug}`}
              className="text-xs font-medium font-mono text-foreground hover:text-foreground/70 transition-colors duration-150 cursor-pointer"
            >
              {domain.name}
            </Link>
            <span className="text-muted-foreground/40 text-xs">·</span>
            <span className="text-xs text-muted-foreground font-mono">
              Story {storyIndex + 1} of {domain.stories.length}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight leading-[1.15] mb-4">
            {story.title}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {story.subtitle}
          </p>
          <div className="mt-5 flex items-center gap-2">
            <LumaSymbol size="sm" active />
            <span className="text-xs text-muted-foreground">
              Written by Luma · {story.readingTimeMin} min read
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border mb-10" />

        {/* Story sections */}
        <article>
          {story.sections.map((section, si) => (
            <div key={si} className="mb-8">
              {section.heading && (
                <h2 className="text-xl font-semibold text-foreground mb-4 tracking-tight">
                  {section.heading}
                </h2>
              )}
              {section.body.split("\n\n").map((para, pi) => {
                // Highlight vocab terms inline
                const relevantVocab = (section.vocabHighlights ?? [])
                  .map((h) =>
                    domain.vocab.find(
                      (v) =>
                        v.term.toLowerCase().includes(h.replace(/-/g, " ")) ||
                        h.replace(/-/g, " ").includes(v.term.toLowerCase().split(" ")[0])
                    )
                  )
                  .filter((v): v is VocabTerm => !!v);

                return (
                  <HighlightedParagraph
                    key={pi}
                    text={para}
                    vocabTerms={relevantVocab}
                    onVocabClick={setActiveVocab}
                  />
                );
              })}
            </div>
          ))}
        </article>

        {/* Divider */}
        <div className="h-px bg-border my-10" />

        {/* Mark complete + next story */}
        <div className="space-y-4">
          {!completed ? (
            <Button
              onClick={() => setCompleted(true)}
              className="w-full sm:w-auto gap-2 bg-foreground hover:bg-foreground/90 text-background border-0"
            >
              <CheckCircle2 size={16} />
              Mark as complete
            </Button>
          ) : (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-success/30 bg-success/8 w-fit">
              <CheckCircle2 size={16} className="text-success" />
              <span className="text-sm font-medium text-success">
                Story complete
              </span>
            </div>
          )}

          {nextStory ? (
            <Link href={`/domains/${slug}/stories/${nextStory.id}`}>
              <div className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 hover:border-foreground hover:shadow-sm transition-all duration-200 cursor-pointer">
                <div>
                  <p className="text-xs font-medium font-mono text-muted-foreground mb-0.5">
                    Next story
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {nextStory.title}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock size={11} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {nextStory.readingTimeMin} min
                    </span>
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  className="text-muted-foreground group-hover:translate-x-1 group-hover:text-foreground transition-all duration-150 shrink-0"
                />
              </div>
            </Link>
          ) : (
            <Link href={`/domains/${slug}`}>
              <div className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 hover:border-foreground hover:shadow-sm transition-all duration-200 cursor-pointer">
                <div>
                  <p className="text-xs font-medium font-mono text-muted-foreground mb-0.5">
                    All stories read
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    Take the comprehension check →
                  </p>
                </div>
                <ArrowRight
                  size={18}
                  className="text-muted-foreground group-hover:translate-x-1 group-hover:text-foreground transition-all duration-150 shrink-0"
                />
              </div>
            </Link>
          )}
        </div>

        {/* Bottom spacer for tooltip */}
        <div className="h-24" />
      </main>

      {/* Vocab tooltip */}
      {activeVocab && <VocabTooltip term={activeVocab} onClose={closeVocab} />}
    </div>
  );
}

/* ─── Highlighted paragraph ──────────────────────────────────── */
function HighlightedParagraph({
  text,
  vocabTerms,
  onVocabClick,
}: {
  text: string;
  vocabTerms: VocabTerm[];
  onVocabClick: (term: VocabTerm) => void;
}) {
  if (!vocabTerms.length) {
    return (
      <p className="text-base md:text-[17px] text-foreground/90 leading-[1.8] mb-5">
        {text}
      </p>
    );
  }

  // Split text around vocab terms and render highlighted spans
  type Segment = { text: string; vocab?: VocabTerm };
  const segments: Segment[] = [{ text }];

  for (const vocab of vocabTerms) {
    const needle = vocab.term;
    const result: Segment[] = [];
    for (const seg of segments) {
      if (seg.vocab) {
        result.push(seg);
        continue;
      }
      const lower = seg.text.toLowerCase();
      const needleLower = needle.toLowerCase();
      const idx = lower.indexOf(needleLower);
      if (idx === -1) {
        result.push(seg);
      } else {
        if (idx > 0) result.push({ text: seg.text.slice(0, idx) });
        result.push({ text: seg.text.slice(idx, idx + needle.length), vocab });
        if (idx + needle.length < seg.text.length)
          result.push({ text: seg.text.slice(idx + needle.length) });
      }
    }
    segments.splice(0, segments.length, ...result);
  }

  return (
    <p className="text-base md:text-[17px] text-foreground/90 leading-[1.8] mb-5">
      {segments.map((seg, i) =>
        seg.vocab ? (
          <button
            key={i}
            onClick={() => onVocabClick(seg.vocab!)}
            className="inline underline decoration-dotted decoration-accent/60 underline-offset-3 hover:decoration-accent hover:text-accent transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
          >
            {seg.text}
          </button>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </p>
  );
}
