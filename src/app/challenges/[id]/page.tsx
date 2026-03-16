"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useTransition,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lock,
  Lightbulb,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Minus,
  LayoutDashboard,
} from "lucide-react";
import {
  getChallengeDetail,
  SCAFFOLD_TEMPLATES,
  SCAFFOLD_PLACEHOLDERS,
  type ChallengeDetail,
  type Hint,
} from "@/lib/challenge-detail";
import { LumaSymbol } from "@/components/luma-symbol";

/* ─── Scaffold types ─────────────────────────────────────────── */
type ScaffoldKey = "structured" | "guided" | "blank";

interface ScaffoldOption {
  key: ScaffoldKey;
  label: string;
  desc: string;
  level: string;
  levelColor: string;
}

const SCAFFOLDS: ScaffoldOption[] = [
  {
    key: "structured",
    label: "Structured",
    desc: "Section headers guide your thinking — Diagnosis, Hypotheses, Validation, Recommendation.",
    level: "Beginner-friendly",
    levelColor: "text-success",
  },
  {
    key: "guided",
    label: "Guided",
    desc: "Prompts that nudge without constraining. You write freely around them.",
    level: "Intermediate",
    levelColor: "text-[var(--warning)]",
  },
  {
    key: "blank",
    label: "Blank",
    desc: "No scaffold. Just you and the problem. Luma evaluates thinking quality.",
    level: "Advanced",
    levelColor: "text-danger",
  },
];

/* ─── Difficulty styling ─────────────────────────────────────── */
function diffBadge(d: string) {
  if (d === "Easy") return "text-success border-success/30 bg-success/8";
  if (d === "Medium") return "text-[var(--warning)] border-[var(--warning)]/30 bg-[var(--warning)]/8";
  return "text-danger border-danger/30 bg-danger/8";
}

/* ─── Metric callout card ────────────────────────────────────── */
function MetricsBar({ metrics }: { metrics: ChallengeDetail["metrics"] }) {
  if (!metrics?.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-xl border border-border bg-muted/30 px-3.5 py-3"
        >
          <p className="text-[10px] font-mono font-medium text-muted-foreground mb-1 uppercase tracking-wider">
            {m.label}
          </p>
          <p className="text-base font-bold text-foreground">
            {m.value}
          </p>
          {m.delta && (
            <div className="flex items-center gap-1 mt-0.5">
              {m.deltaDir === "down" ? (
                <TrendingDown size={10} className="text-danger" />
              ) : m.deltaDir === "up" ? (
                <TrendingUp size={10} className="text-success" />
              ) : (
                <Minus size={10} className="text-muted-foreground/60" />
              )}
              <span className="text-[10px] text-muted-foreground">
                {m.delta}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Hint item ──────────────────────────────────────────────── */
function HintItem({
  hint,
  elapsedMin,
  revealed,
  onReveal,
}: {
  hint: Hint;
  elapsedMin: number;
  revealed: boolean;
  onReveal: () => void;
}) {
  const unlocked = elapsedMin >= hint.unlockAfterMin;
  const minutesLeft = hint.unlockAfterMin - elapsedMin;

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200 ${
        revealed
          ? "border-primary/20 bg-primary/4"
          : unlocked
          ? "border-border bg-card"
          : "border-border bg-muted/20 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-mono font-bold tabular-nums ${
              revealed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {hint.id}
          </div>
          <p className="text-xs font-semibold text-foreground">
            Hint {hint.id}
            {hint.unlockAfterMin > 0 && !revealed && (
              <span className="font-normal text-muted-foreground ml-1.5">
                · unlocks at {hint.unlockAfterMin} min
              </span>
            )}
          </p>
        </div>

        {!revealed && (
          <Button
            size="sm"
            variant="outline"
            disabled={!unlocked}
            onClick={onReveal}
            className="h-7 text-xs shrink-0 gap-1"
          >
            <Lightbulb size={11} />
            {unlocked ? "Reveal" : `${minutesLeft}m left`}
          </Button>
        )}
      </div>

      {revealed && (
        <p className="text-sm text-foreground/85 leading-relaxed mt-3 animate-fade-in-up">
          {hint.text}
        </p>
      )}
    </div>
  );
}

/* ─── Auto-expanding textarea ────────────────────────────────── */
function AutoTextarea({
  value,
  onChange,
  placeholder,
  scaffoldKey,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  scaffoldKey: ScaffoldKey;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(320, el.scrollHeight)}px`;
  }, [value]);

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-lg border border-border bg-background px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-150 leading-[1.8]"
        style={{ minHeight: 320 }}
        aria-label="Your answer"
        spellCheck
      />
      <div className="absolute bottom-3 right-4 flex items-center gap-2 text-[10px] font-mono text-muted-foreground/50 select-none pointer-events-none">
        <span>{wordCount} words</span>
        <span>·</span>
        <span>{charCount} chars</span>
      </div>
    </div>
  );
}

/* ─── Auto-save indicator ────────────────────────────────────── */
function SaveIndicator({ savedAt }: { savedAt: Date | null }) {
  if (!savedAt) return null;
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground/70">
      <CheckCircle2 size={11} className="text-success/70" />
      Saved {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </div>
  );
}

/* ─── Scaffold card ──────────────────────────────────────────── */
function ScaffoldCard({
  option,
  selected,
  onSelect,
}: {
  option: ScaffoldOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border p-3.5 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        selected
          ? "border-primary bg-primary/6 shadow-sm"
          : "border-border bg-card hover:border-foreground hover:bg-muted/20"
      }`}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-foreground">
              {option.label}
            </p>
            <span className={`text-[10px] font-mono font-medium ${option.levelColor}`}>
              {option.level}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {option.desc}
          </p>
        </div>
        <div
          className={`shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
            selected ? "border-primary bg-primary" : "border-muted-foreground/30"
          }`}
        >
          {selected && (
            <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
          )}
        </div>
      </div>
    </button>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const challenge = getChallengeDetail(id);

  // State
  const [scaffold, setScaffold] = useState<ScaffoldKey>("structured");
  const [answer, setAnswer] = useState(SCAFFOLD_TEMPLATES.structured);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set());
  const [elapsedMin, setElapsedMin] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Track elapsed time
  useEffect(() => {
    const t = setInterval(() => {
      setElapsedMin((m) => m + 1);
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  // Auto-save every 30s
  useEffect(() => {
    if (!answer.trim()) return;
    const t = setInterval(() => {
      setSavedAt(new Date());
    }, 30_000);
    return () => clearInterval(t);
  }, [answer]);

  // Scaffold switch — populate answer
  const handleScaffoldSelect = useCallback(
    (key: ScaffoldKey) => {
      if (key === scaffold) return;
      setScaffold(key);
      // Only overwrite if answer is still the previous scaffold's default
      const prevDefault = SCAFFOLD_TEMPLATES[scaffold];
      if (answer === prevDefault || answer === "") {
        setAnswer(SCAFFOLD_TEMPLATES[key]);
      }
    },
    [scaffold, answer]
  );

  function handleRevealHint(hintId: number) {
    setRevealedHints((prev) => new Set(prev).add(hintId));
  }

  async function handleSubmit() {
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    // Simulate Luma processing
    await new Promise((r) => setTimeout(r, 1800));
    startTransition(() => {
      router.push(`/challenges/${id}/feedback`);
    });
  }

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const canSubmit = wordCount >= 30;

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Top bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
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
            <span className="text-foreground font-medium font-mono truncate">
              {challenge.id}
            </span>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <SaveIndicator savedAt={savedAt} />
            <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
              <Clock size={12} />
              <span className="tabular-nums">{elapsedMin}m</span> elapsed
            </div>
          </div>
        </div>
      </header>

      {/* ─── Two-panel layout ─────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ══════════════════════════════════════════════════════
              LEFT PANEL — Scenario (60%)
          ══════════════════════════════════════════════════════ */}
          <div className="w-full lg:w-[60%] lg:sticky lg:top-20 max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto pr-0 lg:pr-2 scrollbar-thin">
            <div className="max-w-[640px] space-y-8">

              {/* Challenge header */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs font-mono font-bold text-muted-foreground/60 tracking-wider">
                    {challenge.id}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] h-4 px-1.5 font-medium ${diffBadge(challenge.difficulty)}`}
                  >
                    {challenge.difficulty}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-4 px-1.5 font-medium bg-primary/8 text-primary border-0"
                  >
                    {challenge.domain}
                  </Badge>
                  {challenge.companies.map((co) => (
                    <Badge
                      key={co}
                      variant="outline"
                      className="text-[10px] h-4 px-1.5 text-muted-foreground border-border"
                    >
                      {co}
                    </Badge>
                  ))}
                  <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground ml-1">
                    <Clock size={11} />
                    <span className="tabular-nums">{challenge.estimatedMinLow}–{challenge.estimatedMinHigh}</span> min
                  </div>
                </div>

                <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight leading-[1.2]">
                  {challenge.title}
                </h1>
              </div>

              {/* Scenario */}
              <section aria-labelledby="scenario-heading">
                <h2
                  id="scenario-heading"
                  className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-4"
                >
                  Scenario
                </h2>
                <div className="space-y-4">
                  {challenge.scenario.map((p, i) => (
                    <p
                      key={i}
                      className="text-[15px] text-foreground/85 leading-[1.85]"
                    >
                      {p.text}
                    </p>
                  ))}
                </div>
                <MetricsBar metrics={challenge.metrics} />
              </section>

              {/* Questions */}
              <section aria-labelledby="questions-heading">
                <h2
                  id="questions-heading"
                  className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-4"
                >
                  Your task
                </h2>
                <div className="space-y-3">
                  {challenge.questions.map((q) => (
                    <div
                      key={q.number}
                      className="flex gap-3.5 rounded-xl border border-accent/20 bg-accent/10 px-4 py-3.5"
                    >
                      <span
                        className="shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-[11px] font-mono font-bold tabular-nums flex items-center justify-center mt-0.5"
                        aria-hidden="true"
                      >
                        {q.number}
                      </span>
                      <p className="text-sm text-foreground leading-relaxed">
                        {q.text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              RIGHT PANEL — Answer (40%)
          ══════════════════════════════════════════════════════ */}
          <div className="w-full lg:w-[40%] space-y-5">

            {/* Scaffold selector */}
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">
                Choose your thinking scaffold
              </h2>
              <div className="space-y-2">
                {SCAFFOLDS.map((s) => (
                  <ScaffoldCard
                    key={s.key}
                    option={s}
                    selected={scaffold === s.key}
                    onSelect={() => handleScaffoldSelect(s.key)}
                  />
                ))}
              </div>
            </div>

            {/* Answer area */}
            <div className="rounded-lg border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  Your answer
                </h2>
                <SaveIndicator savedAt={savedAt} />
              </div>

              <AutoTextarea
                value={answer}
                onChange={setAnswer}
                placeholder={SCAFFOLD_PLACEHOLDERS[scaffold]}
                scaffoldKey={scaffold}
              />

              {!canSubmit && wordCount > 0 && (
                <p className="text-[11px] text-muted-foreground/70">
                  Write at least 30 words before submitting.
                </p>
              )}
            </div>

            {/* Hint system */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <button
                onClick={() => setHintsOpen((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                aria-expanded={hintsOpen}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[var(--warning)]/12 flex items-center justify-center">
                    <Lightbulb size={13} className="text-[var(--warning)]" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    Need a nudge?
                  </span>
                  {revealedHints.size > 0 && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {revealedHints.size} hint{revealedHints.size > 1 ? "s" : ""} used
                    </span>
                  )}
                </div>
                {hintsOpen ? (
                  <ChevronUp size={15} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={15} className="text-muted-foreground" />
                )}
              </button>

              {hintsOpen && (
                <div className="px-5 pb-5 space-y-2.5 border-t border-border/60 pt-4">
                  <p className="text-xs text-muted-foreground mb-3">
                    Hints are calibrated to help you think, not give away the answer. Using hints is noted in Luma's feedback — it doesn't penalise your score, but it does affect the rubric context.
                  </p>
                  {challenge.hints.map((hint) => (
                    <HintItem
                      key={hint.id}
                      hint={hint}
                      elapsedMin={elapsedMin}
                      revealed={revealedHints.has(hint.id)}
                      onReveal={() => handleRevealHint(hint.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Submit section */}
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              {challenge.locked ? (
                /* Pro-locked submit */
                <div className="space-y-3">
                  <div className="rounded-xl border border-[var(--pro-gold)]/30 bg-[var(--pro-gold)]/5 p-4 text-center">
                    <Lock size={18} className="text-[var(--pro-gold)] mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground mb-1">
                      Pro challenge
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Upgrade to submit your answer and get Luma's feedback.
                    </p>
                    <Link href="/billing">
                      <Button
                        className="w-full bg-[var(--pro-gold)] hover:bg-[var(--pro-gold)]/90 text-white border-0 gap-2"
                      >
                        Upgrade to Pro
                        <ArrowRight size={14} />
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                /* Normal submit */
                <div className="space-y-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitting || isPending}
                    className="w-full gap-2.5 bg-primary hover:bg-primary/90 text-primary-foreground h-11 text-sm font-semibold"
                  >
                    {submitting || isPending ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                        Luma is reviewing…
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} />
                        Submit to Luma
                      </>
                    )}
                  </Button>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                      <LumaSymbol size="sm" active />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Luma will review your answer and provide detailed, rubric-based feedback. This typically takes 5–15 seconds.
                      {revealedHints.size > 0 && (
                        <span className="text-muted-foreground/70">
                          {" "}Luma will note that you used {revealedHints.size} hint{revealedHints.size > 1 ? "s" : ""}.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
          {/* end right panel */}
        </div>
      </div>
    </div>
  );
}
