'use client'

// HatchDirector previously emitted a contextual Hatch "route cue" bubble ~1.2s
// after each navigation (e.g. "I found your next useful rep"). Those per-page
// nudge bubbles were disabled on 2026-06-02 now that onboarding is handled by
// the deterministic Shepherd.js tour (IntroTourController). The FloatingHatch
// chat panel and workspace cues are unaffected — they do not go through here.
//
// Kept as a no-op (rather than unmounted) so re-enabling is a one-file change:
// restore the routeCue(pathname) map + the emit effect from git history around
// this date. See CLAUDE.md "Intro Tour" for context.

export function HatchDirector() {
  return null
}
