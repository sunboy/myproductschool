"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LumaSymbol } from "@/components/luma-symbol";
import {
  LayoutDashboard,
  Globe,
  Zap,
  TrendingUp,
  MessageSquare,
  Flame,
  CheckCircle2,
  Lock,
  ChevronRight,
  ArrowRight,
  Play,
  User,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  X,
  BookOpen,
  Target,
  BarChart3,
  Clock,
  Star,
} from "lucide-react";

/* ─── Mock user data ─────────────────────────────────────────── */
const USER = {
  name: "Alex",
  isPro: false,
  streak: 5,
  challengesCompleted: 8,
  challengesTotal: 30,
  lastActive: "2 days ago",
  isNew: false,
  hasActivity: true,
  productIQUnlocked: false,
};

const LUMA_NUDGE = {
  new: "Start with Layer 1. Pick a domain that interests you.",
  inProgress: "You've done 3 challenges this week. Your diagnostic accuracy is climbing.",
  returning: "It's been a while. Let's pick up where you left off.",
};

/* ─── Navigation data ────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, active: true },
  { label: "Domains", href: "/domains", icon: Globe, active: false },
  { label: "Challenges", href: "/challenges", icon: Zap, active: false },
  { label: "Progress", href: "/progress", icon: TrendingUp, active: false },
  { label: "Interview Prep", href: "/interview", icon: MessageSquare, active: false },
];

/* ─── Layer data ─────────────────────────────────────────────── */
const LAYERS = [
  {
    id: 1,
    name: "Concepts",
    description: "Domain stories and mental models",
    completed: 7,
    total: 9,
    locked: false,
    active: true,
  },
  {
    id: 2,
    name: "Reference",
    description: "Frameworks and decision patterns",
    completed: 3,
    total: 5,
    locked: false,
    active: true,
  },
  {
    id: 3,
    name: "Application",
    description: "Timed product sense challenges",
    completed: 8,
    total: 30,
    locked: false,
    active: true,
  },
  {
    id: 4,
    name: "Transfer",
    description: "Mock interviews and case studies",
    completed: 0,
    total: 10,
    locked: true,
    active: false,
  },
];

/* ─── Domain data ────────────────────────────────────────────── */
const DOMAINS = [
  { id: "payments", name: "Payments", icon: CreditCard, storiesRead: 4, storiesTotal: 4, done: true, color: "bg-emerald-500" },
  { id: "marketplace", name: "Marketplace", icon: Globe, storiesRead: 3, storiesTotal: 4, done: false, color: "bg-blue-500" },
  { id: "social", name: "Social", icon: MessageSquare, storiesRead: 2, storiesTotal: 4, done: false, color: "bg-violet-500" },
  { id: "saas", name: "SaaS", icon: BarChart3, storiesRead: 4, storiesTotal: 4, done: true, color: "bg-orange-500" },
  { id: "logistics", name: "Logistics", icon: Target, storiesRead: 1, storiesTotal: 4, done: false, color: "bg-rose-500" },
  { id: "healthcare", name: "Healthcare", icon: Star, storiesRead: 0, storiesTotal: 4, done: false, color: "bg-teal-500" },
  { id: "fintech", name: "Fintech", icon: TrendingUp, storiesRead: 3, storiesTotal: 4, done: false, color: "bg-indigo-500" },
  { id: "ecommerce", name: "E-commerce", icon: BookOpen, storiesRead: 4, storiesTotal: 4, done: true, color: "bg-amber-500" },
  { id: "devtools", name: "Dev Tools", icon: Zap, storiesRead: 2, storiesTotal: 4, done: false, color: "bg-cyan-500" },
];

/* ─── Recent activity data ───────────────────────────────────── */
const RECENT_ACTIVITY = [
  { id: 1, text: "Completed E-commerce domain", time: "2h ago", icon: CheckCircle2, color: "text-success", href: "/domains/ecommerce" },
  { id: 2, text: "Submitted Challenge M3 — scored 12/16", time: "Yesterday", icon: Zap, color: "text-foreground", href: "/challenges/m3" },
  { id: 3, text: "Read Pattern: Metric Decomposition", time: "2 days ago", icon: BookOpen, color: "text-foreground", href: "/patterns/metric-decomposition" },
  { id: 4, text: "Completed Payments domain", time: "3 days ago", icon: CheckCircle2, color: "text-success", href: "/domains/payments" },
];

/* ─── Skeleton component ─────────────────────────────────────── */
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted/60 dark:bg-muted/40 ${className ?? ""}`}
    />
  );
}

/* ─── User dropdown menu ─────────────────────────────────────── */
function UserMenu({ isPro }: { isPro: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" data-user-menu="">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted/60 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground">
          <User size={16} />
        </div>
        {isPro && (
          <Badge variant="default" className="text-[10px] h-4 px-1.5 bg-[var(--pro-gold)] text-white border-0 font-mono">
            Pro
          </Badge>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-card shadow-lg shadow-black/5 dark:shadow-black/20 z-50 overflow-hidden">
          <div className="p-1">
            <Link
              href="/settings"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-foreground hover:bg-muted/60 transition-colors duration-150 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Settings size={14} className="text-muted-foreground" />
              Settings
            </Link>
            <Link
              href="/billing"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-foreground hover:bg-muted/60 transition-colors duration-150 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <CreditCard size={14} className="text-muted-foreground" />
              Billing
            </Link>
            <div className="h-px bg-border my-1" />
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-danger hover:bg-danger/10 transition-colors duration-150 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sidebar navigation ─────────────────────────────────────── */
function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 bg-sidebar border-r border-sidebar-border z-40
          flex flex-col transition-transform duration-200
          md:sticky md:top-0 md:h-screen md:translate-x-0 md:z-auto md:shrink-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <LumaSymbol size="sm" active />
            <span className="text-sm font-semibold tracking-tight text-foreground">
              MyProductSchool
            </span>
          </Link>
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-md hover:bg-muted/50 text-muted-foreground cursor-pointer"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-0.5" aria-label="Main navigation">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer
                  ${link.active
                    ? "border-l-2 border-accent text-foreground font-semibold"
                    : "text-sidebar-foreground/70 hover:text-foreground hover:bg-muted/50"
                  }
                `}
                aria-current={link.active ? "page" : undefined}
              >
                <Icon size={16} className="shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: upgrade prompt for free users */}
        {!USER.isPro && (
          <div className="p-4">
            <div className="rounded-lg border border-[var(--pro-gold)]/30 bg-[var(--pro-gold)]/5 p-3.5">
              <p className="text-xs font-semibold text-[var(--pro-gold)] mb-1">
                Go Pro
              </p>
              <p className="text-xs text-muted-foreground mb-2.5">
                Unlock Transfer layer, mock interviews, and full challenge set.
              </p>
              <Link href="/billing">
                <Button size="sm" className="w-full h-7 text-xs bg-[var(--pro-gold)] hover:bg-[var(--pro-gold)]/90 text-white border-0">
                  Upgrade
                </Button>
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

/* ─── Top bar ────────────────────────────────────────────────── */
function TopBar({ onMenuOpen }: { onMenuOpen: () => void }) {
  return (
    <header className="sticky top-0 z-20 bg-background border-b border-border px-4 md:px-6 h-14 flex items-center justify-between">
      {/* Mobile: hamburger + logo */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          onClick={onMenuOpen}
          className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground cursor-pointer"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <LumaSymbol size="sm" active />
          <span className="text-sm font-semibold">
            MyProductSchool
          </span>
        </Link>
      </div>

      {/* Desktop: empty left (sidebar handles nav) */}
      <div className="hidden md:block" />

      {/* Right: user menu */}
      <div className="flex items-center gap-2">
        <UserMenu isPro={USER.isPro} />
      </div>
    </header>
  );
}

/* ─── Bottom tab bar (mobile only) ──────────────────────────── */
function BottomTabBar() {
  const mobileLinks = NAV_LINKS.slice(0, 5);
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 bg-background border-t border-border md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center">
        {mobileLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
                flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium font-mono transition-colors duration-150 cursor-pointer
                ${link.active ? "text-foreground" : "text-muted-foreground"}
              `}
              aria-current={link.active ? "page" : undefined}
            >
              <Icon size={18} />
              {link.label === "Interview Prep" ? "Interview" : link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ─── Greeting + Luma nudge ──────────────────────────────────── */
function GreetingSection({ loading }: { loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-80" />
      </div>
    );
  }

  const nudge = USER.isNew
    ? LUMA_NUDGE.new
    : USER.lastActive === "2 days ago"
    ? LUMA_NUDGE.returning
    : LUMA_NUDGE.inProgress;

  return (
    <div className="space-y-2.5">
      <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
        Welcome back, {USER.name}.
      </h1>
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0">
          <LumaSymbol size="sm" active />
        </div>
        <div className="flex items-start gap-2">
          <span className="font-mono text-accent text-xs font-semibold mt-0.5 shrink-0">LUMA</span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {nudge}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Continue card ──────────────────────────────────────────── */
function ContinueCard({ loading }: { loading: boolean }) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-9 w-32" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-accent/40 bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">
            Continue where you left off
          </p>
          <h3 className="text-base font-semibold text-foreground">
            Challenge M4 — Marketplace Prioritisation
          </h3>
          <p className="text-sm text-muted-foreground">
            Layer 3 · Medium · Started 2 days ago
          </p>
        </div>
        <Link href="/challenges/m4">
          <Button
            size="sm"
            className="shrink-0 gap-2 bg-foreground hover:bg-foreground/90 text-background"
          >
            <Play size={14} />
            Resume
          </Button>
        </Link>
      </div>
      <div className="h-1 bg-muted/50">
        <div className="h-full w-[40%] bg-accent/60 rounded-r-full" />
      </div>
    </div>
  );
}

/* ─── Layer progress cards ───────────────────────────────────── */
function LayerCards({ loading }: { loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {LAYERS.map((layer) => {
        const pct = Math.round((layer.completed / layer.total) * 100);
        return (
          <Link
            key={layer.id}
            href={layer.locked ? "#" : `/layers/${layer.id}`}
            className={`
              group rounded-lg border bg-card p-4 space-y-3 transition-all duration-200
              ${layer.locked
                ? "opacity-60 cursor-not-allowed border-border"
                : "border-border hover:border-foreground hover:shadow-sm cursor-pointer"
              }
            `}
            onClick={layer.locked ? (e) => e.preventDefault() : undefined}
            tabIndex={layer.locked ? -1 : 0}
            aria-disabled={layer.locked}
          >
            <div className="flex items-start justify-between">
              <div className={`text-xs font-semibold uppercase tracking-wider font-mono ${layer.active ? "text-accent" : "text-muted-foreground"}`}>
                Layer {layer.id}
              </div>
              {layer.locked ? (
                <div className="flex items-center gap-1">
                  <Lock size={12} className="text-muted-foreground" />
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">Pro</Badge>
                </div>
              ) : pct === 100 ? (
                <CheckCircle2 size={14} className="text-success" />
              ) : (
                <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform duration-150" />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">
                {layer.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {layer.locked ? "Complete Layer 3 Easy + Medium first" : layer.description}
              </p>
            </div>

            {!layer.locked && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono tabular-nums">
                    {layer.completed} of {layer.total}
                  </span>
                  <span className="text-xs font-medium text-foreground font-mono tabular-nums">
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${layer.active ? "bg-accent" : "bg-muted-foreground/30"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

/* ─── Quick stats row ────────────────────────────────────────── */
function QuickStats({ loading }: { loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-7 w-10" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Streak */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Flame size={14} className="text-[var(--warning)]" />
          <span className="text-xs font-medium text-muted-foreground font-mono">
            Streak
          </span>
        </div>
        <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
          {USER.streak}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono">
          days
        </p>
      </div>

      {/* Challenges */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Zap size={14} className="text-foreground" />
          <span className="text-xs font-medium text-muted-foreground font-mono">
            Challenges
          </span>
        </div>
        <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
          {USER.challengesCompleted}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono tabular-nums">
          of {USER.challengesTotal} total
        </p>
      </div>

      {/* ProductIQ */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <BarChart3 size={14} className="text-foreground" />
          <span className="text-xs font-medium text-muted-foreground font-mono">
            ProductIQ
          </span>
        </div>
        {USER.productIQUnlocked ? (
          <p className="text-2xl font-bold text-foreground font-mono tabular-nums">82</p>
        ) : (
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              Locked
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Complete 5 challenges
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Domain grid ────────────────────────────────────────────── */
function DomainGrid({ loading }: { loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
      {DOMAINS.map((domain) => {
        const Icon = domain.icon;
        const pct = Math.round((domain.storiesRead / domain.storiesTotal) * 100);
        return (
          <Link
            key={domain.id}
            href={`/domains/${domain.id}`}
            className="group rounded-lg border border-border bg-card p-3 hover:border-foreground transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${domain.color} shrink-0`} />
              {domain.done && (
                <CheckCircle2 size={12} className="text-success ml-auto" />
              )}
            </div>
            <p className="text-sm font-medium text-foreground mb-0.5">
              {domain.name}
            </p>
            <p className="text-xs text-muted-foreground font-mono tabular-nums mb-2">
              {domain.storiesRead}/{domain.storiesTotal}
            </p>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${domain.done ? "bg-success" : "bg-accent/60"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ─── Recent activity ────────────────────────────────────────── */
function RecentActivity({ loading }: { loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-56" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {RECENT_ACTIVITY.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors duration-150 cursor-pointer group"
          >
            <div className={`w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center shrink-0 ${item.color}`}>
              <Icon size={13} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">
                {item.text}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock size={10} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-mono">
                  {item.time}
                </span>
              </div>
            </div>
            <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}

/* ─── Section header ─────────────────────────────────────────── */
function SectionHeader({
  title,
  href,
  hrefLabel,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-foreground">
        {title}
      </h2>
      {href && hrefLabel && (
        <Link
          href={href}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer font-mono"
        >
          {hrefLabel}
          <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}

/* ─── Main dashboard page ────────────────────────────────────── */
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <TopBar onMenuOpen={() => setMobileNavOpen(true)} />

        {/* Page content */}
        <main
          className="flex-1 px-4 md:px-8 py-6 pb-20 md:pb-8 space-y-8 max-w-5xl w-full mx-auto"
          id="main-content"
        >
          {/* 1. Greeting */}
          <GreetingSection loading={loading} />

          {/* 2. Continue card */}
          {(loading || USER.hasActivity) && (
            <ContinueCard loading={loading} />
          )}

          {/* 3. Layer progress */}
          <section aria-labelledby="layers-heading">
            <SectionHeader title="Layer Progress" href="/layers" hrefLabel="View all" />
            <LayerCards loading={loading} />
          </section>

          {/* 4. Quick stats */}
          <section aria-labelledby="stats-heading">
            <SectionHeader title="Your Stats" />
            <QuickStats loading={loading} />
          </section>

          {/* 5. Domain grid */}
          <section aria-labelledby="domains-heading">
            <SectionHeader title="Domains" href="/domains" hrefLabel="View all" />
            <DomainGrid loading={loading} />
          </section>

          {/* 6. Recent activity */}
          <section aria-labelledby="activity-heading">
            <SectionHeader title="Recent Activity" href="/progress" hrefLabel="See all" />
            <div className="rounded-lg border border-border bg-card p-2">
              <RecentActivity loading={loading} />
            </div>
          </section>
        </main>
      </div>

      {/* Bottom tab bar (mobile) */}
      <BottomTabBar />
    </div>
  );
}
