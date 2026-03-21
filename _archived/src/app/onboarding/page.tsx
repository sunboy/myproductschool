"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LumaSymbol } from "@/components/luma-symbol";
import { Check, ArrowRight, ChevronLeft } from "lucide-react";

/* ─── Constants ─────────────────────────────────────────────────── */
const TOTAL_STEPS = 3;

/* ─── Data ───────────────────────────────────────────────────────── */
const ROLES = [
  {
    id: "swe",
    title: "Software Engineer",
    desc: "Build influence in product reviews and get to Staff faster.",
  },
  {
    id: "em",
    title: "Engineering Manager",
    desc: "Lead product conversations with the vocabulary to match.",
  },
  {
    id: "designer",
    title: "Designer moving to PM",
    desc: "You know users — now learn how to measure and prioritize.",
  },
  {
    id: "other",
    title: "Other",
    desc: "Product sense matters wherever you sit in the org.",
  },
];

const MOTIVATIONS = [
  {
    id: "interviews",
    label: "I want to prep for product sense interviews",
  },
  {
    id: "influence",
    label: "I want to have more influence in product decisions",
  },
  {
    id: "transition",
    label: "I'm exploring a transition to PM",
  },
  {
    id: "manager",
    label: "My manager told me to think more like a PM",
  },
];

const LEVELS: Record<number, string> = {
  1: "No shame. That's why you're here.",
  2: "You've got instincts. Let's sharpen them.",
  3: "Solid base. Time to pressure-test it.",
  4: "You're close. The gaps are specific.",
  5: "Let's see if that holds up under Luma's review.",
};

const LEVEL_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Developing",
  3: "Solid",
  4: "Strong",
  5: "Advanced",
};

/* ─── Progress Bar ───────────────────────────────────────────────── */
function ProgressBar({ step }: { step: number }) {
  const pct = Math.round((step / TOTAL_STEPS) * 100);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs font-medium text-muted-foreground">
          Step {step} of {TOTAL_STEPS}
        </span>
        <span className="font-mono text-xs font-medium text-muted-foreground">
          {pct}%
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-foreground transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Luma Voice ─────────────────────────────────────────────────── */
function LumaVoice({ text, animate }: { text: string; animate: boolean }) {
  return (
    <div
      className={`transition-all duration-400 ${
        animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <LumaSymbol size="sm" active />
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-accent">
          Luma
        </p>
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {text}
      </h2>
    </div>
  );
}

/* ─── Screen 1 — Role ────────────────────────────────────────────── */
function Screen1({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-8">
      <LumaVoice text="Before we start — what do you do?" animate={mounted} />
      <div className="grid gap-3 sm:grid-cols-2">
        {ROLES.map((role, i) => {
          const selected = value === role.id;
          return (
            <button
              key={role.id}
              onClick={() => onChange(role.id)}
              aria-pressed={selected}
              className={`cursor-pointer rounded-lg border-2 p-5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                selected
                  ? "border-foreground bg-foreground/5 shadow-sm"
                  : "border-border bg-card hover:border-foreground/40 hover:bg-muted/40"
              }`}
              style={{
                transitionDelay: `${i * 40}ms`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-base font-semibold text-foreground">
                  {role.title}
                </p>
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                    selected
                      ? "border-foreground bg-foreground"
                      : "border-border bg-transparent"
                  }`}
                >
                  {selected && (
                    <Check className="h-3 w-3 text-background" strokeWidth={2.5} />
                  )}
                </div>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {role.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Screen 2 — Motivation ──────────────────────────────────────── */
function Screen2({
  values,
  onChange,
}: {
  values: string[];
  onChange: (ids: string[]) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  function toggle(id: string) {
    onChange(
      values.includes(id) ? values.filter((v) => v !== id) : [...values, id]
    );
  }

  return (
    <div className="space-y-8">
      <LumaVoice text="What brought you here?" animate={mounted} />
      <div className="space-y-3">
        {MOTIVATIONS.map((m, i) => {
          const selected = values.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              aria-pressed={selected}
              className={`w-full cursor-pointer rounded-lg border-2 px-5 py-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                selected
                  ? "border-foreground bg-foreground/5"
                  : "border-border bg-card hover:border-foreground/40 hover:bg-muted/40"
              }`}
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition-all duration-200 border-2 ${
                    selected
                      ? "border-foreground bg-foreground"
                      : "border-border bg-transparent"
                  }`}
                >
                  {selected && (
                    <Check className="h-3 w-3 text-background" strokeWidth={2.5} />
                  )}
                </div>
                <p className="text-sm font-medium text-foreground sm:text-base">
                  {m.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      {values.length > 0 && (
        <p className="font-mono text-xs text-muted-foreground">
          {values.length} selected · you can pick more than one
        </p>
      )}
    </div>
  );
}

/* ─── Screen 3 — Self-Assessment ─────────────────────────────────── */
function Screen3({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [animLevel, setAnimLevel] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (value !== prevValue.current) {
      setAnimLevel(-1);
      const t = setTimeout(() => setAnimLevel(value), 120);
      prevValue.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="space-y-10">
      <LumaVoice
        text="Last one. How would you rate your product sense today?"
        animate={mounted}
      />

      {/* Level bars */}
      <div>
        <div className="flex items-end justify-between gap-2 mb-5">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              onClick={() => onChange(level)}
              aria-label={`Level ${level}: ${LEVEL_LABELS[level]}`}
              className="flex flex-1 cursor-pointer flex-col items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg p-1"
            >
              <div
                className={`w-full rounded-lg transition-all duration-200 ${
                  value === level
                    ? "bg-foreground"
                    : value > level
                    ? "bg-foreground/30"
                    : "bg-border"
                } ${level === 1 ? "h-4" : level === 2 ? "h-6" : level === 3 ? "h-8" : level === 4 ? "h-10" : "h-12"}`}
              />
              <span
                className={`font-mono text-xs font-medium transition-colors duration-200 ${
                  value === level ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {level}
              </span>
            </button>
          ))}
        </div>

        {/* Range slider */}
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Product sense level"
          className="w-full cursor-pointer accent-foreground"
          style={{ height: "4px" }}
        />

        <div className="flex justify-between mt-2">
          <span className="font-mono text-xs text-muted-foreground">
            Beginner
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            Advanced
          </span>
        </div>
      </div>

      {/* Luma one-liner */}
      <div className="rounded-lg border border-accent/30 bg-accent/5 px-5 py-4 min-h-[64px] flex items-center gap-3">
        <LumaSymbol size="sm" active />
        <p
          key={animLevel}
          className={`text-sm italic text-foreground/80 transition-all duration-200 ${
            animLevel === value ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
          }`}
        >
          {LEVELS[value]}
        </p>
      </div>

      {/* Level label */}
      <div className="text-center">
        <span className="text-4xl font-semibold text-foreground">
          {LEVEL_LABELS[value]}
        </span>
      </div>
    </div>
  );
}

/* ─── Done Screen ─────────────────────────────────────────────────── */
function DoneScreen() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-center text-center space-y-4 py-8 transition-all duration-600 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="flex items-center gap-2">
        <LumaSymbol size="sm" active />
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-accent">
          Luma
        </p>
      </div>
      <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Got it. Let&apos;s get to work.
      </h2>
      <p className="text-base text-muted-foreground">
        Taking you to your dashboard…
      </p>
      <div className="mt-2 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-accent animate-luma-pulse"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Main Onboarding Component ─────────────────────────────────── */
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [motivations, setMotivations] = useState<string[]>([]);
  const [level, setLevel] = useState<number>(3);
  const [entering, setEntering] = useState(true);
  const [leaving, setLeaving] = useState(false);

  /* Entrance animation on mount */
  useEffect(() => {
    const t = setTimeout(() => setEntering(false), 50);
    return () => clearTimeout(t);
  }, []);

  /* Auto-redirect after done screen */
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => router.push("/dashboard"), 1500);
    return () => clearTimeout(t);
  }, [done, router]);

  function canProceed() {
    if (step === 1) return role !== null;
    if (step === 2) return motivations.length > 0;
    return true;
  }

  function handleNext() {
    if (!canProceed()) return;

    setLeaving(true);
    setTimeout(() => {
      if (step < TOTAL_STEPS) {
        setStep((s) => s + 1);
      } else {
        setDone(true);
      }
      setLeaving(false);
      setEntering(true);
      setTimeout(() => setEntering(false), 50);
    }, 200);
  }

  function handleBack() {
    if (step <= 1) return;
    setLeaving(true);
    setTimeout(() => {
      setStep((s) => s - 1);
      setLeaving(false);
      setEntering(true);
      setTimeout(() => setEntering(false), 50);
    }, 200);
  }

  function handleSkip() {
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-5 sm:px-8">
        <p className="text-base font-semibold tracking-tight text-foreground">
          MyProductSchool
        </p>
        {!done && (
          <button
            onClick={handleSkip}
            className="cursor-pointer text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            Skip
          </button>
        )}
      </header>

      {/* Progress bar */}
      {!done && (
        <div className="px-6 sm:px-8">
          <ProgressBar step={step} />
        </div>
      )}

      {/* Content */}
      <main className="flex flex-1 items-start justify-center px-6 py-10 sm:px-8 sm:py-14">
        <div
          className={`w-full max-w-xl transition-all duration-200 ${
            entering || leaving
              ? "opacity-0 translate-y-3"
              : "opacity-100 translate-y-0"
          }`}
        >
          {done ? (
            <DoneScreen />
          ) : step === 1 ? (
            <Screen1 value={role} onChange={setRole} />
          ) : step === 2 ? (
            <Screen2 values={motivations} onChange={setMotivations} />
          ) : (
            <Screen3 value={level} onChange={setLevel} />
          )}
        </div>
      </main>

      {/* Bottom nav */}
      {!done && (
        <footer className="px-6 pb-8 sm:px-8 sm:pb-10">
          <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-4">
            {/* Back */}
            <button
              onClick={handleBack}
              disabled={step <= 1}
              className={`flex cursor-pointer items-center gap-1.5 text-sm font-medium transition-all duration-200 ${
                step <= 1
                  ? "pointer-events-none opacity-0"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            {/* Next / Finish */}
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`h-12 cursor-pointer rounded-lg px-8 text-base font-medium transition-all duration-200 ${
                canProceed()
                  ? "bg-foreground text-background hover:bg-foreground/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {step === TOTAL_STEPS ? "Get started" : "Next"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}
