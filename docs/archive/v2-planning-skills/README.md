# v2 planning skills (HISTORICAL — do not treat as runtime skills)

These five documents were engineering specs written during the v2 backend
planning phase (Luma-era naming, /api/v2/* routes, challenge_attempts_v2).
They never governed runtime AI behavior and describe a pre-overhaul
architecture. The REAL runtime skills live in ~/.claude/skills/hackproduct-*
and are loaded by the routes via src/lib/ai/skill-loader.ts. Kept for
archaeology only.
