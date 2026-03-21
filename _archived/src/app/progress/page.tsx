"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowUpDown,
  ChevronRight,
  Flame,
  Clock,
  Lock,
  RotateCcw,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LumaSymbol } from "@/components/luma-symbol";
import {
  MOCK_PROGRESS_UNLOCKED,
  MOCK_PROGRESS_LOCKED,
  formatDate,
  type ProductIQData,
  type SubmissionRecord,
} from "@/lib/progress";

/* ─── Toggle: set to false to see locked state ───────────────── */
const USE_UNLOCKED = true;

/* ─── Reveal wrapper ─────────────────────────────────────────── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const prefersReduced = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (prefersReduced.current) { setVisible(true); return; }
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
    <div
      ref={ref}
      style={{
        transition: prefersReduced.current ? "none" : "opacity 0.5s ease, transform 0.5s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
      }}
    >
      {children}
    </div>
  );
}

/* ─── Animated radar ─────────────────────────────────────────── */
function AnimatedRadarChart({ data }: { data: ProductIQData }) {
  const [animProgress, setAnimProgress] = useState(0);
  const prefersReduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReduced) { setAnimProgress(1); return; }
    let start: number | null = null;
    const duration = 900;
    const step = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      setAnimProgress(Math.min(elapsed / duration, 1));
      if (elapsed < duration) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [prefersReduced]);

  const chartData = data.dimensions.map((d) => ({
    dimension: d.label.split(" ")[0], // short label for axis
    fullLabel: d.label,
    score: d.score * animProgress,
    max: 4,
  }));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart cx="50%" cy="50%" outerRadius="78%" data={chartData}>
        <PolarGrid
          stroke="currentColor"
          className="text-border"
          strokeDasharray="3 3"
          strokeOpacity={0.6}
        />
        <PolarAngleAxis
          dataKey="dimension"
          tick={({ x, y, payload, ...rest }) => (
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fontWeight={500}
              fill="currentColor"
              className="text-muted-foreground font-mono"
              {...(rest as React.SVGProps<SVGTextElement>)}
            >
              {payload.value}
            </text>
          )}
        />
        <Radar
          name="ProductIQ"
          dataKey="score"
          stroke="currentColor"
          fill="currentColor"
          fillOpacity={0.10}
          strokeWidth={2}
          dot={{ r: 3, fill: "currentColor", strokeWidth: 0 }}
          className="text-foreground"
          isAnimationActive={false}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/* ─── Blurred placeholder radar ─────────────────────────────── */
function LockedRadar() {
  const placeholderData = [
    { dimension: "Diagnosis", score: 2.8, max: 4 },
    { dimension: "Metrics", score: 2.2, max: 4 },
    { dimension: "Framing", score: 3.1, max: 4 },
    { dimension: "Hypothesis", score: 1.9, max: 4 },
    { dimension: "Recommendation", score: 2.5, max: 4 },
  ];

  return (
    <div className="relative">
      <div className="pointer-events-none select-none" style={{ filter: "blur(6px)", opacity: 0.4 }}>
        <ResponsiveContainer width="100%" height={340}>
          <RadarChart cx="50%" cy="50%" outerRadius="78%" data={placeholderData}>
            <PolarGrid stroke="#999" strokeDasharray="3 3" strokeOpacity={0.4} />
            <PolarAngleAxis
              dataKey="dimension"
              tick={({ x, y, payload, ...rest }) => (
                <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#999" className="font-mono" {...(rest as React.SVGProps<SVGTextElement>)}>
                  {payload.value}
                </text>
              )}
            />
            <Radar dataKey="score" stroke="currentColor" fill="currentColor" fillOpacity={0.15} strokeWidth={2} className="text-foreground" isAnimationActive={false} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="rounded-full bg-muted p-3">
          <Lock size={20} className="text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground text-center">
          Complete 5 challenges to unlock
        </p>
        <p className="text-xs text-muted-foreground text-center max-w-[180px]">
          Your ProductIQ Score unlocks after 5 submissions
        </p>
      </div>
    </div>
  );
}

/* ─── Score pill ─────────────────────────────────────────────── */
function ScorePill({ score }: { score: number }) {
  const pct = (score / 4) * 100;
  const color = pct >= 75 ? "text-success" : pct >= 55 ? "text-[var(--warning)]" : "text-danger";
  return (
    <div className="flex items-baseline gap-1">
      <span className={`font-mono text-5xl font-bold tabular-nums ${color}`}>
        {score.toFixed(1)}
      </span>
      <span className="font-mono text-xl text-muted-foreground font-medium">/ 4.0</span>
    </div>
  );
}

/* ─── Sparkline (SVG, no lib needed) ───────────────────────── */
function Sparkline({ values }: { values: number[] }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const w = 80;
  const h = 28;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${i * step},${h - (v / max) * h}`)
    .join(" ");

  return (
    <svg width={w} height={h} aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        className="text-foreground"
      />
      {values.map((v, i) => (
        <circle
          key={i}
          cx={i * step}
          cy={h - (v / max) * h}
          r={i === values.length - 1 ? 2.5 : 0}
          fill="currentColor"
          className="text-foreground"
        />
      ))}
    </svg>
  );
}

/* ─── Submission table ───────────────────────────────────────── */
type SortKey = "challengeId" | "score" | "date";
type SortDir = "asc" | "desc";

function SubmissionTable({ submissions }: { submissions: SubmissionRecord[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    return [...submissions].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "challengeId") cmp = a.challengeId.localeCompare(b.challengeId);
      else if (sortKey === "score") cmp = a.score / a.maxScore - b.score / b.maxScore;
      else cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [submissions, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const cols: { key: SortKey; label: string }[] = [
    { key: "challengeId", label: "Challenge" },
    { key: "score", label: "Score" },
    { key: "date", label: "Date" },
  ];

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {cols.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="px-4 py-3 text-left font-medium text-muted-foreground font-mono text-xs"
              >
                <button
                  onClick={() => handleSort(col.key)}
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer group"
                >
                  {col.label}
                  <ArrowUpDown
                    size={12}
                    className={`transition-colors ${sortKey === col.key ? "text-foreground" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`}
                  />
                </button>
              </th>
            ))}
            <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground font-mono text-xs">
              Retry
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((sub, i) => {
            const pct = Math.round((sub.score / sub.maxScore) * 100);
            const scoreColor =
              pct >= 80 ? "text-success" : pct >= 65 ? "text-[var(--warning)]" : "text-danger";
            return (
              <tr
                key={`${sub.challengeId}-${i}`}
                className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/challenges/${sub.challengeId.toLowerCase()}/feedback`}
                    className="group flex flex-col gap-0.5"
                  >
                    <span className="font-semibold text-foreground group-hover:text-accent transition-colors flex items-center gap-1">
                      {sub.challengeId}
                      <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
                    </span>
                    <span className="text-xs text-muted-foreground leading-tight line-clamp-1 max-w-[220px]">
                      {sub.challengeTitle}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-mono font-semibold tabular-nums ${scoreColor}`}>
                    {sub.score}/{sub.maxScore}
                  </span>
                  <span className="ml-1.5 text-xs text-muted-foreground font-mono tabular-nums">({pct}%)</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap font-mono tabular-nums">
                  {formatDate(sub.date)}
                </td>
                <td className="px-4 py-3">
                  {sub.retryUsed ? (
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--warning)] font-mono">
                      <RotateCcw size={10} />
                      Yes
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Layer progress row ─────────────────────────────────────── */
function LayerRow({ layer, index }: { layer: ProductIQData["layers"][number]; index: number }) {
  const pct = Math.round((layer.completed / layer.total) * 100);

  const inner = (
    <div
      className={`flex items-center gap-4 rounded-lg border p-4 transition-colors duration-200 ${
        layer.locked
          ? "border-border bg-muted/30 opacity-60"
          : "border-border bg-card hover:border-accent/30 cursor-pointer"
      }`}
    >
      {/* Layer number */}
      <div
        className={`flex shrink-0 h-9 w-9 items-center justify-center rounded-full text-sm font-bold font-mono ${
          layer.locked
            ? "bg-muted text-muted-foreground"
            : pct === 100
            ? "bg-success/15 text-success"
            : "bg-foreground/10 text-foreground"
        }`}
      >
        {layer.locked ? <Lock size={14} /> : pct === 100 ? <CheckCircle2 size={16} /> : layer.id}
      </div>

      {/* Label + bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-sm font-semibold text-foreground">
            {layer.label}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums shrink-0 ml-2 font-mono">
            {layer.locked ? layer.sublabel : `${layer.completed} / ${layer.total}`}
          </span>
        </div>
        {!layer.locked && (
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? "bg-success" : "bg-foreground"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        {!layer.locked && (
          <p className="text-xs text-muted-foreground mt-1">
            {layer.sublabel}
          </p>
        )}
      </div>

      {!layer.locked && (
        <ChevronRight size={16} className="text-muted-foreground/50 shrink-0" />
      )}
    </div>
  );

  return (
    <Reveal delay={index * 60}>
      {layer.locked ? inner : <Link href={layer.href}>{inner}</Link>}
    </Reveal>
  );
}

/* ─── Loading skeleton ───────────────────────────────────────── */
function ProgressLoading() {
  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <div className="h-7 w-48 rounded bg-muted animate-pulse mb-2" />
      <div className="h-4 w-64 rounded bg-muted animate-pulse mb-10" />
      <div className="h-[340px] rounded-lg bg-muted animate-pulse mb-8" />
      <div className="h-32 rounded-lg bg-muted animate-pulse mb-8" />
      <div className="h-48 rounded-lg bg-muted animate-pulse" />
    </div>
  );
}

/* ─── Stat card ──────────────────────────────────────────────── */
function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium font-mono uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
        {value}
      </p>
      {sub && <div>{sub}</div>}
    </div>
  );
}

/* ─── Section header ─────────────────────────────────────────── */
function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-base font-semibold text-foreground mb-4">
      {title}
    </h2>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function ProgressPage() {
  const [data, setData] = useState<ProductIQData | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setData(USE_UNLOCKED ? MOCK_PROGRESS_UNLOCKED : MOCK_PROGRESS_LOCKED);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  if (!data) return <ProgressLoading />;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">

        {/* -- PAGE HEADER -- */}
        <Reveal delay={0}>
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
              Your ProductIQ Score
            </h1>
            <p className="text-sm text-muted-foreground">
              {data.unlocked
                ? `Last updated: Challenge ${data.lastUpdatedChallenge}`
                : "Complete 5 challenges to unlock your full score"}
            </p>
          </div>
        </Reveal>

        {/* -- RADAR CHART CARD -- */}
        <Reveal delay={80}>
          <div className="rounded-lg border border-border bg-card mb-8 overflow-hidden">
            {/* Card header */}
            <div className="px-6 pt-6 pb-2 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.1em] uppercase text-muted-foreground/60 mb-1 font-mono">
                  Skill Radar
                </p>
                {data.unlocked ? (
                  <ScorePill score={data.overallScore} />
                ) : (
                  <p className="text-base font-semibold text-muted-foreground">
                    Unlock after 5 challenges
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <LumaSymbol size="sm" active />
                <span className="text-xs text-muted-foreground font-mono">ProductIQ</span>
              </div>
            </div>

            {/* Chart */}
            <div className="px-2 py-2">
              {data.unlocked ? (
                <AnimatedRadarChart data={data} />
              ) : (
                <LockedRadar />
              )}
            </div>

            {/* Dimension list */}
            {data.unlocked && (
              <div className="border-t border-border/50 divide-y divide-border/40">
                {data.dimensions.map((dim) => {
                  const pct = (dim.score / 4) * 100;
                  const color = pct >= 80 ? "text-success" : pct >= 55 ? "text-[var(--warning)]" : "text-danger";
                  return (
                    <div key={dim.key} className="px-6 py-3 flex items-center gap-4">
                      <div className="w-28 shrink-0">
                        <p className="text-[12px] font-semibold text-foreground truncate">
                          {dim.label}
                        </p>
                      </div>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-foreground transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`w-10 text-right text-xs font-bold font-mono tabular-nums shrink-0 ${color}`}>
                        {dim.score.toFixed(1)}
                      </span>
                      <p className="hidden md:block text-xs text-muted-foreground flex-1 min-w-0 truncate">
                        {dim.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Reveal>

        {/* -- LUMA SUMMARY -- */}
        {data.unlocked && data.lumaSummary && (
          <Reveal delay={160}>
            <div className="rounded-lg bg-accent/10 border border-accent/20 px-6 py-5 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <LumaSymbol size="sm" active />
                <span className="font-mono text-xs font-semibold tracking-[0.1em] uppercase text-accent">
                  Luma&apos;s Pattern Analysis
                </span>
              </div>
              <p className="text-[15px] leading-[1.8] text-foreground/90">
                {data.lumaSummary}
              </p>
            </div>
          </Reveal>
        )}

        {/* -- SUBMISSION HISTORY -- */}
        <Reveal delay={240}>
          <section className="mb-8">
            <SectionHeader title="Submission History" />
            {data.submissions.length === 0 ? (
              <div className="rounded-lg border border-border bg-card px-6 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No submissions yet. <Link href="/challenges" className="text-accent hover:underline">Start a challenge &rarr;</Link>
                </p>
              </div>
            ) : (
              <SubmissionTable submissions={data.submissions} />
            )}
          </section>
        </Reveal>

        {/* -- LAYER PROGRESS -- */}
        <Reveal delay={320}>
          <section className="mb-8">
            <SectionHeader title="Layer Progress" />
            <div className="flex flex-col gap-3">
              {data.layers.map((layer, i) => (
                <LayerRow key={layer.id} layer={layer} index={i} />
              ))}
            </div>
          </section>
        </Reveal>

        {/* -- STREAK + STATS -- */}
        <Reveal delay={400}>
          <section className="mb-10">
            <SectionHeader title="Engagement" />
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                icon={<Flame size={13} />}
                label="Current streak"
                value={`${data.streakDays}d`}
              />
              <StatCard
                icon={<Clock size={13} />}
                label="Time invested"
                value={`${data.totalHoursSpent}h`}
              />
              <StatCard
                icon={<TrendingUp size={13} />}
                label="Weekly activity"
                value={`${data.weeklyActivity[data.weeklyActivity.length - 1]}`}
                sub={
                  <div className="flex items-end gap-2">
                    <Sparkline values={data.weeklyActivity} />
                    <span className="text-[10px] text-muted-foreground pb-0.5 font-mono">
                      8 wks
                    </span>
                  </div>
                }
              />
            </div>
          </section>
        </Reveal>

        {/* -- CTA -- */}
        <Reveal delay={460}>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link href="/challenges" className="w-full sm:w-auto">
              <Button className="w-full bg-foreground text-background hover:bg-foreground/90 cursor-pointer">
                Practice more challenges
                <ChevronRight size={14} className="ml-1" />
              </Button>
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full cursor-pointer">
                Back to dashboard
              </Button>
            </Link>
          </div>
        </Reveal>

      </div>
    </div>
  );
}
