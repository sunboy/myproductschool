# Original Site Structure

Documented before the signup flow refactor (April 2026).

## Marketing (public, no nav)

| Route | Purpose |
|---|---|
| `/` | Root → A/B splits to `/waitlist` or `/waitlist-b` |
| `/waitlist` | Primary waitlist landing |
| `/waitlist-b` | A/B variant waitlist |
| `/waitlist-flow` | Multi-step waitlist flow |
| `/home` | Marketing home |
| `/pricing` | Pricing page |
| `/flow` | FLOW methodology explainer |
| `/luma-preview` | Luma demo/preview page |

## Auth

| Route | Purpose |
|---|---|
| `/login` | Sign in |
| `/signup` | Create account |
| `/forgot-password` | Password reset request |
| `/reset-password` | Password reset confirm |

## Onboarding (post-signup, 4-page sequence)

| Route | Purpose |
|---|---|
| `/welcome` | Welcome/marketing screen explaining FLOW |
| `/role` | Step 1: pick your role (10 options) |
| `/calibration` | Step 2: MCQ calibration (8 questions, 4 FLOW moves) |
| `/results` | Step 3: radar chart + archetype |
| `/baseline` | Baseline assessment (unused) |
| `/onboarding/welcome` | Legacy duplicate of /welcome |
| `/onboarding/role` | Legacy duplicate of /role |
| `/onboarding/calibration/frame` | Legacy freeform calibration — Frame step |
| `/onboarding/calibration/split` | Legacy calibration split view |
| `/onboarding/results` | Legacy duplicate of /results |
| `/onboarding/baseline` | Legacy baseline |

## App (authenticated — NavRail + BottomTabs)

### Core nav (4 items)

| Route | Nav label | Purpose |
|---|---|---|
| `/dashboard` | Home | Returning user dashboard |
| `/explore` | Explore | Hub: FLOW, modules, domains, showcase, plans |
| `/challenges` | Practice | Challenge list |
| `/progress` | Progress | Analytics + skill ladder |

### Explore subtree

| Route | Purpose |
|---|---|
| `/explore/flow` | FLOW methodology deep dive |
| `/explore/modules` | Modules grid |
| `/explore/modules/[slug]` | Module detail |
| `/explore/modules/[slug]/[chapter]` | Chapter reader |
| `/explore/domains` | Domains list |
| `/explore/[skillArea]` | Skill area hub |
| `/explore/[skillArea]/[topic]` | Topic detail |
| `/explore/plans` | Study plans grid |
| `/explore/plans/[slug]` | Study plan detail |
| `/explore/showcase` | Showcase (Autopsy stories + challenges) |
| `/explore/showcase/[slug]` | Showcase item detail |
| `/explore/showcase/[slug]/stories/[storySlug]` | Story reader |

### Practice subtree

| Route | Purpose |
|---|---|
| `/challenges` | Challenge hub |
| `/challenges/orientation` | Challenge orientation |
| `/challenges/[id]/feedback` | Post-challenge feedback |
| `/challenges/[id]/diagnosis` | Diagnosis view |
| `/challenges/[id]/model-answer` | Model answer |
| `/challenges/[id]/discussion` | Discussion |

### Progress subtree

| Route | Purpose |
|---|---|
| `/progress` | Analytics dashboard |
| `/progress/skill-ladder` | Skill ladder detail |

### Prep (not in nav)

| Route | Purpose |
|---|---|
| `/prep` | Prep hub |
| `/prep/study-plans` | Study plans |
| `/prep/study-plans/[slug]` | Study plan detail |

### Other app pages (not in nav)

| Route | Purpose |
|---|---|
| `/cohort` | Weekly leaderboard |
| `/domains` | Domains (legacy) |
| `/domains/[slug]` | Domain detail (legacy) |
| `/simulation` | Simulation entry |
| `/simulation/[sessionId]` | Active simulation |
| `/interview-prep` | Interview prep hub |
| `/interview-prep/[companySlug]` | Company-specific prep |
| `/flashcards` | Flashcards hub |
| `/vocabulary` | Vocabulary list |
| `/vocabulary/[conceptId]` | Concept detail |
| `/frameworks` | Frameworks reference |
| `/notes` | Notes |
| `/product-75` | Product-75 program |
| `/profile` | User profile |
| `/profile/share` | Shareable profile |
| `/settings` | Settings |
| `/settings/billing` | Billing |
| `/transfer` | Transfer page |

## Workspace (fullscreen, no NavRail)

| Route | Purpose |
|---|---|
| `/workspace/challenges/[id]` | Challenge workspace (FLOW steps) |
| `/workspace/challenges/[id]/grading` | Grading interstitial |
| `/workspace/challenges/[id]/reveal` | Answer reveal |
| `/workspace/challenges/[id]/share` | Shareable scorecard |
| `/workspace/flashcards/[domainSlug]` | Flashcard workspace |

## Admin

| Route | Purpose |
|---|---|
| `/admin` | Admin dashboard |
| `/admin/content` | Content management |
| `/admin/users` | User management |
| `/admin/waitlist` | Waitlist management |
| `/admin/luma-queue` | Luma grading queue |
| `/admin/revenue` | Revenue analytics |
