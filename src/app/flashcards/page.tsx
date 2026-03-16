"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useReducer,
} from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, RotateCcw, ChevronDown, Keyboard, BookOpen, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LumaSymbol } from "@/components/luma-symbol";
import DisplayCards, { type DisplayCardProps } from "@/components/ui/display-cards";
import { PRODUCT_75, P75_DOMAINS, type P75Card, type P75Domain } from "@/lib/product75";

/* ─── Card status ────────────────────────────────────────────── */
type CardStatus = "unseen" | "learning" | "mastered";

type StatusMap = Record<string, CardStatus>;

/* ─── Card state reducer ─────────────────────────────────────── */
type StudyState = {
  statusMap: StatusMap;
  currentIndex: number;
  flipped: boolean;
  slideDir: "in-right" | "in-left" | "out-left" | "out-right" | "none";
};

type StudyAction =
  | { type: "FLIP" }
  | { type: "MARK"; id: string; status: CardStatus }
  | { type: "NAVIGATE"; dir: "next" | "prev"; total: number }
  | { type: "RESET" }
  | { type: "SLIDE_DONE" };

function studyReducer(state: StudyState, action: StudyAction): StudyState {
  switch (action.type) {
    case "FLIP":
      return { ...state, flipped: !state.flipped };
    case "MARK":
      return {
        ...state,
        statusMap: { ...state.statusMap, [action.id]: action.status },
        flipped: false,
        slideDir: "out-left",
      };
    case "NAVIGATE": {
      const next =
        action.dir === "next"
          ? (state.currentIndex + 1) % action.total
          : (state.currentIndex - 1 + action.total) % action.total;
      return {
        ...state,
        flipped: false,
        currentIndex: next,
        slideDir: action.dir === "next" ? "in-right" : "in-left",
      };
    }
    case "RESET":
      return { statusMap: {}, currentIndex: 0, flipped: false, slideDir: "none" };
    case "SLIDE_DONE":
      return { ...state, slideDir: "none" };
    default:
      return state;
  }
}

/* ─── Domain color map ───────────────────────────────────────── */
const DOMAIN_COLORS: Record<P75Domain, string> = {
  Metrics:      "bg-primary/10 text-primary",
  Growth:       "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Payments:     "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Engagement:   "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  Retention:    "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  Monetization: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  Research:     "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  Strategy:     "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  Execution:    "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

/* ─── Domain icon map ────────────────────────────────────────── */
const DOMAIN_ICONS: Record<P75Domain, React.ReactNode> = {
  Metrics:      <TrendingUp className="size-4 text-foreground/70" />,
  Growth:       <Zap className="size-4 text-emerald-400" />,
  Payments:     <BookOpen className="size-4 text-amber-400" />,
  Engagement:   <Zap className="size-4 text-violet-400" />,
  Retention:    <TrendingUp className="size-4 text-rose-400" />,
  Monetization: <BookOpen className="size-4 text-orange-400" />,
  Research:     <BookOpen className="size-4 text-cyan-400" />,
  Strategy:     <TrendingUp className="size-4 text-indigo-400" />,
  Execution:    <Zap className="size-4 text-teal-400" />,
};

/* ─── Domain title color for display cards ───────────────────── */
const DOMAIN_TITLE_COLORS: Record<P75Domain, string> = {
  Metrics:      "text-foreground",
  Growth:       "text-emerald-500",
  Payments:     "text-amber-500",
  Engagement:   "text-violet-500",
  Retention:    "text-rose-500",
  Monetization: "text-orange-500",
  Research:     "text-cyan-500",
  Strategy:     "text-indigo-500",
  Execution:    "text-teal-500",
};

/* ─── Progress ring (SVG) ────────────────────────────────────── */
function ProgressRing({ mastered, total }: { mastered: number; total: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? mastered / total : 0;
  const dash = pct * circ;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
      <circle
        cx="22" cy="22" r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ / 4}
        className="text-success transition-all duration-700"
        style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
      />
      <text x="22" y="26" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor" className="text-foreground font-mono">
        {mastered}
      </text>
    </svg>
  );
}

/* ─── Flashcard (3D flip) ────────────────────────────────────── */
function Flashcard({
  card,
  flipped,
  onFlip,
  slideDir,
  onSlideEnd,
  prefersReduced,
}: {
  card: P75Card;
  flipped: boolean;
  onFlip: () => void;
  slideDir: StudyState["slideDir"];
  onSlideEnd: () => void;
  prefersReduced: boolean;
}) {
  const domainColor = DOMAIN_COLORS[card.domain];

  /* Slide transition style */
  const slideStyle: React.CSSProperties = prefersReduced
    ? {}
    : slideDir === "in-right"
    ? { animation: "slideInRight 0.28s cubic-bezier(0.16,1,0.3,1) forwards" }
    : slideDir === "in-left"
    ? { animation: "slideInLeft 0.28s cubic-bezier(0.16,1,0.3,1) forwards" }
    : slideDir === "out-left"
    ? { animation: "slideOutLeft 0.22s ease-in forwards" }
    : slideDir === "out-right"
    ? { animation: "slideOutRight 0.22s ease-in forwards" }
    : {};

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOutLeft {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(-40px); }
        }
        @keyframes slideOutRight {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(40px); }
        }
      `}</style>

      <div
        style={{
          perspective: prefersReduced ? "none" : "1200px",
          ...slideStyle,
        }}
        onAnimationEnd={onSlideEnd}
        className="w-full max-w-[600px] mx-auto"
      >
        {/* 3D flip container */}
        <div
          onClick={onFlip}
          style={{
            transformStyle: prefersReduced ? "flat" : "preserve-3d",
            transform: !prefersReduced && flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: prefersReduced ? "none" : "transform 0.5s cubic-bezier(0.16,1,0.3,1)",
            position: "relative",
            minHeight: "340px",
            cursor: "pointer",
          }}
          role="button"
          aria-label={flipped ? "Card back — click to flip" : "Card front — click to flip"}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter") onFlip(); }}
        >
          {/* FRONT */}
          <div
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
            className={`absolute inset-0 rounded-2xl border border-foreground/15 bg-card shadow-lg flex flex-col items-center justify-center p-8 gap-4 ${flipped && !prefersReduced ? "invisible" : ""}`}
          >
            {/* Domain badge */}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-[11px] font-semibold font-mono ${domainColor}`}>
              {card.domain}
            </span>

            {/* Term */}
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-center leading-[1.2]">
              {card.term}
            </h2>

            {/* Hint */}
            <p className="text-sm text-muted-foreground text-center">
              Click or press Space to reveal definition
            </p>
          </div>

          {/* BACK */}
          <div
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: prefersReduced ? "none" : "rotateY(180deg)",
            }}
            className={`absolute inset-0 rounded-2xl border border-foreground/15 bg-card shadow-lg flex flex-col justify-between p-6 sm:p-8 gap-5 overflow-y-auto ${!flipped && !prefersReduced ? "invisible" : ""} ${prefersReduced && !flipped ? "hidden" : ""}`}
          >
            <div className="flex flex-col gap-4">
              {/* Term + domain */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-foreground leading-tight">
                  {card.term}
                </h3>
                <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold font-mono ${domainColor}`}>
                  {card.domain}
                </span>
              </div>

              {/* Definition */}
              <p className="text-[16px] leading-[1.7] text-foreground font-medium">
                {card.definition}
              </p>

              {/* Luma's note */}
              <div className="rounded-xl bg-accent/10 border border-accent/20 px-4 py-3 flex gap-2.5">
                <LumaSymbol size="sm" active />
                <p className="text-[13.5px] leading-[1.7] text-foreground/85 italic">
                  {card.lumaNote}
                </p>
              </div>

              {/* Example */}
              <div className="border-l-2 border-border pl-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 mb-1 font-mono">
                  Example
                </p>
                <p className="text-[13.5px] leading-[1.7] text-muted-foreground">
                  &quot;{card.example}&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Deck Preview (21st.dev Display Cards) ──────────────────── */
function DeckPreview({
  deck,
  currentIndex,
  statusMap,
  onCardClick,
}: {
  deck: P75Card[];
  currentIndex: number;
  statusMap: StatusMap;
  onCardClick: (index: number) => void;
}) {
  // Show up to 3 upcoming cards from current position
  const previewCards: DisplayCardProps[] = [];
  for (let i = 0; i < 3 && i < deck.length; i++) {
    const cardIdx = (currentIndex + i) % deck.length;
    const card = deck[cardIdx];
    const status = statusMap[card.id];
    const statusLabel = status === "mastered" ? "Mastered" : status === "learning" ? "Learning" : "Unseen";

    const baseClassName = i === 0
      ? "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration:700 hover:grayscale-0 before:left-0 before:top-0"
      : i === 1
      ? "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration:700 hover:grayscale-0 before:left-0 before:top-0"
      : "[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10";

    previewCards.push({
      className: `${baseClassName} cursor-pointer`,
      icon: DOMAIN_ICONS[card.domain],
      title: card.domain,
      description: card.term,
      date: statusLabel,
      titleClassName: DOMAIN_TITLE_COLORS[card.domain],
      iconClassName: DOMAIN_TITLE_COLORS[card.domain],
    });
  }

  return (
    <div onClick={() => onCardClick(currentIndex)} className="cursor-pointer">
      <DisplayCards cards={previewCards} />
    </div>
  );
}

/* ─── Domain dropdown ────────────────────────────────────────── */
function DomainDropdown({
  value,
  onChange,
}: {
  value: P75Domain | "all";
  onChange: (v: P75Domain | "all") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:border-foreground/40 transition-colors cursor-pointer"
      >
        {value === "all" ? "All domains" : value}
        <ChevronDown size={13} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-40 w-44 rounded-xl border border-border bg-popover shadow-lg py-1 overflow-hidden">
          {(["all", ...P75_DOMAINS] as (P75Domain | "all")[]).map((d) => (
            <button
              key={d}
              onClick={() => { onChange(d); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                value === d ? "bg-foreground/10 text-foreground font-medium" : "text-foreground hover:bg-muted"
              }`}
            >
              {d === "all" ? "All domains" : d}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Keyboard hint tooltip ──────────────────────────────────── */
function KeyHint({ k, label }: { k: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 font-mono">
      <kbd className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded border border-border bg-muted text-[10px] font-medium text-muted-foreground">
        {k}
      </kbd>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

/* ─── Completion screen ──────────────────────────────────────── */
function CompletionScreen({
  total,
  mastered,
  onReset,
}: {
  total: number;
  mastered: number;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center px-6">
      <LumaSymbol size="lg" active />
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Deck complete
        </h2>
        <p className="text-muted-foreground">
          {mastered} of {total} cards mastered
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={onReset} className="bg-foreground text-background hover:bg-foreground/90 cursor-pointer">
          <RotateCcw size={14} className="mr-1.5" />
          Reset and retry
        </Button>
        <Link href="/progress">
          <Button variant="outline" className="cursor-pointer">
            View progress
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function FlashcardsPage() {
  const [domain, setDomain] = useState<P75Domain | "all">("all");
  const [unmasteredOnly, setUnmasteredOnly] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [studyMode, setStudyMode] = useState(false);

  const prefersReduced = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ).current;

  const [study, dispatch] = useReducer(studyReducer, {
    statusMap: {},
    currentIndex: 0,
    flipped: false,
    slideDir: "none",
  });

  /* Filtered deck */
  const deck = useMemo(() => {
    let cards = domain === "all" ? PRODUCT_75 : PRODUCT_75.filter((c) => c.domain === domain);
    if (unmasteredOnly) cards = cards.filter((c) => study.statusMap[c.id] !== "mastered");
    return cards;
  }, [domain, unmasteredOnly, study.statusMap]);

  const currentCard = deck[study.currentIndex] ?? deck[0];
  const masteredCount = Object.values(study.statusMap).filter((s) => s === "mastered").length;
  const learningCount = Object.values(study.statusMap).filter((s) => s === "learning").length;
  const unseenCount = PRODUCT_75.length - masteredCount - learningCount;

  /* Advance after mark */
  const handleMark = useCallback(
    (status: CardStatus) => {
      if (!currentCard) return;
      dispatch({ type: "MARK", id: currentCard.id, status });
      // After out animation, advance
      setTimeout(() => {
        dispatch({ type: "NAVIGATE", dir: "next", total: deck.length });
      }, 230);
    },
    [currentCard, deck.length]
  );

  /* Keyboard handler */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!studyMode) {
        if (e.key === "Enter") setStudyMode(true);
        return;
      }
      if (e.key === " ") { e.preventDefault(); dispatch({ type: "FLIP" }); }
      else if (e.key === "ArrowRight") dispatch({ type: "NAVIGATE", dir: "next", total: deck.length });
      else if (e.key === "ArrowLeft") dispatch({ type: "NAVIGATE", dir: "prev", total: deck.length });
      else if (e.key === "1") handleMark("mastered");
      else if (e.key === "2") handleMark("learning");
      else if (e.key === "Escape") setStudyMode(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [deck.length, handleMark, studyMode]);

  /* Reset index when deck changes */
  useEffect(() => {
    dispatch({ type: "NAVIGATE", dir: "next", total: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, unmasteredOnly]);

  const deckComplete = deck.length === 0 && unmasteredOnly;

  function handleStartStudy(index?: number) {
    if (index !== undefined) {
      // Navigate to specific index first
      for (let i = 0; i < index; i++) {
        dispatch({ type: "NAVIGATE", dir: "next", total: deck.length });
      }
    }
    setStudyMode(true);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <div className="flex-1 min-w-0">
            <h1 className="text-[13px] font-bold text-foreground truncate">
              Product 75 — Flashcards
            </h1>
          </div>

          {/* Progress summary */}
          <div className="flex items-center gap-2 shrink-0">
            <ProgressRing mastered={masteredCount} total={PRODUCT_75.length} />
            <div className="hidden sm:block">
              <p className="text-[11px] font-semibold text-foreground tabular-nums font-mono">
                {masteredCount} / {PRODUCT_75.length}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">mastered</p>
            </div>
          </div>

          {/* Keyboard hints toggle */}
          <button
            onClick={() => setShowKeys((s) => !s)}
            aria-label="Toggle keyboard shortcuts"
            className={`hidden sm:flex h-8 w-8 items-center justify-center rounded-lg border transition-colors cursor-pointer ${showKeys ? "border-foreground/50 bg-foreground/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            <Keyboard size={14} />
          </button>
        </div>
      </header>

      {/* Keyboard hints panel */}
      {showKeys && (
        <div className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-3xl px-4 py-3 flex flex-wrap gap-4">
            {studyMode ? (
              <>
                <KeyHint k="Space" label="Flip" />
                <KeyHint k="←" label="Previous" />
                <KeyHint k="→" label="Next" />
                <KeyHint k="1" label="Got it" />
                <KeyHint k="2" label="Still learning" />
                <KeyHint k="Esc" label="Back to deck" />
              </>
            ) : (
              <KeyHint k="Enter" label="Start studying" />
            )}
          </div>
        </div>
      )}

      {/* ── FILTERS ── */}
      <div className="border-b border-border/30">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <DomainDropdown value={domain} onChange={(d) => { setDomain(d); }} />

          {/* Unmastered only toggle */}
          <button
            onClick={() => setUnmasteredOnly((v) => !v)}
            aria-pressed={unmasteredOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
              unmasteredOnly
                ? "border-foreground/50 bg-foreground/10 text-foreground"
                : "border-border bg-card text-foreground hover:border-foreground/30"
            }`}
          >
            Unmastered only
          </button>

          {/* Back to deck button when in study mode */}
          {studyMode && (
            <button
              onClick={() => setStudyMode(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent/40 bg-accent/10 text-sm font-medium text-accent-foreground transition-colors cursor-pointer hover:bg-accent/20"
            >
              <ArrowLeft size={12} />
              Deck view
            </button>
          )}

          {/* Status pills (read-only) */}
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-[11px] text-muted-foreground tabular-nums font-mono">{masteredCount} mastered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--warning)]" />
              <span className="text-[11px] text-muted-foreground tabular-nums font-mono">{learningCount} learning</span>
            </div>
            <div className="flex items-center gap-1.5 hidden sm:flex">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              <span className="text-[11px] text-muted-foreground tabular-nums font-mono">{unseenCount} unseen</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-3xl flex flex-col items-center gap-8">

          {deckComplete ? (
            <CompletionScreen
              total={PRODUCT_75.length}
              mastered={masteredCount}
              onReset={() => { dispatch({ type: "RESET" }); setStudyMode(false); }}
            />
          ) : !studyMode ? (
            /* ── DECK PREVIEW (Display Cards) ── */
            <div className="w-full flex flex-col items-center gap-8 py-8">
              <div className="text-center space-y-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-accent">
                  Product 75
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-[-0.02em]">
                  {deck.length} cards in your deck
                </h2>
                <p className="text-[15px] text-muted-foreground leading-[1.7] max-w-md mx-auto">
                  {domain !== "all" ? `Filtered to ${domain}. ` : ""}
                  Hover to preview, click to start studying.
                </p>
              </div>

              {deck.length > 0 && (
                <div className="py-8">
                  <DeckPreview
                    deck={deck}
                    currentIndex={study.currentIndex}
                    statusMap={study.statusMap}
                    onCardClick={() => handleStartStudy()}
                  />
                </div>
              )}

              <Button
                onClick={() => handleStartStudy()}
                className="bg-foreground text-background hover:bg-foreground/90 cursor-pointer h-10 px-6"
              >
                Start studying
                <ArrowRight size={14} className="ml-1.5" />
              </Button>

              {/* Progress bar */}
              <div className="w-full max-w-md space-y-2">
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-success transition-all duration-700"
                    style={{ width: `${(masteredCount / PRODUCT_75.length) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground font-mono text-center">
                  {Math.round((masteredCount / PRODUCT_75.length) * 100)}% of Product 75 mastered
                </p>
              </div>
            </div>
          ) : currentCard ? (
            /* ── STUDY MODE (Flip cards) ── */
            <>
              {/* Card counter */}
              <p className="text-sm text-muted-foreground font-mono">
                Card{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {study.currentIndex + 1}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {deck.length}
                </span>
                {domain !== "all" && (
                  <span className="ml-2 text-muted-foreground/60">· {domain}</span>
                )}
              </p>

              {/* Status badge for current card */}
              {study.statusMap[currentCard.id] && (
                <span
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-sm font-mono ${
                    study.statusMap[currentCard.id] === "mastered"
                      ? "bg-success/15 text-success"
                      : "bg-[var(--warning)]/15 text-[var(--warning)]"
                  }`}
                >
                  {study.statusMap[currentCard.id] === "mastered" ? "✓ Mastered" : "Still learning"}
                </span>
              )}

              {/* The card */}
              <Flashcard
                card={currentCard}
                flipped={study.flipped}
                onFlip={() => dispatch({ type: "FLIP" })}
                slideDir={study.slideDir}
                onSlideEnd={() => dispatch({ type: "SLIDE_DONE" })}
                prefersReduced={prefersReduced}
              />

              {/* ── CONTROLS ── */}
              <div className="flex flex-col items-center gap-4 w-full max-w-[600px]">
                {/* Navigation row */}
                <div className="flex items-center justify-between w-full">
                  <button
                    onClick={() => dispatch({ type: "NAVIGATE", dir: "prev", total: deck.length })}
                    aria-label="Previous card"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  {/* Mark buttons */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => handleMark("learning")}
                      variant="outline"
                      className="border-[var(--warning)]/40 text-[var(--warning)] hover:bg-[var(--warning)]/10 hover:border-[var(--warning)]/60 cursor-pointer"
                    >
                      Still learning
                      <span className="ml-1.5 hidden sm:inline text-[10px] opacity-50 font-mono">2</span>
                    </Button>
                    <Button
                      onClick={() => handleMark("mastered")}
                      className="bg-foreground text-background hover:bg-foreground/90 border border-foreground cursor-pointer"
                    >
                      <Check size={14} className="mr-1" />
                      Got it
                      <span className="ml-1.5 hidden sm:inline text-[10px] opacity-60 font-mono">1</span>
                    </Button>
                  </div>

                  <button
                    onClick={() => dispatch({ type: "NAVIGATE", dir: "next", total: deck.length })}
                    aria-label="Next card"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors cursor-pointer"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-success transition-all duration-700"
                    style={{ width: `${(masteredCount / PRODUCT_75.length) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {Math.round((masteredCount / PRODUCT_75.length) * 100)}% of Product 75 mastered
                </p>
              </div>
            </>
          ) : (
            <div className="py-20 text-center">
              <p className="text-muted-foreground">
                No cards match your current filters.
              </p>
              <button onClick={() => { setDomain("all"); setUnmasteredOnly(false); }} className="mt-3 text-sm text-foreground hover:underline cursor-pointer">
                Clear filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
