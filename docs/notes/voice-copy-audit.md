# Voice Copy Audit

Last updated: May 6, 2026

This is a static source audit for the launch voice rule: no em dashes in user-visible copy.

## Current State

The AI guardrail unit tests pass, and the current source is clean for legacy Luma/provider/internal identity terms in user-facing app surfaces.

The source is not yet clean for em dashes. A static grep for `—` and `&mdash;` across `src/app`, `src/components`, and `src/lib/email` still finds:

- user-visible copy in dashboard, profile, progress, challenge, explore, onboarding, showcase, and modal surfaces
- AI route prompt strings
- admin table placeholders
- comments and section markers

Examples of user-visible surfaces that still need copy cleanup include:

- `src/app/(app)/dashboard/page.tsx`
- `src/components/dashboard/cards/HeroGreeterCard.tsx`
- `src/components/dashboard/cards/QuickTakeCard.tsx`
- `src/components/modals/StreakRecoveryModal.tsx`
- `src/components/showcase/ChallengeViewer.tsx`
- `src/app/(app)/explore/flow/page.tsx`
- `src/app/(app)/progress/skill-ladder/page.tsx`
- `src/app/(app)/profile/page.tsx`

## Launch Decision

Do not apply a broad automated punctuation rewrite during launch freeze. The remaining em-dash cleanup should be handled in a scoped copy pass with visual spot checks, because some matches are UI placeholders, comments, or prompt text and should not all be transformed the same way.
