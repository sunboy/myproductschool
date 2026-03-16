"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Lock,
  Circle,
  Clock,
  ChevronDown,
  X,
  Zap,
  BookOpen,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react";
import {
  CHALLENGES,
  ALL_DOMAINS,
  ALL_COMPANIES,
  DIFFICULTY_ORDER,
  type Difficulty,
  type Domain,
  type Company,
  type ChallengeStatus,
  type Challenge,
} from "@/lib/challenges";

/* ─── Types ──────────────────────────────────────────────────── */
type SortKey = "recommended" | "difficulty" | "domain" | "status";

interface Filters {
  difficulties: Difficulty[];
  domains: Domain[];
  companies: Company[];
  status: ChallengeStatus | "all";
}

const EMPTY_FILTERS: Filters = {
  difficulties: [],
  domains: [],
  companies: [],
  status: "all",
};

/* ─── Difficulty dot color ───────────────────────────────────── */
function difficultyDotColor(d: Difficulty) {
  if (d === "Easy") return "bg-success";
  if (d === "Medium") return "bg-[var(--warning)]";
  return "bg-danger";
}

function difficultyColor(d: Difficulty) {
  if (d === "Easy") return "text-success border-success/30 bg-success/8";
  if (d === "Medium") return "text-[var(--warning)] border-[var(--warning)]/30 bg-[var(--warning)]/8";
  return "text-danger border-danger/30 bg-danger/8";
}

/* ─── Status icon ────────────────────────────────────────────── */
function StatusIcon({ status, score }: { status: ChallengeStatus; score?: string }) {
  if (status === "completed") {
    return (
      <div className="flex items-center gap-1.5">
        <CheckCircle2 size={14} className="text-success shrink-0" />
        {score && (
          <span className="text-xs font-semibold text-success font-mono">
            {score}
          </span>
        )}
      </div>
    );
  }
  if (status === "in-progress") {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-3.5 h-3.5 rounded-full border-2 border-foreground relative overflow-hidden shrink-0">
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-foreground" />
        </div>
        <span className="text-xs text-muted-foreground">
          In progress
        </span>
      </div>
    );
  }
  return <Circle size={14} className="text-muted-foreground/40 shrink-0" />;
}

/* ─── Skeleton card ──────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="h-5 w-8 rounded bg-muted/60" />
        <div className="h-4 w-14 rounded-sm bg-muted/60" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-muted/60" />
        <div className="h-4 w-3/4 rounded bg-muted/60" />
      </div>
      <div className="h-3 w-full rounded bg-muted/60" />
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-1.5">
          <div className="h-4 w-12 rounded-sm bg-muted/60" />
          <div className="h-4 w-14 rounded-sm bg-muted/60" />
        </div>
        <div className="h-3.5 w-10 rounded bg-muted/60" />
      </div>
    </div>
  );
}

/* ─── Challenge card ─────────────────────────────────────────── */
function ChallengeCard({ challenge, index }: { challenge: Challenge; index: number }) {
  const isCompleted = challenge.status === "completed";
  const isLocked = challenge.locked;

  return (
    <Link
      href={isLocked ? "#" : `/challenges/${challenge.id.toLowerCase()}`}
      onClick={isLocked ? (e) => e.preventDefault() : undefined}
      tabIndex={isLocked ? -1 : 0}
      aria-disabled={isLocked}
      className={`
        group relative flex flex-col rounded-lg border bg-card p-5 transition-all duration-200
        animate-fade-in-up
        ${isCompleted
          ? "border-success/30"
          : isLocked
          ? "opacity-60 border-border cursor-default"
          : "border-border hover:border-foreground hover:shadow-md cursor-pointer"
        }
      `}
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      {/* Lock overlay */}
      {isLocked && (
        <div className="absolute inset-0 rounded-lg flex items-center justify-center z-10 bg-background/30">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
              <Lock size={14} className="text-muted-foreground" />
            </div>
            <Badge
              variant="outline"
              className="text-[10px] h-4 px-1.5 text-[var(--pro-gold)] border-[var(--pro-gold)]/40 bg-[var(--pro-gold)]/5"
            >
              Pro
            </Badge>
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-bold text-muted-foreground/60 tracking-wider font-mono">
          {challenge.id}
        </span>
        <Badge
          variant="outline"
          className={`text-[10px] h-4 px-1.5 shrink-0 font-mono ${difficultyColor(challenge.difficulty)}`}
        >
          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${difficultyDotColor(challenge.difficulty)}`} />
          {challenge.difficulty}
        </Badge>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-foreground leading-snug mb-2 group-hover:text-foreground/80 transition-colors duration-150">
        {challenge.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1 mb-4">
        {challenge.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 mt-auto">
        {/* Domain + companies */}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <Badge
            variant="secondary"
            className="text-[10px] h-4 px-1.5 font-medium bg-foreground/8 text-foreground border-0 shrink-0"
          >
            {challenge.domain}
          </Badge>
          {challenge.companies.slice(0, 2).map((co) => (
            <Badge
              key={co}
              variant="outline"
              className="text-[10px] h-4 px-1.5 text-muted-foreground border-border shrink-0"
            >
              {co}
            </Badge>
          ))}
          {challenge.companies.length > 2 && (
            <span className="text-[10px] text-muted-foreground/60">
              +{challenge.companies.length - 2}
            </span>
          )}
        </div>

        {/* Status + time */}
        <div className="flex items-center gap-2 shrink-0">
          <StatusIcon status={challenge.status} score={challenge.score} />
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 font-mono">
            <Clock size={10} />
            {challenge.estimatedMin}m
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Filter chip ────────────────────────────────────────────── */
function FilterChip({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-150 cursor-pointer whitespace-nowrap
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        ${active
          ? color ?? "bg-foreground text-background border-foreground"
          : "bg-card text-foreground border-border hover:border-foreground/40 hover:bg-muted/30"
        }
      `}
      aria-pressed={active}
    >
      {active && <X size={10} className="shrink-0" />}
      {label}
    </button>
  );
}

/* ─── Domain dropdown ────────────────────────────────────────── */
function DomainDropdown({
  selected,
  onChange,
}: {
  selected: Domain[];
  onChange: (d: Domain[]) => void;
}) {
  const [open, setOpen] = useState(false);

  function toggle(d: Domain) {
    onChange(
      selected.includes(d) ? selected.filter((x) => x !== d) : [...selected, d]
    );
  }

  return (
    <div className="relative" data-domain-dropdown="">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-150 cursor-pointer whitespace-nowrap
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          ${selected.length > 0
            ? "bg-foreground text-background border-foreground"
            : "bg-card text-foreground border-border hover:border-foreground/40 hover:bg-muted/30"
          }
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        Domain
        {selected.length > 0 && <span className="font-bold">({selected.length})</span>}
        <ChevronDown size={10} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full mt-2 left-0 z-30 w-52 rounded-lg border border-border bg-card shadow-lg shadow-black/5 dark:shadow-black/20 p-1.5">
            {ALL_DOMAINS.map((d) => (
              <button
                key={d}
                role="option"
                aria-selected={selected.includes(d)}
                onClick={() => toggle(d)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs hover:bg-muted/50 transition-colors duration-150 cursor-pointer text-left"
              >
                <span className={selected.includes(d) ? "font-semibold text-foreground" : "text-foreground"}>
                  {d}
                </span>
                {selected.includes(d) && <CheckCircle2 size={12} className="text-foreground shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Sort dropdown ──────────────────────────────────────────── */
function SortDropdown({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (s: SortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const OPTIONS: { key: SortKey; label: string }[] = [
    { key: "recommended", label: "Recommended" },
    { key: "difficulty", label: "By difficulty" },
    { key: "domain", label: "By domain" },
    { key: "status", label: "By status" },
  ];
  const current = OPTIONS.find((o) => o.key === value)!;

  return (
    <div className="relative" data-sort-dropdown="">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-card hover:border-foreground/40 hover:bg-muted/30 transition-all duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <ArrowUpDown size={10} />
        {current.label}
        <ChevronDown size={10} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute top-full mt-2 right-0 z-30 w-44 rounded-lg border border-border bg-card shadow-lg shadow-black/5 dark:shadow-black/20 p-1.5">
            {OPTIONS.map((opt) => (
              <button
                key={opt.key}
                role="option"
                aria-selected={value === opt.key}
                onClick={() => { onChange(opt.key); setOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs hover:bg-muted/50 transition-colors duration-150 cursor-pointer text-left"
              >
                <span className={value === opt.key ? "font-semibold text-foreground" : "text-foreground"}>
                  {opt.label}
                </span>
                {value === opt.key && <CheckCircle2 size={12} className="text-foreground shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Status filter tabs ─────────────────────────────────────── */
const STATUS_OPTIONS: { key: ChallengeStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "not-started", label: "Not started" },
  { key: "in-progress", label: "In progress" },
  { key: "completed", label: "Completed" },
];

/* ─── Main page ──────────────────────────────────────────────── */
export default function ChallengePage() {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("recommended");
  const [filtersVisible, setFiltersVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  // Stats
  const completed = CHALLENGES.filter((c) => c.status === "completed").length;
  const inProgress = CHALLENGES.filter((c) => c.status === "in-progress").length;
  const remaining = CHALLENGES.filter((c) => c.status === "not-started").length;

  // Filter logic
  const filtered = useMemo(() => {
    let result = CHALLENGES.filter((c) => {
      if (filters.difficulties.length > 0 && !filters.difficulties.includes(c.difficulty)) return false;
      if (filters.domains.length > 0 && !filters.domains.includes(c.domain)) return false;
      if (filters.companies.length > 0 && !c.companies.some((co) => filters.companies.includes(co))) return false;
      if (filters.status !== "all" && c.status !== filters.status) return false;
      return true;
    });

    // Sort
    if (sort === "difficulty") {
      result = [...result].sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]);
    } else if (sort === "domain") {
      result = [...result].sort((a, b) => a.domain.localeCompare(b.domain));
    } else if (sort === "status") {
      const order: Record<ChallengeStatus, number> = { "in-progress": 0, "not-started": 1, completed: 2 };
      result = [...result].sort((a, b) => order[a.status] - order[b.status]);
    }
    // "recommended": default array order (Easy->Medium->Hard within domain)

    return result;
  }, [filters, sort]);

  function toggleDifficulty(d: Difficulty) {
    setFilters((f) => ({
      ...f,
      difficulties: f.difficulties.includes(d)
        ? f.difficulties.filter((x) => x !== d)
        : [...f.difficulties, d],
    }));
  }

  function toggleCompany(co: Company) {
    setFilters((f) => ({
      ...f,
      companies: f.companies.includes(co)
        ? f.companies.filter((x) => x !== co)
        : [...f.companies, co],
    }));
  }

  const hasActiveFilters =
    filters.difficulties.length > 0 ||
    filters.domains.length > 0 ||
    filters.companies.length > 0 ||
    filters.status !== "all";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">

        {/* ─── Page header ───────────────────────────────────── */}
        <div className="mb-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5" aria-label="Breadcrumb">
            <Link href="/dashboard" className="hover:text-foreground transition-colors duration-150 cursor-pointer">
              Dashboard
            </Link>
            <ChevronDown size={10} className="-rotate-90 opacity-40" />
            <span className="text-foreground">Challenges</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight mb-2">
                Challenge Library
              </h1>
              <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                30 real-world product scenarios. Pick one. Think through it. Get Luma&apos;s feedback.
              </p>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-success" />
                <span className="text-sm font-semibold text-foreground font-mono">{completed}</span>
                <span className="text-xs text-muted-foreground">done</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full border-2 border-foreground relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-foreground" />
                </div>
                <span className="text-sm font-semibold text-foreground font-mono">{inProgress}</span>
                <span className="text-xs text-muted-foreground">in progress</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5">
                <Circle size={13} className="text-muted-foreground/50" />
                <span className="text-sm font-semibold text-foreground font-mono">{remaining}</span>
                <span className="text-xs text-muted-foreground">remaining</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Filter bar ────────────────────────────────────── */}
        <div className="mb-6">
          {/* Filter toggle on mobile */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <button
              onClick={() => setFiltersVisible((v) => !v)}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-card hover:bg-muted/30 transition-colors duration-150 cursor-pointer"
            >
              <SlidersHorizontal size={12} />
              Filters
              {hasActiveFilters && (
                <span className="w-4 h-4 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center font-mono">
                  {filters.difficulties.length + filters.domains.length + filters.companies.length + (filters.status !== "all" ? 1 : 0)}
                </span>
              )}
            </button>
            <div className="ml-auto md:hidden">
              <SortDropdown value={sort} onChange={setSort} />
            </div>
          </div>

          {/* Filters */}
          <div className={`${filtersVisible ? "flex" : "hidden md:flex"} flex-wrap gap-2 items-center`}>
            {/* Difficulty chips */}
            {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => (
              <FilterChip
                key={d}
                label={d}
                active={filters.difficulties.includes(d)}
                onClick={() => toggleDifficulty(d)}
                color={
                  d === "Easy"
                    ? "bg-success/15 text-success border-success/40"
                    : d === "Medium"
                    ? "bg-[var(--warning)]/12 text-[var(--warning)] border-[var(--warning)]/40"
                    : "bg-danger/10 text-danger border-danger/40"
                }
              />
            ))}

            <div className="w-px h-4 bg-border/60 shrink-0" />

            {/* Domain dropdown */}
            <DomainDropdown
              selected={filters.domains}
              onChange={(d) => setFilters((f) => ({ ...f, domains: d }))}
            />

            <div className="w-px h-4 bg-border/60 shrink-0" />

            {/* Company chips */}
            {(["Meta", "Airbnb", "Uber", "Stripe", "Google", "DoorDash"] as Company[]).map((co) => (
              <FilterChip
                key={co}
                label={co}
                active={filters.companies.includes(co)}
                onClick={() => toggleCompany(co)}
              />
            ))}

            <div className="w-px h-4 bg-border/60 shrink-0" />

            {/* Status filter */}
            <div className="flex items-center gap-1 p-0.5 rounded-md border border-border bg-muted/30">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setFilters((f) => ({ ...f, status: opt.key }))}
                  className={`
                    px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap
                    ${filters.status === opt.key
                      ? "bg-card text-foreground shadow-sm border border-border/60"
                      : "text-muted-foreground hover:text-foreground"
                    }
                  `}
                  aria-pressed={filters.status === opt.key}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Clear all */}
            {hasActiveFilters && (
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer ml-1"
              >
                <X size={11} />
                Clear all
              </button>
            )}

            {/* Sort (desktop — already in top right on mobile) */}
            <div className="hidden md:block ml-auto">
              <SortDropdown value={sort} onChange={setSort} />
            </div>
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-xs text-muted-foreground mb-5">
            {filtered.length} challenge{filtered.length !== 1 ? "s" : ""}
            {hasActiveFilters ? " match your filters" : ""}
          </p>
        )}

        {/* ─── Grid ──────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* ─── Empty state ─────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-lg bg-muted/50 flex items-center justify-center mb-4">
              <BookOpen size={24} className="text-muted-foreground/40" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">
              No challenges match your filters
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              Try broadening your search or clearing some filters.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="gap-1.5"
            >
              <X size={12} />
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((challenge, i) => (
              <ChallengeCard key={challenge.id} challenge={challenge} index={i} />
            ))}
          </div>
        )}

        {/* ─── Pro upsell footer ─────────────────────────────── */}
        {!loading && (
          <div className="mt-12 rounded-lg border border-[var(--pro-gold)]/25 bg-[var(--pro-gold)]/4 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--pro-gold)]/15 flex items-center justify-center shrink-0">
              <Zap size={18} className="text-[var(--pro-gold)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground mb-0.5">
                Unlock all 30 challenges with Pro
              </p>
              <p className="text-xs text-muted-foreground">
                Hard challenges, mock interviews, Transfer layer, and Luma&apos;s detailed scoring rubric.
              </p>
            </div>
            <Link href="/billing" className="shrink-0">
              <Button
                size="sm"
                className="bg-[var(--pro-gold)] hover:bg-[var(--pro-gold)]/90 text-white border-0 gap-1.5"
              >
                Go Pro
                <ChevronDown size={12} className="-rotate-90" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
