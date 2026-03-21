"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LumaSymbolLarge } from "@/components/luma-symbol";
import { NumberTicker } from "@/components/ui/number-ticker";
import {
  BookOpen,
  MessageSquareText,
  Puzzle,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────── */
interface WaitlistPageProps {
  variant?: "A" | "B";
}

/* ─── Animated Counter ──────────────────────────────────────────── */
/* AnimatedCounter replaced by NumberTicker from 21st.dev/magicui */

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function WaitlistPage({ variant = "A" }: WaitlistPageProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "duplicate" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [waitlistCount] = useState(1247);

  const headlines = {
    A: "The practice gym for engineers who want to think like PMs.",
    B: "Prep for the product sense round at Meta, Airbnb, Stripe.",
  };

  function isValidEmail(e: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isValidEmail(email)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");

    // Simulate API call — replace with real Supabase insert
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Simulate duplicate check (10% chance for demo)
    if (Math.random() < 0.1) {
      setStatus("duplicate");
      return;
    }

    setStatus("success");
  }

  const teaserItems = [
    {
      icon: BookOpen,
      title: "75 product metrics — free forever",
      description: "Build your product vocabulary from day one.",
    },
    {
      icon: MessageSquareText,
      title: "Luma's feedback on every answer",
      description: "Specific, actionable, never hand-wavy.",
    },
    {
      icon: Puzzle,
      title: "30 real-world challenges",
      description: "Scenarios from actual PM interview loops.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-6 py-16 sm:py-24 lg:py-32">
        {/* ── Hero ────────────────────────────────────────────── */}
        <section
          className="animate-fade-in-up text-center"
          style={{ animationDelay: "0ms" }}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent mb-4">
            Coming soon
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {headlines[variant]}
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Learn the framework. Practice on real scenarios. Get Luma&apos;s
            honest feedback.
          </p>
        </section>

        {/* ── Luma Introduction ───────────────────────────────── */}
        <section
          className="animate-fade-in-up mt-16 flex flex-col items-center text-center sm:mt-20"
          style={{ animationDelay: "150ms" }}
        >
          <LumaSymbolLarge
            active={true}
            className="h-24 w-24 sm:h-28 sm:w-28"
          />
          <div className="mt-6 max-w-md">
            <p className="text-base font-medium text-foreground sm:text-lg">
              Meet{" "}
              <span className="text-accent font-semibold">Luma</span> — your AI
              practice coach.
            </p>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Luma reviews every answer, spots weak reasoning, and coaches you
              to think in frameworks.
            </p>
          </div>
          <blockquote className="mt-8 max-w-lg border-l-2 border-accent/40 pl-5">
            <p className="text-base italic leading-relaxed text-foreground/80 sm:text-lg">
              &ldquo;Luma doesn&apos;t just score you. It tells you exactly what
              broke and why.&rdquo;
            </p>
          </blockquote>
        </section>

        {/* ── Email Capture ───────────────────────────────────── */}
        <section
          className="animate-fade-in-up mt-16 sm:mt-20"
          style={{ animationDelay: "300ms" }}
        >
          <div className="mx-auto max-w-md">
            {status === "success" ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-success/20 bg-success/5 px-6 py-8 text-center">
                <CheckCircle2
                  className="h-10 w-10 text-success"
                  strokeWidth={1.5}
                />
                <p className="text-lg font-semibold text-foreground">
                  You&apos;re on the list.
                </p>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll email you when we launch. Get ready to practice.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-3">
                <Label htmlFor="email" className="sr-only">
                  Email address
                </Label>
                <div className="flex flex-row gap-3">
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error" || status === "duplicate")
                        setStatus("idle");
                    }}
                    disabled={status === "loading"}
                    aria-describedby="email-feedback"
                    className="h-12 flex-1 rounded-md border-border bg-card px-4 text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  />
                  <Button
                    type="submit"
                    disabled={status === "loading" || !email}
                    className="h-12 cursor-pointer rounded-md bg-primary px-6 text-base font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {status === "loading" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    {status === "loading"
                      ? "Joining..."
                      : "Join the waitlist"}
                  </Button>
                </div>

                {/* Feedback messages */}
                <div id="email-feedback" aria-live="polite" className="min-h-5">
                  {status === "error" && (
                    <p className="text-sm text-danger">
                      {errorMessage}
                    </p>
                  )}
                  {status === "duplicate" && (
                    <p className="text-sm text-primary">
                      You&apos;re already on the list! We&apos;ll reach out
                      soon.
                    </p>
                  )}
                </div>
              </form>
            )}
          </div>
        </section>

        {/* ── Social Proof Counter ────────────────────────────── */}
        <section
          className="animate-fade-in-up mt-14 text-center sm:mt-16"
          style={{ animationDelay: "400ms" }}
        >
          <p className="tracking-tight text-foreground">
            <NumberTicker value={waitlistCount} className="font-mono text-5xl font-bold text-foreground" />
          </p>
          <p className="mt-2 text-base text-muted-foreground sm:text-lg">
            engineers already on the waitlist
          </p>
        </section>

        {/* ── Teaser List ─────────────────────────────────────── */}
        <section
          className="animate-fade-in-up mt-16 sm:mt-20"
          style={{ animationDelay: "500ms" }}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent mb-6">
            Coming soon
          </p>
          <ul className="divide-y divide-border">
            {teaserItems.map((item) => (
              <li
                key={item.title}
                className="flex items-start gap-4 py-5 first:pt-0 last:pb-0"
              >
                <item.icon
                  className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                  strokeWidth={1.5}
                />
                <div>
                  <h3 className="text-base font-semibold leading-snug text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Footer ──────────────────────────────────────────── */}
        <footer
          className="animate-fade-in-up mt-20 border-t border-border pt-8 text-center sm:mt-24"
          style={{ animationDelay: "700ms" }}
        >
          <p className="text-lg font-semibold tracking-tight text-foreground">
            MyProductSchool
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Built for engineers. Powered by Luma.
          </p>
        </footer>
      </main>
    </div>
  );
}
