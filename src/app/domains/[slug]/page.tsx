"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Zap,
  Lock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Globe,
  MessageSquare,
  BarChart3,
  Target,
  Star,
  TrendingUp,
  LayoutDashboard,
} from "lucide-react";
import { getDomain, type VocabTerm, type ComprehensionQuestion } from "@/lib/domains";
import { LumaSymbol } from "@/components/luma-symbol";

/* ─── Icon map ────────────────────────────────────────────────── */
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  CreditCard,
  Globe,
  MessageSquare,
  BarChart3,
  Target,
  Star,
  TrendingUp,
  LayoutDashboard,
  BookOpen,
  Zap,
};

/* ─── Vocabulary card ─────────────────────────────────────────── */
function VocabCard({ term }: { term: VocabTerm }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden transition-all duration-200">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-muted/30 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {term.term}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {term.shortDef}
          </p>
        </div>
        <div className="shrink-0 mt-0.5 text-muted-foreground">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/60">
          <p className="text-sm text-foreground leading-relaxed pt-3">
            {term.fullDef}
          </p>
          <div className="rounded-lg bg-accent/10 border border-accent/20 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <LumaSymbol size="sm" active />
              <span className="text-xs font-semibold font-mono uppercase text-accent">
                Luma&apos;s take
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {term.lumaNote}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Comprehension quiz ──────────────────────────────────────── */
function ComprehensionQuiz({ questions }: { questions: ComprehensionQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = submitted
    ? questions.filter((q) => answers[q.id] === q.correctIndex).length
    : 0;
  const passed = score >= Math.ceil(questions.length * 0.67);

  function handleSelect(qId: string, idx: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: idx }));
  }

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="space-y-6">
      {questions.map((q, qi) => {
        const chosen = answers[q.id];
        const isCorrect = submitted && chosen === q.correctIndex;
        const isWrong = submitted && chosen !== undefined && chosen !== q.correctIndex;

        return (
          <div key={q.id} className="space-y-3">
            <p className="text-sm font-semibold text-foreground leading-relaxed">
              {qi + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const isSelected = chosen === oi;
                const isCorrectOption = submitted && oi === q.correctIndex;
                let optClass =
                  "w-full text-left px-4 py-3 rounded-lg border text-sm transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ";

                if (!submitted) {
                  optClass += isSelected
                    ? "border-foreground bg-foreground/8 text-foreground"
                    : "border-border bg-card hover:border-foreground hover:bg-muted/30 text-foreground";
                } else if (isCorrectOption) {
                  optClass += "border-success/50 bg-success/8 text-foreground";
                } else if (isSelected && isWrong) {
                  optClass += "border-danger/40 bg-danger/8 text-foreground";
                } else {
                  optClass += "border-border bg-card text-muted-foreground";
                }

                return (
                  <button
                    key={oi}
                    onClick={() => handleSelect(q.id, oi)}
                    className={optClass}
                    disabled={submitted}
                  >
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 mt-px">
                        {submitted && isCorrectOption ? (
                          <CheckCircle2 size={14} className="text-success" />
                        ) : submitted && isSelected && isWrong ? (
                          <Circle size={14} className="text-danger/70" />
                        ) : (
                          <Circle size={14} className={isSelected ? "text-foreground" : "text-muted-foreground/40"} />
                        )}
                      </span>
                      {opt}
                    </div>
                  </button>
                );
              })}
            </div>

            {submitted && (
              <div
                className={`rounded-lg border px-4 py-3 text-xs leading-relaxed ${
                  isCorrect
                    ? "border-success/30 bg-success/6 text-foreground"
                    : "border-warning/30 bg-warning/6 text-foreground"
                }`}
              >
                <span className={`font-semibold mr-1 ${isCorrect ? "text-success" : "text-warning"}`}>
                  {isCorrect ? "Correct." : "Not quite."}
                </span>
                {q.explanation}
              </div>
            )}
          </div>
        );
      })}

      {!submitted ? (
        <Button
          onClick={() => setSubmitted(true)}
          disabled={!allAnswered}
          className="w-full sm:w-auto bg-foreground hover:bg-foreground/90 text-background"
        >
          Submit answers
        </Button>
      ) : (
        <div
          className={`rounded-lg border p-4 flex items-center gap-3 ${
            passed ? "border-success/40 bg-success/8" : "border-warning/40 bg-warning/8"
          }`}
        >
          <div className={`text-2xl font-bold ${passed ? "text-success" : "text-warning"}`}>
            {score}/{questions.length}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {passed ? "Domain comprehension confirmed." : "Review and try again."}
            </p>
            <p className="text-xs text-muted-foreground">
              {passed
                ? "You've demonstrated solid understanding of this domain."
                : "You need 2 out of 3 to mark this domain complete."}
            </p>
          </div>
          {!passed && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto shrink-0"
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
              }}
            >
              Retry
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Domain overview page ────────────────────────────────────── */
export default function DomainPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const domain = getDomain(slug);

  if (!domain) notFound();

  const DomainIcon = ICON_MAP[domain.icon] ?? BookOpen;
  const completedCount = domain.stories.filter((s) => s.completed).length;
  const allStoriesDone = completedCount === domain.stories.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav bar */}
      <header className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-8 h-14 flex items-center gap-2">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer"
            >
              <LayoutDashboard size={14} className="inline -mt-0.5 mr-0.5" />
              Dashboard
            </Link>
            <ChevronRight size={12} className="text-muted-foreground/50" />
            <Link
              href="/domains"
              className="text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer"
            >
              Domains
            </Link>
            <ChevronRight size={12} className="text-muted-foreground/50" />
            <span className="text-foreground font-medium">
              {domain.name}
            </span>
          </nav>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-12">
        {/* ─── Domain header ─────────────────────────────────────── */}
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center text-foreground shrink-0">
              <DomainIcon size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-semibold text-foreground tracking-tight">
                  {domain.name}
                </h1>
                {allStoriesDone && (
                  <Badge className="gap-1 bg-accent/15 text-accent border border-accent/30 font-mono uppercase text-xs">
                    <CheckCircle2 size={11} />
                    Complete
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {completedCount} of {domain.stories.length} stories completed
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-foreground rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / domain.stories.length) * 100}%` }}
            />
          </div>

          {/* Luma intro */}
          <div className="rounded-lg border border-accent/20 bg-accent/10 p-5">
            <div className="flex items-center gap-2 mb-2.5">
              <LumaSymbol size="sm" active />
              <span className="text-xs font-semibold font-mono uppercase text-accent">
                Luma on {domain.name}
              </span>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">
              {domain.lumaIntro}
            </p>
          </div>
        </div>

        {/* ─── Stories ───────────────────────────────────────────── */}
        <section aria-labelledby="stories-heading">
          <h2
            id="stories-heading"
            className="text-lg font-semibold text-foreground mb-4"
          >
            Domain Stories
          </h2>
          <div className="space-y-3">
            {domain.stories.map((story, idx) => (
              <Link
                key={story.id}
                href={`/domains/${slug}/stories/${story.id}`}
                className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-foreground hover:shadow-sm transition-all duration-200 cursor-pointer"
              >
                {/* Status icon */}
                <div className="shrink-0">
                  {story.completed ? (
                    <CheckCircle2 size={20} className="text-success" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                      <span className="text-[10px] font-bold font-mono text-muted-foreground/50">
                        {idx + 1}
                      </span>
                    </div>
                  )}
                </div>

                {/* Story info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {story.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {story.subtitle}
                  </p>
                </div>

                {/* Read time + arrow */}
                <div className="shrink-0 flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={12} />
                    {story.readingTimeMin} min
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-all duration-150"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── Vocabulary ────────────────────────────────────────── */}
        <section aria-labelledby="vocab-heading">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="vocab-heading"
              className="text-lg font-semibold text-foreground"
            >
              Key Terms in {domain.name}
            </h2>
            <Link
              href="/product75"
              className="flex items-center gap-1 text-xs font-medium text-foreground hover:text-foreground/70 transition-colors duration-150 cursor-pointer"
            >
              All 75 terms
              <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {domain.vocab.map((term) => (
              <VocabCard key={term.term} term={term} />
            ))}
          </div>
        </section>

        {/* ─── Comprehension check ──────────────────────────────── */}
        <section aria-labelledby="comprehension-heading">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2
                id="comprehension-heading"
                className="text-lg font-semibold text-foreground"
              >
                Comprehension Check
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                3 questions · pass 2/3 to mark this domain complete
              </p>
            </div>
            {!allStoriesDone && (
              <Badge variant="outline" className="shrink-0 text-muted-foreground border-border">
                Read all stories first
              </Badge>
            )}
          </div>

          {allStoriesDone ? (
            <ComprehensionQuiz questions={domain.comprehension} />
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
              <BookOpen size={28} className="text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                Complete all stories to unlock the quiz
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {domain.stories.length - completedCount} stor{domain.stories.length - completedCount === 1 ? "y" : "ies"} remaining
              </p>
            </div>
          )}
        </section>

        {/* ─── Related challenges ────────────────────────────────── */}
        <section aria-labelledby="challenges-heading">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2
                id="challenges-heading"
                className="text-lg font-semibold text-foreground"
              >
                Practice What You Learned
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {domain.name} challenges in Layer 3
              </p>
            </div>
          </div>
          <div className="space-y-2.5">
            {domain.challenges.map((challenge) => (
              <div
                key={challenge.id}
                className={`flex items-center gap-4 rounded-lg border bg-card p-4 transition-all duration-200 ${
                  challenge.locked ? "opacity-70" : "hover:border-foreground hover:shadow-sm"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    challenge.locked ? "bg-muted" : "bg-foreground/10"
                  }`}
                >
                  {challenge.locked ? (
                    <Lock size={15} className="text-muted-foreground" />
                  ) : (
                    <Zap size={15} className="text-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {challenge.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-xs font-medium font-mono ${
                        challenge.difficulty === "Easy"
                          ? "text-success"
                          : challenge.difficulty === "Medium"
                          ? "text-[var(--warning)]"
                          : "text-danger"
                      }`}
                    >
                      {challenge.difficulty}
                    </span>
                    <span className="text-muted-foreground/40 text-xs">·</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={10} />
                      {challenge.estimatedMin} min
                    </span>
                  </div>
                </div>

                {challenge.locked ? (
                  <Badge variant="outline" className="shrink-0 gap-1 text-[var(--pro-gold)] border-[var(--pro-gold)]/30">
                    <Lock size={10} />
                    Pro
                  </Badge>
                ) : (
                  <Link href={`/challenges/${challenge.id}`}>
                    <Button
                      size="sm"
                      className="shrink-0 gap-1.5 text-xs h-8 bg-foreground text-background hover:bg-foreground/90"
                    >
                      Start
                      <ArrowRight size={12} />
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
