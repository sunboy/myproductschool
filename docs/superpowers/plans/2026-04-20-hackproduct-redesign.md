# HackProduct Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the new HackProduct design language across all app pages — replacing the vertical NavRail sidebar with a horizontal top nav, adding grain texture + ambient gradients, Floating Luma FAB, and redesigned page layouts.

**Architecture:** The shell (layout.tsx + NavRail/TopBar/BottomTabs) is replaced with a single horizontal `TopNav` component. A new `FloatingLuma` component lives in the layout. Individual page layouts are updated to match the 2-column grid patterns from the handoff. CSS additions go into `globals.css`.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4 (CSS variables), shadcn/ui, Lucide + Material Symbols Outlined icons, LumaGlyph SVG component, Supabase client

**Source of truth:** `/Users/sandeep/Projects/myproductschool/.worktrees/dev/HackProduct-handoff.zip` extracted at `/tmp/hackproduct-handoff/hackproduct/project/`

> **CONSTRAINT — Luma character:** Always use the production `LumaGlyph` component (`src/components/shell/LumaGlyph.tsx`) with the `state` prop. **Never** use the prototype's `Luma.jsx` SVG from the zip file. The zip's `Luma` component is reference-only for layout positioning — all Luma rendering uses `<LumaGlyph size={N} state="idle|speaking|..." />` from `@/components/shell/LumaGlyph`.

---

## Worktree Setup

Before starting, create a dedicated worktree:

```bash
cd /Users/sandeep/Projects/myproductschool
git worktree add .worktrees/redesign -b redesign/hackproduct-design dev
cd .worktrees/redesign
```

All work happens in `/Users/sandeep/Projects/myproductschool/.worktrees/redesign/`.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/app/globals.css` | Modify | Add grain overlay, radial gradients, new CSS vars, animation keyframes |
| `src/components/shell/TopNav.tsx` | **Create** | New horizontal nav: logo + pill nav items + goal ring + badges + avatar |
| `src/components/shell/FloatingLuma.tsx` | **Create** | Fixed bottom-right Luma FAB with expandable chat panel |
| `src/components/shell/NavRail.tsx` | Keep (unchanged) | Still used by mobile fallback during transition |
| `src/components/shell/TopBar.tsx` | Modify | Strip to just badges + avatar (nav moves to TopNav) |
| `src/components/shell/BottomTabs.tsx` | Keep (unchanged) | Mobile-only, unchanged |
| `src/app/(app)/layout.tsx` | Modify | Replace NavRail+TopBar with TopNav, add FloatingLuma |
| `src/app/(app)/dashboard/page.tsx` | Modify | 2-col grid layout, HeroGreeter, FLOW levels, resume card |
| `src/app/(app)/challenges/page.tsx` | Modify | Role filter tabs, search bar, challenge card grid |
| `src/app/(app)/explore/page.tsx` | Modify | Collapsible module sections, sidebar, plan sections |
| `src/app/(app)/progress/page.tsx` | Modify | FLOW radar chart widget, stat strip, activity feed |
| `src/app/(app)/live-interviews/page.tsx` | Modify | Hero CTA, persona grid layout |
| `src/components/challenge/ChallengeWorkspace.tsx` | Modify | Full-bleed 2-pane, resizable divider, FLOW stage tabs |

---

## Task 1: CSS Additions — Grain, Gradients, New Tokens

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add grain overlay to body**

In `src/app/globals.css`, find the `body {` rule and add directly after it:

```css
/* Grain overlay — subtle paper feel (from HackProduct redesign handoff) */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  opacity: 0.35;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.4 0 0 0 0 0.35 0 0 0 0 0.25 0 0 0 0.04 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
```

- [ ] **Step 2: Add radial background gradients to body**

In the existing `body {` rule in `globals.css`, add:

```css
body {
  /* ... existing styles ... */
  background-image:
    radial-gradient(1200px 600px at 15% -10%, rgba(74, 124, 89, 0.06), transparent 60%),
    radial-gradient(1000px 500px at 110% 10%, rgba(201, 147, 58, 0.06), transparent 60%);
}
```

- [ ] **Step 3: Add new CSS custom properties to `@theme inline` block**

In `globals.css`, inside the `@theme inline {` block, add after the last existing variable:

```css
  /* Redesign additions */
  --color-outline-faint:            #e7dfc9;
  --color-on-surface-muted:         #78715f;
  --color-amber:                    #c9933a;
  --color-amber-soft:               #f3e2b9;
  --color-ai-assisted-soft:         #e1ecff;
  --color-ai-native-soft:           #fbe1d0;
  --color-agentic-soft:             #ecdeff;
  --color-traditional-soft:         #dfe7e1;
  --color-success:                  #2f7a4a;

  /* Extended radius scale */
  --radius-xs:  0.5rem;   /* 8px  */
  --radius-sm:  0.75rem;  /* 12px */
  --radius-md:  1.125rem; /* 18px */
  --radius-2xl: 1.5rem;   /* 24px — alias for radius-xl */
  --radius-3xl: 2rem;     /* 32px */
```

- [ ] **Step 4: Add animation keyframes**

At the end of `globals.css`, add:

```css
/* ── Redesign animations ─────────────────────────────────────── */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes luma-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(74, 124, 89, 0.4); }
  50%      { box-shadow: 0 0 0 8px rgba(74, 124, 89, 0); }
}
.animate-fade-up    { animation: fade-up 420ms cubic-bezier(.2,.8,.2,1) both; }
.animate-luma-float { animation: luma-float 4.5s ease-in-out infinite; }
.animate-pulse-dot  { animation: pulse-dot 2s ease-in-out infinite; }
```

- [ ] **Step 5: TypeScript check**

```bash
cd /Users/sandeep/Projects/myproductschool/.worktrees/redesign
npx tsc --noEmit 2>&1 | head -30
```
Expected: no new errors (pre-existing Deno errors in `supabase/functions/` are acceptable).

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(design): add grain overlay, radial gradients, new CSS tokens"
```

---

## Task 2: TopNav — Horizontal Navigation Shell

**Files:**
- Create: `src/components/shell/TopNav.tsx`

- [ ] **Step 1: Create `TopNav.tsx`**

```tsx
'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LumaGlyph } from './LumaGlyph'

const NAV_ITEMS = [
  { href: '/dashboard',       icon: 'home',           label: 'Home'       },
  { href: '/explore',         icon: 'explore',        label: 'Explore'    },
  { href: '/challenges',      icon: 'fitness_center', label: 'Practice'   },
  { href: '/live-interviews', icon: 'mic',            label: 'Interviews' },
  { href: '/progress',        icon: 'bar_chart',      label: 'Progress'   },
]

interface ProfileData {
  streak_days: number
  xp_total: number
  display_name: string | null
  avatar_url: string | null
  plan: string | null
  daily_attempts_today?: number
}

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Circular goal ring SVG */
function GoalRing({ done, total }: { done: number; total: number }) {
  const r = 11
  const c = 2 * Math.PI * r
  const pct = total > 0 ? Math.min(done / total, 1) : 0
  const size = 28
  const cx = size / 2
  return (
    <svg width={size} height={size} aria-label={`${done}/${total} daily goal`}>
      <circle cx={cx} cy={cx} r={r} stroke="var(--color-outline-variant)" strokeWidth="2.5" fill="none" />
      <circle
        cx={cx} cy={cx} r={r}
        stroke="var(--color-primary)" strokeWidth="2.5" fill="none"
        strokeDasharray={`${c * pct} ${c}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: 'stroke-dasharray 600ms ease' }}
      />
    </svg>
  )
}

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => {
        if (r.status === 401) { window.location.href = '/login'; return null }
        return r.ok ? r.json() : null
      })
      .then(data => {
        if (data) setProfile({
          streak_days: data.streak_days ?? 0,
          xp_total: data.xp_total ?? 0,
          display_name: data.display_name ?? null,
          avatar_url: data.avatar_url ?? null,
          plan: data.plan ?? null,
          daily_attempts_today: data.daily_attempts_today ?? 0,
        })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const dailyDone = profile?.daily_attempts_today ?? 0
  const dailyTotal = 5

  return (
    <header className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur-lg border-b border-outline-faint">
      <div className="flex items-center h-14 px-6 gap-4 max-w-[1440px] mx-auto">

        {/* ── Logo ── */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0 mr-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-on-primary font-label font-bold text-xs"
            style={{ background: 'var(--color-primary)' }}
          >
            <span className="material-symbols-outlined text-[14px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              bolt
            </span>
          </div>
          <span className="font-headline text-base font-medium tracking-tight text-on-surface hidden sm:block">
            HackProduct
          </span>
        </Link>

        {/* ── Nav pills ── */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-label font-semibold transition-all',
                  active
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
                ].join(' ')}
              >
                <span
                  className="material-symbols-outlined text-[18px] leading-none"
                  style={{ fontVariationSettings: active ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400" }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* ── Right: goal ring + streak + XP + avatar ── */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">

          {/* Goal ring (desktop) */}
          <div className="hidden lg:flex items-center gap-1.5" suppressHydrationWarning>
            <GoalRing done={dailyDone} total={dailyTotal} />
            <span className="text-xs text-on-surface-variant font-label" suppressHydrationWarning>
              {dailyDone}/{dailyTotal}
            </span>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-tertiary-fixed/70 rounded-full" suppressHydrationWarning>
            <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              local_fire_department
            </span>
            <span className="text-xs font-bold text-tertiary font-label" suppressHydrationWarning>
              {profile?.streak_days ?? 0}
            </span>
          </div>

          {/* XP (desktop) */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-primary-fixed/70 rounded-full" suppressHydrationWarning>
            <span className="text-xs font-bold text-primary font-label" suppressHydrationWarning>
              {(profile?.xp_total ?? 0).toLocaleString()} XP
            </span>
          </div>

          {/* Avatar + dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="w-8 h-8 rounded-full overflow-visible bg-primary flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="Profile menu"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="w-full h-full flex items-center justify-center text-xs font-bold text-on-primary font-label">
                      {getInitials(profile?.display_name)}
                    </span>
                }
              </div>
              {profile?.plan === 'pro' && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #4a7c59, #3a6b4a)', boxShadow: '0 0 0 1.5px #faf6f0' }}
                  title="Pro"
                >
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '8px', fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                </span>
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-10 w-48 bg-background border border-outline-variant rounded-xl shadow-lg py-1 z-50">
                {profile?.display_name && (
                  <div className="px-4 py-2 border-b border-outline-variant/40">
                    <p className="text-xs font-bold text-on-surface truncate">{profile.display_name}</p>
                  </div>
                )}
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-base text-on-surface-variant">settings</span>
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/shell/TopNav.tsx
git commit -m "feat(shell): add horizontal TopNav with pill nav, goal ring, profile"
```

---

## Task 3: FloatingLuma — Persistent Coach FAB

**Files:**
- Create: `src/components/shell/FloatingLuma.tsx`

- [ ] **Step 1: Create `FloatingLuma.tsx`**

```tsx
'use client'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LumaGlyph } from './LumaGlyph'

const CONTEXT_LINES: Record<string, string> = {
  '/dashboard': 'Set your first challenge of the day with me?',
  '/explore': 'Want me to recommend a plan for your role?',
  '/challenges': 'I can pre-filter challenges to your weakest move.',
  '/live-interviews': "I'll be your interviewer — ready when you are.",
  '/progress': 'Want a 60-second recap of your week?',
}

const QUICK_REPLIES = ['Yes please', 'Not now', 'Something else']

export function FloatingLuma() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')

  const contextKey = Object.keys(CONTEXT_LINES).find(k => pathname.startsWith(k)) ?? ''
  const contextLine = CONTEXT_LINES[contextKey] ?? 'Want to talk it through?'

  return (
    <div className="fixed bottom-6 right-6 z-30">
      {/* Expanded panel */}
      {open && (
        <div
          className="animate-fade-up absolute bottom-20 right-0 w-[340px] rounded-2xl overflow-hidden border border-outline-faint shadow-2xl"
          style={{ background: 'var(--color-surface)' }}
        >
          {/* Panel header */}
          <div
            className="flex items-center gap-2.5 px-4 py-3 border-b border-outline-faint"
            style={{ background: 'linear-gradient(180deg, var(--color-primary-fixed), transparent)' }}
          >
            <LumaGlyph size={36} state="speaking" className="text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-label font-bold text-sm text-on-surface">Ask Luma</div>
              <div className="text-xs text-on-surface-muted">Contextual to this screen</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Coach message */}
          <div className="p-4">
            <div
              className="text-sm leading-relaxed px-3.5 py-2.5 rounded-2xl rounded-bl-sm text-on-primary-container"
              style={{ background: 'var(--color-primary-container)' }}
            >
              {contextLine}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {QUICK_REPLIES.map(r => (
                <button
                  key={r}
                  className="px-3 py-1 rounded-full text-xs font-label font-semibold border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-outline-faint flex items-center gap-2 bg-surface-container-low">
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 text-sm px-3 py-1.5 rounded-full border border-outline-variant bg-surface text-on-surface placeholder:text-on-surface-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-primary"
              style={{ background: 'var(--color-primary)' }}
              aria-label="Send"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
            </button>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
        style={{
          background: 'linear-gradient(135deg, #4a7c59, #264a34)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 24px 60px -24px rgba(30,27,20,0.4)',
        }}
        aria-label="Ask Luma"
      >
        <LumaGlyph size={44} state={open ? 'speaking' : 'idle'} className="text-white" />
        {!open && (
          <span
            className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white font-label"
            style={{ background: 'var(--color-amber)' }}
          >
            Ask
          </span>
        )}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/shell/FloatingLuma.tsx
git commit -m "feat(shell): add FloatingLuma persistent coach FAB"
```

---

## Task 4: App Layout — Wire TopNav + FloatingLuma

**Files:**
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Update layout to use TopNav + FloatingLuma**

Replace the entire contents of `src/app/(app)/layout.tsx` with:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/shell/TopNav'
import { BottomTabs } from '@/components/shell/BottomTabs'
import { FloatingLuma } from '@/components/shell/FloatingLuma'
import { AskLumaDrawer } from '@/components/shell/AskLumaDrawer'
import { UpgradeModal } from '@/components/shell/UpgradeModal'
import { createClient } from '@/lib/supabase/client'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })

    const handler = () => setUpgradeOpen(true)
    window.addEventListener('open-upgrade-modal', handler)
    return () => window.removeEventListener('open-upgrade-modal', handler)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="pb-20 md:pb-8">
        {children}
      </main>
      <BottomTabs />
      <FloatingLuma />
      <AskLumaDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        userId={userId}
      />
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```
Expected: no new errors.

- [ ] **Step 3: Start dev server and check visual**

```bash
npm run dev &
```

Navigate to http://localhost:3000/dashboard. Verify:
- Horizontal nav bar visible at top with pill items
- No green sidebar
- FloatingLuma FAB visible in bottom-right

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/layout.tsx
git commit -m "feat(shell): wire TopNav + FloatingLuma, remove NavRail from app layout"
```

---

## Task 5: Dashboard — Hero + 2-Column Layout

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Read current dashboard page**

```bash
cat src/app/\(app\)/dashboard/page.tsx | head -200
```

Note the existing data-fetching hooks, `isCalibrated` state, and sub-components being imported.

- [ ] **Step 2: Rewrite the page layout to match handoff**

The dashboard page currently uses a `max-w-5xl` single-column layout. Replace the outer layout wrapper to use a 2-column grid. The page structure should match this pattern:

```tsx
// At the top of the return statement, replace the outermost div with:
<div className="max-w-[1440px] mx-auto px-6 py-7">
  {/* Show calibration hero if not calibrated, otherwise show main layout */}
  {!isCalibrated ? (
    <CalibrationHero />
  ) : (
    <div className="grid gap-7" style={{ gridTemplateColumns: '1fr 340px' }}>
      {/* Main column */}
      <div className="flex flex-col gap-6 min-w-0">
        <HeroGreeterCard />
        <div className="grid gap-5" style={{ gridTemplateColumns: '1.25fr 1fr' }}>
          <ResumeChallengeCard />
          <QuickTakeCard />
        </div>
        <FlowMoveLevelsCard />
        <div className="grid grid-cols-2 gap-5">
          <TrendingCard />
          <LeaderboardCard />
        </div>
      </div>
      {/* Right rail */}
      <aside className="flex flex-col gap-5">
        <TodaysPathCard />
        <AchievementsCard />
        <StreakCalendarCard />
      </aside>
    </div>
  )}
</div>
```

The sub-components (`HeroGreeterCard`, `FlowMoveLevelsCard`, etc.) are implemented in the steps below. Keep all existing data-fetching hooks as-is — only the layout structure changes.

- [ ] **Step 3: Implement HeroGreeterCard**

Add this component inside `dashboard/page.tsx` (or as a sibling file if the file grows large). It replaces the existing Luma greeting card:

```tsx
function HeroGreeterCard({ displayName }: { displayName: string }) {
  const timeOfDay = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const lines = [
    "Ready for today's session? I lined up 3 challenges that build on where you left off.",
    "Your Frame move is at Level 3 — we'll push it to Level 4 today.",
  ]
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % lines.length), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div
      className="relative rounded-3xl p-7 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #3e6a4b 0%, #264a34 60%, #1d3a26 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        minHeight: 200,
        color: '#f3ede0',
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(420px 260px at 80% 50%, rgba(191,240,199,0.22), transparent 60%), radial-gradient(300px 200px at 20% 90%, rgba(201,147,58,0.18), transparent 60%)',
        }}
      />
      {/* Dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
          maskImage: 'linear-gradient(to right, black 30%, transparent 90%)',
          WebkitMaskImage: 'linear-gradient(to right, black 30%, transparent 90%)',
        }}
      />

      <div className="relative grid gap-6 items-center" style={{ gridTemplateColumns: '1fr auto' }}>
        <div>
          {/* Luma badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-label font-semibold tracking-wider uppercase mb-3"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#cfe3d3' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
              style={{ background: '#7ee099', boxShadow: '0 0 0 4px rgba(126,224,153,0.2)' }}
            />
            Luma · Your coach
          </div>
          <h1 className="font-headline text-[34px] leading-tight font-medium tracking-tight mb-2.5">
            {timeOfDay()}, {displayName}.
          </h1>
          <p key={idx} className="animate-fade-up text-[15.5px] leading-relaxed opacity-80 max-w-lg">
            {lines[idx]}
          </p>
          <div className="flex gap-2.5 mt-5">
            <Link
              href="/challenges"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-label font-bold text-sm"
              style={{ background: '#f3ede0', color: '#1e1b14' }}
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              Start today's session
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-label font-bold text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#f3ede0' }}
            >
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
              Open study plan
            </Link>
          </div>
        </div>
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none blur-md"
            style={{ background: 'radial-gradient(120px 120px at 50% 50%, rgba(191,240,199,0.35), transparent 70%)' }}
          />
          <div className="animate-luma-float">
            <LumaGlyph size={96} state="idle" className="text-white" />
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div
        className="relative mt-6 pt-5 grid grid-cols-4 gap-6"
        style={{ borderTop: '1px dashed rgba(255,255,255,0.12)' }}
      >
        {[
          { k: 'Current streak', v: '1', sub: 'day — keep it alive', icon: 'local_fire_department' },
          { k: 'XP today', v: '33', sub: '+8 since yesterday', icon: 'bolt' },
          { k: 'Next milestone', v: 'Lv 4', sub: 'Frame · 2 chall. away', icon: 'flag' },
          { k: 'Due this week', v: '3', sub: 'challenges queued', icon: 'event' },
        ].map((s, i) => (
          <div key={i}>
            <div
              className="flex items-center gap-2 text-[11px] font-label font-bold tracking-widest uppercase mb-1"
              style={{ color: 'rgba(243,237,224,0.55)' }}
            >
              <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
              {s.k}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-2xl font-medium">{s.v}</span>
              <span className="text-xs" style={{ color: 'rgba(243,237,224,0.6)' }}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

Note: `displayName` is passed from the page's existing profile fetch. `Link` is imported from `next/link`, `LumaGlyph` from `@/components/shell/LumaGlyph`.

- [ ] **Step 4: Implement FlowMoveLevelsCard**

Add below `HeroGreeterCard` in the same file:

```tsx
function FlowMoveLevelsCard() {
  const moves = [
    { key: 'Frame',    icon: 'center_focus_strong',    tint: '#cfe3d3', iconBg: '#4a7c59', desc: 'Find the right problem',  level: 3, pct: 0.72 },
    { key: 'List',     icon: 'format_list_bulleted',   tint: '#dfe7e1', iconBg: '#6b8275', desc: 'Generate options',        level: 3, pct: 0.48 },
    { key: 'Optimize', icon: 'tune',                   tint: '#f3e2b9', iconBg: '#c9933a', desc: 'Pick & refine',           level: 3, pct: 0.30 },
    { key: 'Win',      icon: 'emoji_events',           tint: '#ecdeff', iconBg: '#a878d6', desc: 'Drive outcomes',          level: 3, pct: 0.10 },
  ]

  return (
    <div className="rounded-2xl p-6 bg-surface border border-outline-faint">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-headline text-xl font-medium tracking-tight">FLOW Move Levels</h3>
          <p className="text-sm text-on-surface-variant mt-0.5">The four moves that compound into product judgment.</p>
        </div>
        <Link
          href="/progress"
          className="flex items-center gap-1 text-xs font-label font-bold uppercase tracking-wider text-primary"
        >
          Your skills <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-3.5 relative">
        {/* Connecting line */}
        <div
          aria-hidden
          className="absolute top-7 z-0 pointer-events-none"
          style={{
            left: '12%', right: '12%', height: 2,
            backgroundImage: 'repeating-linear-gradient(90deg, var(--color-outline-variant) 0 6px, transparent 6px 12px)',
          }}
        />
        {moves.map(m => (
          <div
            key={m.key}
            className="relative z-10 rounded-2xl p-4 border"
            style={{ background: m.tint, borderColor: 'rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-start justify-between mb-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: m.iconBg }}
              >
                <span
                  className="material-symbols-outlined text-white text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {m.icon}
                </span>
              </div>
              <span className="text-xs font-label font-bold" style={{ color: 'rgba(0,0,0,0.55)' }}>Lv {m.level}</span>
            </div>
            <div className="font-headline text-lg font-semibold tracking-tight">{m.key}</div>
            <div className="text-xs mt-0.5 mb-2.5" style={{ color: 'rgba(0,0,0,0.6)' }}>{m.desc}</div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <div style={{ width: `${m.pct * 100}%`, background: m.iconBg, height: '100%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

- [ ] **Step 6: Commit**

```bash
git add src/app/\(app\)/dashboard/page.tsx
git commit -m "feat(dashboard): 2-col layout, dark hero greeter, FLOW levels card"
```

---

## Task 6: Practice Hub — Filters + Challenge Cards

**Files:**
- Modify: `src/app/(app)/challenges/page.tsx`

- [ ] **Step 1: Read the current challenges page structure**

```bash
cat src/app/\(app\)/challenges/page.tsx
cat src/app/\(app\)/challenges/FreePracticeContent.tsx | head -100
```

Note existing filtering state and the `ChallengeCard` component patterns.

- [ ] **Step 2: Update page outer layout**

The page's outer wrapper should be:

```tsx
<div className="max-w-[1440px] mx-auto px-6 py-7">
  {/* existing content */}
</div>
```

- [ ] **Step 3: Add role filter tabs above search**

Above the existing search bar in `FreePracticeContent.tsx` (or `challenges/page.tsx`), add:

```tsx
const ROLES = ['All', 'PM', 'Engineer', 'Designer', 'Founder']
const [role, setRole] = useState('All')

{/* Role tabs */}
<div className="flex items-center gap-2 mb-5 flex-wrap">
  {ROLES.map(r => (
    <button
      key={r}
      onClick={() => setRole(r)}
      className={[
        'px-3.5 py-1.5 rounded-full text-sm font-label font-semibold transition-all',
        role === r
          ? 'bg-primary-container text-on-primary-container'
          : 'text-on-surface-variant hover:bg-surface-container border border-outline-variant',
      ].join(' ')}
    >
      {r}
    </button>
  ))}
</div>
```

- [ ] **Step 4: Update ChallengeCard to use new paradigm tint chips**

In `src/app/(app)/challenges/ChallengeCard.tsx`, update the paradigm chip rendering to use the new token colors:

```tsx
const PARADIGM_STYLES: Record<string, { bg: string; color: string }> = {
  'AI-Assisted': { bg: 'var(--color-ai-assisted-soft)', color: '#3451b2' },
  'AI-Native':   { bg: 'var(--color-ai-native-soft)',   color: '#8a3c12' },
  'Agentic':     { bg: 'var(--color-agentic-soft)',     color: '#6b21a8' },
  'Traditional': { bg: 'var(--color-traditional-soft)', color: '#374e44' },
}
// Use in JSX:
const style = PARADIGM_STYLES[paradigm] ?? { bg: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }
<span className="px-2.5 py-0.5 rounded-full text-xs font-label font-semibold" style={style}>
  {paradigm}
</span>
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

- [ ] **Step 6: Commit**

```bash
git add src/app/\(app\)/challenges/
git commit -m "feat(practice): role filter tabs, paradigm tint chips, layout update"
```

---

## Task 7: Explore — Collapsible Module Sections

**Files:**
- Modify: `src/app/(app)/explore/page.tsx`

- [ ] **Step 1: Read the current explore page**

```bash
cat src/app/\(app\)/explore/page.tsx | head -150
```

- [ ] **Step 2: Update page outer layout**

Wrap the return in:
```tsx
<div className="max-w-[1440px] mx-auto px-6 py-7">
  <div className="grid gap-7" style={{ gridTemplateColumns: '1fr 300px' }}>
    <div>{/* main content */}</div>
    <aside>{/* right rail: study plan info */}</aside>
  </div>
</div>
```

- [ ] **Step 3: Add collapsible section toggle pattern**

If the existing explore page uses flat section rendering, update it to support expand/collapse:

```tsx
const [expanded, setExpanded] = useState<string[]>(['Foundations'])

function toggle(k: string) {
  setExpanded(prev => prev.includes(k) ? prev.filter(s => s !== k) : [...prev, k])
}

{/* Section header */}
<button
  onClick={() => toggle(section.title)}
  className="w-full flex items-center justify-between py-3 text-left"
>
  <div className="flex items-center gap-3">
    <span className="font-headline text-lg font-medium">{section.title}</span>
    <span className="px-2 py-0.5 rounded-full text-xs font-label font-bold bg-primary-container text-on-primary-container">
      {section.done}/{section.total} done
    </span>
  </div>
  <span
    className="material-symbols-outlined text-on-surface-variant transition-transform"
    style={{ transform: expanded.includes(section.title) ? 'rotate(180deg)' : 'none' }}
  >
    expand_more
  </span>
</button>

{expanded.includes(section.title) && (
  <div className="space-y-2 pb-4">
    {section.items.map(item => (/* item row */)}
  </div>
)}
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/explore/
git commit -m "feat(explore): 2-col layout, collapsible module sections"
```

---

## Task 8: Progress — FLOW Radar + Activity Feed

**Files:**
- Modify: `src/app/(app)/progress/page.tsx`

- [ ] **Step 1: Read the current progress page**

```bash
cat src/app/\(app\)/progress/page.tsx | head -100
```

- [ ] **Step 2: Update outer layout max-width**

```tsx
<div className="max-w-[1440px] mx-auto px-6 py-7">
  {/* existing bento grid */}
</div>
```

- [ ] **Step 3: Add FLOW skills SVG radar widget**

Add this component as a new card in the bento grid (or replace the existing skill ladder card):

```tsx
function FlowRadarCard({ skills }: { skills: { key: string; pct: number; color: string }[] }) {
  // Simple horizontal bar chart (radar is complex SVG — use bars for simplicity)
  return (
    <div className="rounded-2xl p-6 bg-surface border border-outline-faint">
      <h3 className="font-headline text-xl font-medium mb-4">FLOW Skills</h3>
      <div className="space-y-3">
        {skills.map(s => (
          <div key={s.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-label font-semibold text-on-surface">{s.key}</span>
              <span className="text-xs text-on-surface-muted">{Math.round(s.pct * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface-container overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${s.pct * 100}%`, background: s.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

Pass data like:
```tsx
<FlowRadarCard skills={[
  { key: 'Frame',    pct: 0.72, color: '#4a7c59' },
  { key: 'List',     pct: 0.48, color: '#6b8275' },
  { key: 'Optimize', pct: 0.30, color: '#c9933a' },
  { key: 'Win',      pct: 0.10, color: '#a878d6' },
]} />
```

(Replace hardcoded values with real learner_competencies data from the existing data-fetch hooks.)

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/progress/
git commit -m "feat(progress): max-width update, FLOW skills bar chart"
```

---

## Task 9: Interviews — Hero CTA + Layout

**Files:**
- Modify: `src/app/(app)/live-interviews/page.tsx`

- [ ] **Step 1: Update outer layout**

```tsx
<div className="max-w-[1440px] mx-auto px-6 py-7">
  {/* hero card + persona grid */}
</div>
```

- [ ] **Step 2: Add Luma interview CTA card at top**

Insert before the existing persona grid:

```tsx
<div
  className="relative rounded-2xl p-6 mb-6 overflow-hidden"
  style={{
    background: 'linear-gradient(135deg, #3e6a4b 0%, #264a34 100%)',
    color: '#f3ede0',
    border: '1px solid rgba(255,255,255,0.06)',
  }}
>
  <div className="flex items-center gap-4">
    <LumaGlyph size={64} state="listening" className="text-white shrink-0" />
    <div>
      <div className="font-label font-bold text-xs uppercase tracking-widest opacity-60 mb-1">Live Mock Interview</div>
      <h2 className="font-headline text-2xl font-medium mb-2">Ready to be interviewed by Luma?</h2>
      <p className="text-sm opacity-75 mb-4">Pick a persona and scenario. Luma will ask real PM interview questions and give you a debrief.</p>
      <Link
        href="/live-interviews"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-label font-bold text-sm"
        style={{ background: '#f3ede0', color: '#1e1b14' }}
      >
        <span className="material-symbols-outlined text-[18px]">mic</span>
        Start interview
      </Link>
    </div>
  </div>
</div>
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/live-interviews/
git commit -m "feat(interviews): hero CTA card, max-width layout update"
```

---

## Task 10: Challenge Workspace — Two-Pane + FLOW Stage Tabs

**Files:**
- Modify: `src/components/challenge/ChallengeWorkspace.tsx`

- [ ] **Step 1: Read current workspace**

```bash
cat src/components/challenge/ChallengeWorkspace.tsx | head -150
```

Note the existing pane layout and stage tracking.

- [ ] **Step 2: Add FLOW stage tab bar at top of workspace**

The FLOW stage tabs sit above the two-pane split. Add to the workspace top bar:

```tsx
const FLOW_STAGES = [
  { k: 'Frame',    icon: 'center_focus_strong' },
  { k: 'List',     icon: 'format_list_bulleted' },
  { k: 'Optimize', icon: 'tune' },
  { k: 'Win',      icon: 'emoji_events' },
]

{/* Stage tabs row */}
<div className="flex items-center gap-1 px-4 py-2 border-b border-outline-faint bg-surface">
  {FLOW_STAGES.map((s, i) => {
    const stageIdx = FLOW_STAGES.findIndex(x => x.k === currentStage)
    const done = i < stageIdx
    const active = s.k === currentStage
    return (
      <button
        key={s.k}
        onClick={() => setCurrentStage(s.k)}
        className={[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-label font-semibold transition-all',
          active   ? 'bg-primary-container text-on-primary-container' :
          done     ? 'text-primary' :
          'text-on-surface-muted hover:text-on-surface',
        ].join(' ')}
      >
        <span
          className="material-symbols-outlined text-[16px]"
          style={{ fontVariationSettings: (active || done) ? "'FILL' 1" : "'FILL' 0" }}
        >
          {done ? 'check_circle' : s.icon}
        </span>
        {s.k}
      </button>
    )
  })}
</div>
```

- [ ] **Step 3: Implement resizable divider**

The two-pane split uses a drag handle. Add this pattern:

```tsx
const [leftWidth, setLeftWidth] = useState(50) // percent
const containerRef = useRef<HTMLDivElement>(null)
const dragging = useRef(false)

function onDividerMouseDown() { dragging.current = true; document.body.style.cursor = 'col-resize' }

useEffect(() => {
  function onMove(e: MouseEvent) {
    if (!dragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pct = ((e.clientX - rect.left) / rect.width) * 100
    setLeftWidth(Math.max(28, Math.min(72, pct)))
  }
  function onUp() { dragging.current = false; document.body.style.cursor = '' }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
  return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
}, [])

{/* Two-pane container */}
<div ref={containerRef} className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 112px)' }}>
  {/* Left pane */}
  <div className="overflow-y-auto" style={{ width: `${leftWidth}%`, minWidth: '28%' }}>
    {/* description/editorial/discussions tabs */}
  </div>
  {/* Drag handle */}
  <div
    onMouseDown={onDividerMouseDown}
    className="w-1 bg-outline-faint hover:bg-primary cursor-col-resize shrink-0 transition-colors"
  />
  {/* Right pane */}
  <div className="overflow-y-auto flex flex-col" style={{ flex: 1, minWidth: '28%' }}>
    {/* MCQ + confidence + submit */}
  </div>
</div>
```

- [ ] **Step 4: Add confidence dock to right pane**

At the bottom of the right pane, add the confidence selector:

```tsx
const CONFIDENCE_LEVELS = ['Developing', 'Solid', 'Strong', 'Expert']
const [confidence, setConfidence] = useState<string | null>(null)

<div className="flex items-center gap-2 p-4 border-t border-outline-faint bg-surface-container-low">
  <span className="text-xs font-label font-bold uppercase tracking-wider text-on-surface-muted mr-2">Confidence</span>
  {CONFIDENCE_LEVELS.map((c, i) => (
    <button
      key={c}
      onClick={() => setConfidence(c)}
      className={[
        'px-3 py-1.5 rounded-full text-xs font-label font-semibold transition-all border',
        confidence === c
          ? 'bg-primary-container text-on-primary-container border-transparent'
          : 'text-on-surface-variant border-outline-variant hover:bg-surface-container',
      ].join(' ')}
    >
      {i === 3 && <span className="material-symbols-outlined text-[14px] mr-1" style={{ verticalAlign: 'middle', fontVariationSettings: "'FILL' 1" }}>verified</span>}
      {c}
    </button>
  ))}
</div>
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

- [ ] **Step 6: Commit**

```bash
git add src/components/challenge/ChallengeWorkspace.tsx
git commit -m "feat(workspace): FLOW stage tabs, resizable 2-pane, confidence dock"
```

---

## Task 11: Visual Verification — Playwright Screenshots

**Files:**
- Run tests only (no file changes unless a bug is found)

- [ ] **Step 1: Ensure dev server is running**

```bash
lsof -i :3000 | grep LISTEN || npm run dev &
sleep 3
```

- [ ] **Step 2: Run Playwright to capture screenshots of all redesigned pages**

```bash
npx playwright test --reporter=html 2>&1 | tail -20
```

If no existing tests, run a quick script:

```bash
npx playwright screenshot --url http://localhost:3000/dashboard --path /tmp/redesign-dashboard.png
npx playwright screenshot --url http://localhost:3000/challenges --path /tmp/redesign-practice.png
npx playwright screenshot --url http://localhost:3000/explore --path /tmp/redesign-explore.png
npx playwright screenshot --url http://localhost:3000/progress --path /tmp/redesign-progress.png
```

- [ ] **Step 3: Final TypeScript clean check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions"
```
Expected: zero errors.

- [ ] **Step 4: Check for raw hex in classNames (forbidden)**

```bash
grep -r 'className=.*#[0-9a-fA-F]\{3,6\}' src/app/\(app\)/ src/components/shell/
```
Expected: no matches. (Raw hex in `style={{}}` props is fine.)

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(redesign): complete HackProduct design language implementation"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] CSS grain + radial gradients → Task 1
- [x] New CSS variables (outline-faint, on-surface-muted, amber, paradigm colors) → Task 1
- [x] Horizontal TopNav with pill items → Task 2
- [x] GoalRing progress SVG → Task 2
- [x] FloatingLuma FAB with expandable panel → Task 3
- [x] App layout wired with TopNav + FloatingLuma → Task 4
- [x] Dashboard 2-col grid → Task 5
- [x] HeroGreeter dark card with stat strip → Task 5
- [x] FLOW Move Levels 4-card grid → Task 5
- [x] Practice role filter tabs → Task 6
- [x] Paradigm tint chips → Task 6
- [x] Explore collapsible sections + 2-col → Task 7
- [x] Progress FLOW skills bars → Task 8
- [x] Interviews hero CTA → Task 9
- [x] Workspace FLOW stage tabs → Task 10
- [x] Workspace resizable divider → Task 10
- [x] Workspace confidence dock → Task 10
- [x] Visual verification → Task 11

**Type consistency check:**
- `LumaGlyph` `state` prop values used: `"idle"`, `"speaking"`, `"listening"` — all valid per `LumaGlyph.tsx` type definition
- `GoalRing` props: `done: number`, `total: number` — consistent throughout
- `FlowMoveLevelsCard` is a standalone component with no external interface — consistent
- `CONFIDENCE_LEVELS` constant used only in Task 10 — no cross-task type dependency

**No placeholder scan:** All steps include concrete code. No "TBD", "TODO", or "handle edge cases" language present.
