"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  BookOpen,
  Puzzle,
  Lock,
  CreditCard,
  Truck,
  Users,
  BarChart3,
  ShoppingCart,
  Globe,
  Layers,
  Zap,
  Target,
  Lightbulb,
  GraduationCap,
  Sparkles,
  Check,
  Star,
  ChevronRight,
} from "lucide-react";
import { LumaSymbol, LumaSymbolLarge } from "@/components/luma-symbol";
import { TestimonialsSection } from "@/components/blocks/testimonials-with-marquee";
import { NumberTicker } from "@/components/ui/number-ticker";

/* ═══════════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════════ */

function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      // Use rAF to avoid synchronous setState in effect body
      const id = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(id);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function RevealSection({
  children,
  className = "",
  delay = 0,
  as: Tag = "section",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "section" | "div" | "footer" | "nav";
}) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`transition-all duration-600 ease-out ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-6 opacity-0"
      } ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
      }}
      role={Tag === "footer" ? "contentinfo" : Tag === "nav" ? "navigation" : undefined}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STICKY NAV
   ═══════════════════════════════════════════════════════════════════ */

function StickyNav() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Sticky navigation"
      className={`fixed top-0 left-0 right-0 z-50 border-b border-border bg-background transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <p className="text-base font-bold tracking-tight text-foreground">
          MyProductSchool
        </p>
        <Link href="/signup">
          <Button size="lg" className="cursor-pointer">
            Start free
          </Button>
        </Link>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════════════════════════════ */

/* AnimatedCounter replaced by NumberTicker from 21st.dev/magicui */

/* ═══════════════════════════════════════════════════════════════════
   VOCABULARY CARD CAROUSEL (Section 7)
   ═══════════════════════════════════════════════════════════════════ */

const vocabTerms = [
  { term: "DAU / MAU Ratio", definition: "Daily active users divided by monthly active users.", luma: "Measures stickiness. Social apps live and die by this." },
  { term: "Activation Rate", definition: "Percentage of new users who complete a key action.", luma: "If users don't activate, nothing downstream matters." },
  { term: "Net Revenue Retention", definition: "Revenue retained from existing customers over a period.", luma: "Above 120%? You have a compounding machine." },
  { term: "Time to Value", definition: "How quickly a user reaches their first meaningful outcome.", luma: "Shorter TTV = lower churn. Always." },
  { term: "Feature Adoption Rate", definition: "Percentage of users who use a specific feature.", luma: "Low adoption doesn't mean bad feature — it might mean bad discovery." },
];

function VocabCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % vocabTerms.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const card = vocabTerms[activeIndex];

  return (
    <div className="mx-auto max-w-md">
      <div className="relative min-h-[180px] rounded-lg border border-border bg-card p-6">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Product 75
        </p>
        <p className="mt-3 text-lg font-semibold text-foreground">
          {card.term}
        </p>
        <p className="mt-2 text-[15px] leading-[1.7] text-muted-foreground">
          {card.definition}
        </p>
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-secondary/50 p-3">
          <LumaSymbol size="sm" active className="mt-0.5" id={`vocab-${activeIndex}`} />
          <p className="text-sm italic text-foreground/80">
            {card.luma}
          </p>
        </div>
      </div>
      {/* Dots */}
      <div className="mt-4 flex justify-center gap-1.5">
        {vocabTerms.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            aria-label={`Show term ${i + 1}`}
            className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
              i === activeIndex
                ? "w-6 bg-foreground"
                : "w-1.5 bg-border hover:bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION LABEL
   ═══════════════════════════════════════════════════════════════════ */

function SectionLabel({ number, text }: { number: string; text: string }) {
  return (
    <p className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-4">
      {number} — {text}
    </p>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

interface LandingPageProps {
  variant?: "growth" | "interview";
}

export default function LandingPage({ variant = "growth" }: LandingPageProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const heroRef = useRef<HTMLElement>(null);

  const scrollToChallenge = useCallback(() => {
    document.getElementById("challenge-preview")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const headlines = {
    growth: "The practice gym for engineers who want to think like PMs.",
    interview: "Prep for the product sense round at Meta, Airbnb, Stripe.",
  };

  /* ── Data ──────────────────────────────────────────────────── */

  const craftSteps = [
    { icon: Lightbulb, title: "Concepts", desc: "Build mental models for how products work — metrics, growth loops, monetization, retention.", tier: "free" as const },
    { icon: BookOpen, title: "Reference", desc: "75 product terms with Luma's one-liner explanations. Your vocabulary foundation.", tier: "free" as const },
    { icon: Target, title: "Application", desc: "30 scenario-based challenges drawn from real PM interview loops at top companies.", tier: "pro" as const },
    { icon: GraduationCap, title: "Transfer", desc: "Interview simulations, timed practice, and cross-domain synthesis exercises.", tier: "pro" as const },
  ];

  const domains = [
    { icon: CreditCard, name: "Payments", color: "bg-emerald-500" },
    { icon: ShoppingCart, name: "Marketplace", color: "bg-blue-500" },
    { icon: Users, name: "Social", color: "bg-violet-500" },
    { icon: BarChart3, name: "SaaS", color: "bg-amber-500" },
    { icon: Truck, name: "Logistics", color: "bg-rose-500" },
    { icon: Globe, name: "Consumer", color: "bg-cyan-500" },
    { icon: Layers, name: "Platform", color: "bg-orange-500" },
    { icon: Zap, name: "Growth", color: "bg-lime-500" },
    { icon: Puzzle, name: "Developer Tools", color: "bg-pink-500" },
  ];

  const companies = [
    "Meta", "Airbnb", "Uber", "Stripe", "Google",
    "DoorDash", "Anthropic", "Notion", "Figma",
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Senior Software Engineer",
      company: "Stripe",
      quote: "I went from freezing in product reviews to leading them. The challenge format forced me to structure my thinking — something no course ever did.",
      stars: 5,
    },
    {
      name: "Marcus Chen",
      role: "Staff Engineer",
      company: "Airbnb",
      quote: "Luma caught reasoning gaps I didn't even know I had. After 10 challenges, I passed Meta's product sense round on my first attempt.",
      stars: 5,
    },
    {
      name: "Aisha Okonkwo",
      role: "Engineering Manager",
      company: "Notion",
      quote: "Product 75 alone was worth it. I reference those terms weekly in roadmap discussions. The Pro challenges took it from knowledge to instinct.",
      stars: 5,
    },
  ];

  const freePlan = [
    "All 9 learning domains",
    "Product 75 vocabulary",
    "5 diagnostic patterns",
    "Investigation playbook",
    "1 model answer per challenge",
  ];

  const proPlan = [
    "Everything in Free",
    "All 30 challenges",
    "Luma's AI feedback on every answer",
    "Full model answers",
    "ProductIQ Score",
    "Progress summaries",
    "Transfer challenges",
    "Interview simulation mode",
    "Certificate of completion",
  ];

  const faqs = [
    {
      q: "Is this for PMs?",
      a: "No. MyProductSchool is built specifically for software engineers — people who already build products but want to think about them more strategically. If you're a PM, you already have this muscle. This is for the people who build alongside you.",
    },
    {
      q: "How is this different from LeetCode?",
      a: "Completely different skill. LeetCode tests algorithmic problem-solving. MyProductSchool tests product sense — can you identify the right metric, diagnose why a feature isn't working, or prioritize a roadmap under constraints? These are the questions that separate senior engineers from Staff engineers.",
    },
    {
      q: "Will this help with my interview?",
      a: "Yes, specifically. Every challenge is tagged with the company interview loops where that question type appears. If you're prepping for Meta's product sense round or Airbnb's cross-functional interview, you'll practice exactly that format.",
    },
    {
      q: "What is Luma?",
      a: "Luma is your AI practice coach — not a chatbot. It reads your answer, identifies structural gaps in your reasoning, and gives specific, actionable feedback. Think of it as the coach who watches your game tape and tells you exactly what to fix.",
    },
    {
      q: "Is the free tier actually useful?",
      a: "Yes — it's not a teaser. You get the full Product 75 vocabulary, all 9 domain explorations, diagnostic patterns, and the investigation playbook. Free gives you the knowledge. Pro gives you the practice and the feedback.",
    },
    {
      q: "What's the refund policy?",
      a: "14 days, no questions asked — with one condition: you need to attempt at least 5 challenges. We're confident in the value, and we want you to give it a real shot before deciding. If you complete 5 challenges and don't find it useful, we'll refund you in full.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <StickyNav />

      {/* ══════════════════════════════════════════════════════════
         SECTION 1 — HERO
         ══════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative overflow-hidden px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 lg:pt-36 lg:pb-32"
      >
        {/* Dot pattern background */}
        <div
          className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-50"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-5xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto]">
            {/* Left — text */}
            <div>
              <div className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
                <Badge variant="secondary" className="rounded-sm font-mono text-[11px] font-medium uppercase tracking-[0.08em]">
                  Product sense training
                </Badge>
                <h1 className="mt-6 text-5xl font-bold tracking-[-0.04em] leading-[0.92] text-foreground sm:text-6xl lg:text-7xl">
                  {headlines[variant]}
                </h1>
                <p className="mt-6 max-w-xl text-[15px] leading-[1.7] text-muted-foreground sm:text-lg sm:leading-[1.7]">
                  Learn the framework. Practice on real scenarios. Get Luma&apos;s
                  honest feedback.
                </p>
              </div>

              <div
                className="animate-fade-in-up mt-10 flex flex-col items-start gap-4 sm:flex-row"
                style={{ animationDelay: "150ms" }}
              >
                <Link href="/signup">
                  <Button size="lg" className="h-12 cursor-pointer px-8 text-base">
                    Start free — no credit card
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <button
                  onClick={scrollToChallenge}
                  className="cursor-pointer text-base font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  See a sample challenge
                  <ChevronRight className="ml-1 inline h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Right — Luma */}
            <div
              className="animate-fade-in-up hidden lg:flex items-center justify-center"
              style={{ animationDelay: "300ms" }}
            >
              <div className="animate-luma-pulse">
                <LumaSymbolLarge active className="h-48 w-48" id="lumaHero" />
              </div>
            </div>
          </div>

          {/* Mobile Luma — centered below text */}
          <div
            className="animate-fade-in-up mx-auto mt-14 flex justify-center lg:hidden"
            style={{ animationDelay: "300ms" }}
          >
            <div className="animate-luma-pulse">
              <LumaSymbolLarge active className="h-32 w-32 sm:h-40 sm:w-40" id="lumaHeroMobile" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         SECTION 2 — PROBLEM
         ══════════════════════════════════════════════════════════ */}
      <RevealSection className="border-t border-border px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <SectionLabel number="01" text="The Problem" />
          <h2 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
            There&apos;s a split in every engineering org.
          </h2>

          <div className="mt-12 grid gap-0 sm:grid-cols-[1fr_auto_1fr]">
            {/* Left column */}
            <div className="pr-0 sm:pr-8">
              <p className="text-sm font-semibold text-muted-foreground">
                Engineers who build what&apos;s in the ticket
              </p>
              <p className="mt-3 text-[15px] leading-[1.7] text-muted-foreground/80">
                They ship on time. The code is clean. But they rarely question
                the ticket itself — whether the feature solves the right problem,
                whether the metric will actually move, whether there&apos;s a
                simpler path no one asked about.
              </p>
            </div>

            {/* Vertical divider */}
            <div className="hidden sm:block w-px bg-border" aria-hidden="true" />

            {/* Horizontal divider for mobile */}
            <div className="block sm:hidden my-8 h-px bg-border" aria-hidden="true" />

            {/* Right column */}
            <div className="pl-0 sm:pl-8">
              <p className="text-sm font-semibold text-foreground">
                Engineers who ask whether the ticket is right
              </p>
              <p className="mt-3 text-[15px] leading-[1.7] text-muted-foreground">
                They challenge scope. They propose alternatives. In sprint
                planning, they&apos;re the ones who say &ldquo;wait — what
                problem are we actually solving?&rdquo; These are the engineers
                who get promoted to Staff.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-2xl">
            <p className="text-[15px] leading-[1.7] text-muted-foreground">
              The gap between these two engineers isn&apos;t talent. It&apos;s
              product sense — the ability to reason about why a product works,
              not just how to build it. And right now, most engineers have no
              structured way to develop it. They get passed over for Staff
              because they can&apos;t articulate product tradeoffs. They freeze
              in product reviews when asked &ldquo;what metric would you
              use?&rdquo; And when they finally interview for PM-adjacent roles
              at companies like Meta or Airbnb, they bomb the product sense
              round — not because they&apos;re not smart enough, but because
              no one ever taught them the framework.
            </p>
          </div>
        </div>
      </RevealSection>

      {/* ══════════════════════════════════════════════════════════
         SECTION 3 — CRAFT FRAMEWORK
         ══════════════════════════════════════════════════════════ */}
      <RevealSection className="border-t border-border px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <SectionLabel number="02" text="The Method" />
          <h2 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
            A practice gym, not another course.
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-[1.7] text-muted-foreground">
            Four stages of mastery. Each one builds on the last.
          </p>

          <div className="relative mt-14">
            {/* Vertical connector line */}
            <div
              className="absolute left-6 top-0 bottom-0 hidden w-px bg-border sm:block"
              aria-hidden="true"
            />

            <div className="grid gap-6 sm:gap-0">
              {craftSteps.map((step, i) => (
                <CraftStep key={step.title} step={step} index={i} />
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ══════════════════════════════════════════════════════════
         SECTION 4 — MEET LUMA
         ══════════════════════════════════════════════════════════ */}
      <RevealSection className="border-t border-border px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel number="03" text="Your Coach" />
          <h2 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
            Meet Luma.
          </h2>

          <div className="mx-auto mt-10 animate-luma-pulse">
            <LumaSymbolLarge active className="mx-auto h-28 w-28 sm:h-36 sm:w-36" id="lumaSection4" />
          </div>

          <div className="mt-8 space-y-3">
            <p className="text-[15px] leading-[1.7] text-muted-foreground">
              Luma is your AI practice coach — not a chatbot, not a grading rubric.
              It reads your full answer, identifies structural gaps in your reasoning,
              and tells you exactly where your thinking broke down.
            </p>
            <p className="text-[15px] leading-[1.7] text-muted-foreground">
              Unlike ChatGPT, Luma doesn&apos;t just generate an answer for you.
              It evaluates <em>your</em> answer against a framework — the way a
              senior PM would review your work in a real product review.
            </p>
            <p className="text-[15px] leading-[1.7] text-muted-foreground">
              Luma is warm but direct. It respects your time. It won&apos;t
              sugarcoat — and that&apos;s why it works.
            </p>
          </div>

          <blockquote className="mx-auto mt-10 max-w-lg border-l-2 border-accent pl-5 text-left">
            <p className="text-[15px] leading-[1.7] italic text-foreground/80">
              &ldquo;Luma doesn&apos;t just score you. It tells you exactly what
              broke and why.&rdquo;
            </p>
          </blockquote>
        </div>
      </RevealSection>

      {/* ══════════════════════════════════════════════════════════
         SECTION 5 — DOMAIN OVERVIEW
         ══════════════════════════════════════════════════════════ */}
      <RevealSection className="border-t border-border px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <SectionLabel number="04" text="Domains" />
          <h2 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
            9 product domains. Real-world depth.
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-[1.7] text-muted-foreground">
            Each domain contains stories, challenges, and vocabulary specific to
            that product space.
          </p>

          <div className="mt-12 flex flex-wrap gap-2.5">
            {domains.map((domain) => (
              <span
                key={domain.name}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:border-foreground"
              >
                <span className={`h-2 w-2 rounded-full ${domain.color}`} aria-hidden="true" />
                {domain.name}
              </span>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ══════════════════════════════════════════════════════════
         SECTION 6 — CHALLENGE PREVIEW
         ══════════════════════════════════════════════════════════ */}
      <RevealSection className="border-t border-border px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl" id="challenge-preview">
          <SectionLabel number="05" text="Try It" />
          <h2 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
            Try a real challenge.
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-[1.7] text-muted-foreground">
            This is what practice looks like. Read the scenario. Think through
            the questions. Then see what Luma would say.
          </p>

          {/* Challenge brief */}
          <div className="mt-10 rounded-lg border border-border bg-card p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-sm font-mono text-[11px] uppercase tracking-[0.08em]">
                Challenge E1
              </Badge>
              <Badge variant="outline" className="rounded-sm font-mono text-[11px] uppercase tracking-[0.08em]">
                Payments
              </Badge>
            </div>

            <h3 className="mt-4 text-xl font-semibold text-foreground sm:text-2xl">
              Checkout Abandonment at CloudCart
            </h3>

            <div className="mt-4 space-y-3">
              <p className="text-[15px] leading-[1.7] text-muted-foreground">
                CloudCart is a mid-market e-commerce platform serving 12,000
                merchants. Over the past quarter, checkout abandonment has risen
                from 62% to 71%. The payments team shipped a new 3-step checkout
                flow last month, replacing the old single-page form. Conversion
                hasn&apos;t improved.
              </p>
              <p className="text-[15px] leading-[1.7] text-muted-foreground">
                The PM believes the issue is &ldquo;too many steps.&rdquo; The
                head of engineering thinks it&apos;s a latency problem — the
                payment processor takes 4.2 seconds on average. A third theory
                from the data team: international merchants are hitting currency
                conversion friction.
              </p>
            </div>

            {/* Questions */}
            <div className="mt-6 space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-foreground">
                  Question 1
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  What is the single metric you would investigate first, and why?
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-foreground">
                  Question 2
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  The PM wants to revert to the old single-page checkout. Make the case for or against.
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-foreground">
                  Question 3
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  Design a 2-week investigation plan. What would you measure, and what would each result tell you?
                </p>
              </div>
            </div>

            {/* Locked textarea */}
            <div className="relative mt-6">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground/40">
                  Write your answer here...
                </p>
                <div className="mt-2 h-20" />
              </div>
              {/* Frosted glass overlay */}
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-md">
                <div className="flex flex-col items-center gap-2">
                  <Lock className="h-6 w-6 text-foreground" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-foreground">
                    Start free to submit
                  </p>
                </div>
              </div>
            </div>

            {/* Blurred Luma feedback */}
            <div className="relative mt-4 overflow-hidden rounded-lg border border-accent/30 bg-secondary/30 p-5">
              <div className="flex items-start gap-3">
                <LumaSymbol size="lg" active id="lumaFeedback" />
                <div className="space-y-2 text-[15px] leading-[1.7] text-muted-foreground">
                  <p>Your framework identification is strong — you correctly identified...</p>
                  <p className="blur-[6px] select-none" aria-hidden="true">
                    However, your metric selection has a critical gap. You chose conversion rate as your north star, but didn&apos;t decompose it by step. The 3-step checkout creates three distinct drop-off points, and aggregate conversion masks which step is bleeding users. A stronger answer would segment by...
                  </p>
                  <p className="blur-[6px] select-none" aria-hidden="true">
                    Your investigation plan covers the right surface area, but the sequencing is wrong. You should run the latency analysis first because it has the smallest blast radius and fastest signal. If 4.2s processing time is the bottleneck, none of the UX changes matter until...
                  </p>
                </div>
              </div>
              <div className="absolute inset-0 flex items-end justify-center rounded-lg bg-gradient-to-t from-background/90 via-background/40 to-transparent pb-5">
                <Link href="/signup">
                  <Button className="cursor-pointer px-6">
                    <Lock className="mr-2 h-3.5 w-3.5" />
                    Unlock Luma&apos;s feedback — Start free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ══════════════════════════════════════════════════════════
         SECTION 7 — PRODUCT 75 PREVIEW
         ══════════════════════════════════════════════════════════ */}
      <RevealSection className="border-t border-border px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <SectionLabel number="06" text="Vocabulary" />
          <h2 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
            75 product metrics. All free.
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-[1.7] text-muted-foreground">
            The vocabulary is free. The practice is paid.
          </p>

          <div className="mt-12">
            <VocabCarousel />
          </div>
        </div>
      </RevealSection>

      {/* ══════════════════════════════════════════════════════════
         SECTION 8 — INTERVIEW PREP
         ══════════════════════════════════════════════════════════ */}
      <RevealSection className="border-t border-border px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel number="07" text="Interview Prep" />
          <h2 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
            Prep for the companies that matter.
          </h2>

          <div className="mt-10">
            <p className="text-lg text-muted-foreground">
              {companies.join(" \u00B7 ")}
            </p>
          </div>

          <p className="mx-auto mt-8 max-w-lg text-[15px] leading-[1.7] text-muted-foreground">
            Every challenge is tagged with where that question type appears in
            real interviews. You practice what they actually ask.
          </p>

          <div className="mt-8">
            <Link href="/signup">
              <Button variant="outline" size="lg" className="h-10 cursor-pointer px-6">
                Start your interview prep
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </RevealSection>

      {/* ══════════════════════════════════════════════════════════
         SECTION 9 — SOCIAL PROOF (21st.dev Testimonials with Marquee)
         ══════════════════════════════════════════════════════════ */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-4xl px-6 pt-16 sm:pt-24">
          <SectionLabel number="08" text="Social Proof" />
        </div>
        <TestimonialsSection
          title="Engineers who leveled up"
          description="Real feedback from engineers who practiced with Luma."
          testimonials={testimonials.map((t) => ({
            author: {
              name: t.name,
              handle: `${t.role}, ${t.company}`,
              avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(t.name)}&backgroundColor=09090b&textColor=fafafa`,
            },
            text: t.quote,
          }))}
        />
        <div className="mx-auto max-w-4xl px-6 pb-16 sm:pb-24 text-center">
          <p className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
            <NumberTicker value={2847} className="font-mono text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-foreground" />
          </p>
          <p className="mt-2 text-[15px] leading-[1.7] text-muted-foreground">
            engineers have already started
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
         SECTION 10 — PRICING
         ══════════════════════════════════════════════════════════ */}
      <RevealSection className="border-t border-border px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <SectionLabel number="09" text="Pricing" />
          <h2 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
            Simple pricing. Real value.
          </h2>

          {/* Billing toggle */}
          <div className="mt-8 flex items-center gap-3">
            <span
              className={`text-sm font-medium transition-colors ${
                billingCycle === "monthly"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Monthly
            </span>
            <Switch
              checked={billingCycle === "annual"}
              onCheckedChange={(checked) =>
                setBillingCycle(checked ? "annual" : "monthly")
              }
              aria-label="Toggle annual billing"
            />
            <span
              className={`text-sm font-medium transition-colors ${
                billingCycle === "annual"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Annual
            </span>
            {billingCycle === "annual" && (
              <Badge className="rounded-sm bg-accent text-accent-foreground font-mono text-[11px] uppercase tracking-[0.08em]">
                Save 43%
              </Badge>
            )}
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {/* Free Plan */}
            <div className="rounded-lg border border-border bg-card p-6 sm:p-8 transition-colors duration-200 hover:border-foreground">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Free
              </p>
              <p className="mt-2">
                <span className="font-mono text-5xl font-bold tabular-nums text-foreground">$0</span>
                <span className="ml-1 text-sm text-muted-foreground">/forever</span>
              </p>
              <p className="mt-2 text-[15px] leading-[1.7] text-muted-foreground">
                Build your product vocabulary and explore every domain.
              </p>

              <Link href="/signup" className="mt-6 block">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 w-full cursor-pointer"
                >
                  Start free
                </Button>
              </Link>

              <ul className="mt-6 space-y-3">
                {freePlan.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={2} />
                    <span className="text-sm text-muted-foreground">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="relative rounded-lg border-2 border-accent bg-card p-6 sm:p-8">
              <div className="absolute -top-3 left-6">
                <Badge className="rounded-sm bg-accent text-accent-foreground font-mono text-[11px] uppercase tracking-[0.08em]">
                  Most popular
                </Badge>
              </div>

              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-accent">
                Pro
              </p>
              <p className="mt-2">
                <span className="font-mono text-5xl font-bold tabular-nums text-foreground">
                  ${billingCycle === "annual" ? "199" : "29"}
                </span>
                <span className="ml-1 text-sm text-muted-foreground">
                  /{billingCycle === "annual" ? "year" : "month"}
                </span>
              </p>
              <p className="mt-2 text-[15px] leading-[1.7] text-muted-foreground">
                Full practice gym. Luma feedback. Interview simulation.
              </p>

              <Link href="/signup?plan=pro" className="mt-6 block">
                <Button variant="accent" size="lg" className="h-11 w-full cursor-pointer">
                  Get Pro
                </Button>
              </Link>

              <ul className="mt-6 space-y-3">
                {proPlan.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
                    <span className="text-sm text-muted-foreground">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  14-day refund if you attempt 5 challenges and don&apos;t find value. No questions asked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ══════════════════════════════════════════════════════════
         SECTION 11 — FAQ
         ══════════════════════════════════════════════════════════ */}
      <RevealSection className="border-t border-border px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <SectionLabel number="10" text="FAQ" />
          <h2 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>

          <div className="mt-10">
            <Accordion>
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger
                    className="cursor-pointer py-4 text-base font-medium text-foreground hover:no-underline"
                  >
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="pb-4 text-[15px] leading-[1.7] text-muted-foreground">
                      {faq.a}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </RevealSection>

      {/* ══════════════════════════════════════════════════════════
         SECTION 12 — FINAL CTA
         ══════════════════════════════════════════════════════════ */}
      <RevealSection className="border-t border-border px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto animate-luma-pulse">
            <LumaSymbolLarge active className="mx-auto h-16 w-16" id="lumaFinalCta" />
          </div>

          <blockquote className="mx-auto mt-8 max-w-lg">
            <p className="text-lg italic leading-relaxed text-foreground/80 sm:text-xl">
              &ldquo;The free layer is real. Use it. If you want to know how your
              thinking actually holds up — that&apos;s Pro.&rdquo;
            </p>
          </blockquote>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/signup">
              <Button
                variant="outline"
                size="lg"
                className="h-12 cursor-pointer px-8 text-base"
              >
                Start free
              </Button>
            </Link>
            <Link href="/signup?plan=pro">
              <Button variant="accent" size="lg" className="h-12 cursor-pointer px-8 text-base">
                Get Pro now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </RevealSection>

      {/* ══════════════════════════════════════════════════════════
         SECTION 13 — FOOTER
         ══════════════════════════════════════════════════════════ */}
      <RevealSection
        as="footer"
        className="border-t border-border px-6 py-12 sm:py-16"
      >
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between">
            {/* Logo + tagline */}
            <div>
              <p className="text-lg font-bold tracking-tight text-foreground">
                MyProductSchool
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Built for engineers. Powered by Luma.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm">
              <Link href="/about" className="text-muted-foreground transition-colors hover:text-foreground">
                About
              </Link>
              <Link href="#pricing" className="text-muted-foreground transition-colors hover:text-foreground">
                Pricing
              </Link>
              <Link href="/blog" className="text-muted-foreground transition-colors hover:text-foreground">
                Blog
              </Link>
              <a href="https://x.com/myproductschool" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground">
                Twitter/X
              </a>
              <a href="https://linkedin.com/company/myproductschool" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground">
                LinkedIn
              </a>
            </div>
          </div>

          {/* Legal */}
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-border pt-6 text-xs text-muted-foreground sm:justify-start">
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms of Service
            </Link>
            <span>&copy; {new Date().getFullYear()} MyProductSchool</span>
          </div>
        </div>
      </RevealSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CRAFT STEP (Section 3 sub-component)
   ═══════════════════════════════════════════════════════════════════ */

function CraftStep({
  step,
  index,
}: {
  step: {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    title: string;
    desc: string;
    tier: "free" | "pro";
  };
  index: number;
}) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`relative flex gap-5 transition-all duration-500 sm:py-6 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Step number dot */}
      <div
        className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-500 ${
          isVisible
            ? step.tier === "pro"
              ? "border-accent/40 bg-accent/10"
              : "border-foreground/40 bg-foreground/10"
            : "border-border bg-muted"
        }`}
      >
        <step.icon
          className={`h-5 w-5 transition-colors duration-500 ${
            isVisible
              ? step.tier === "pro"
                ? "text-accent"
                : "text-foreground"
              : "text-muted-foreground"
          }`}
          strokeWidth={1.5}
        />
      </div>

      <div className="flex-1 pb-6 sm:pb-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {step.title}
          </h3>
          <Badge
            variant={step.tier === "pro" ? "outline" : "secondary"}
            className={`rounded-sm font-mono text-[10px] uppercase tracking-[0.08em] ${
              step.tier === "pro"
                ? "border-accent/30 text-accent"
                : ""
            }`}
          >
            {step.tier}
          </Badge>
        </div>
        <p className="mt-1 text-[15px] leading-[1.7] text-muted-foreground">
          {step.desc}
        </p>
      </div>
    </div>
  );
}
