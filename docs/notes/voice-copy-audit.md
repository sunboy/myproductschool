# Voice Copy Audit

Last updated: May 6, 2026

This is a static source audit for the launch voice rule: no em dashes in user-visible copy.

## Current State

The AI guardrail unit tests pass, and the current source is clean for legacy Luma/provider/internal identity terms in user-facing app surfaces.

The audited source is now clean for em dashes. A static grep for literal em-dash characters and HTML mdash entities across `src/app`, `src/components`, and `src/lib/email` returned no matches on May 6, 2026.

Validation after cleanup:

- `npx tsc --noEmit --pretty false` passed.
- `npm run lint` exited `0` with the existing warning set.
- Staged secret scan passed on the cleanup commits.

## Launch Decision

The static source gate is no longer a launch blocker. Visual spot checks are still recommended on high-traffic pages because punctuation-only copy changes can slightly alter line wrapping.
