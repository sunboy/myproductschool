# HackProduct visual overhaul — locked execution plan

Status: visual direction approved by the owner; stage 4 real-route integration in progress. This plan supersedes earlier implementation sequencing, including docs/platform-rebuild-20260905.md. Prior repairs remain preserved; they do not count as visual overhaul delivery.

## Product contract
Professional learning and upskilling for tech workers, including interview preparation. Main navigation: Home, Practice, Library, Progress. Hatch is the universal contextual companion; Claude Code belongs only to analytics. No gym/reps/loops/graded language. Preserve existing work, content, auth and payment contracts during subsequent integration.

## Scope order and gates
1. Reference board and page map. Recover actual September references and identify what is adopted, revised or superseded. No substitution of July design experiments for owner-approved references.
2. Four connected visual compositions: Home, Practice catalog, challenge workspace and reading detail. Include Home discovery/returning states, example feedback and the Library entry needed to connect the journey. Clearly label the review environment and example data. Do not imply AI responses, saves or scores are production-backed.
3. Visual review. Side-by-side reference/live composition; composition-width checks at 390, 768, 1440 (container-based in the review; actual browser/device viewport testing during integration); keyboard and touch controls; motion and reduced-motion variants. Show actual screenshots and a working preview. Compilation/test counts cannot pass this gate.
4. After owner review, integrate the approved composition into real routes, retaining their service contracts. Connect Home→Practice→workspace→feedback and Library→reader with real content and persistence. Verify Hatch suggestion→floating chat→contextual action.
5. Extend consistently to landing, authentication, first visit, interviews, analytics, Progress, account and billing. Consolidate duplicated styling only as each approved page replaces it.
6. Launch verification: authenticated complete journeys, responsive screenshots, error/retry/empty/loading states, payment tests without live charges, analytics live canary, preview deployment and rollback.

## Visual source of truth
| Reference | Provenance | Adopt | Deliberate correction |
|---|---|---|---|
| reference-returning.png | image-gen-1(8).png;2026-09-02;libfile_aac3b099a6e081918b91bd004007b038 | Asymmetric welcome/continuation/Hatch composition; cream/forest/amber geometric field; practice and reading modules | Compact hero; four main destinations; fewer metrics and competing cards |
| reference-discovery.png | image-gen-2(7).png;2026-09-02;libfile_6ee0fed96aac819181571167a4c8eb88 | Geometric depth and layered greeting; clear discovery entry | No giant mascot, inflated framework panel, fabricated XP or counts |
| reference-hatch.png | image-gen-3(7).png;2026-09-02;libfile_b9c6a8c3c5a881918564791792729f57 | Persistent contextual conversation and contextual next actions | Earlier inline expansion is superseded by owner's floating-chat instruction |
| Uploaded Next.js bundle + IMPLEMENTATION_GUIDE.md | user attachments in this conversation | Responsive independently positioned planes; reusable announcement creative | Demo content/inline Hatch behavior are not production requirements |
| Reco reading reference | https://www.reco.ai/blog/anthropic-inference-hooks-reco | Editorial title/dek, readable text column, outline, generous rhythm | HackProduct palette/type; restrained movement around reading content |

July docs describing a practice gym and existing Stage B screenshots are historical evidence only.

## Four flagship compositions
- Home: compact welcome, dominant continuation, separate contextual Hatch surface, discipline navigation, selected reading, small progress evidence. Rich geometry stays behind content.
- Practice: clear title, search, discipline/difficulty filters only when useful; actual task-oriented cards; visible open/resume action. No redundant approach taxonomy or invented catalog totals.
- Workspace: problem/brief beside spacious answer surface; notes/resources secondary; explicit submit and feedback; responsive Brief/Your work switching. Geometry reduced to a margin/header accent.
- Reader: title/dek and metadata, generous editorial composition, main column about65ch, desktop outline/mobile contents, visible save/resume, contextual Hatch question. No perpetual movement.

## Shared type, shape and motion
Literata headings400–600; Nunito Sans body400–700. Main body16px+, secondary labels14px, metadata12px minimum. Cream #f8f5ef; ink/forest #103e30; amber #d8962c; sage #b8c3aa. Thin warm borders, restrained12–18px corners, stronger depth only on key compositions. Define these once within the review system before integration.

Entrance: independent background planes400–700ms, movement8–18px, short stagger; heading/content280–420ms. Controls usable immediately; animate opacity/transform only; no layout shifts, perpetual drift, scroll hijacking or repeated entrance during routine navigation. Motion replay is available only in the review controls. prefers-reduced-motion removes entrance/transforms; focus remains visible. Rich motion on Home/landing, minimal in reading/workspaces.

## Drift control
Allowed current edits: approved shared visual components and styling, real Home/Practice/workspace/reading integration, existing interaction bindings, focused regression tests and verification notes. Preserve auth, data and payment contracts. Excluded: analytics infrastructure, database migrations, billing/backend refactors, unrelated bug hunts, dependency upgrades and wholesale component pruning. Record newly noticed defects separately; change scope only with owner direction or a blocker to this integration stage.

## Acceptance evidence
Each review lists reference, composition changes, responsive comparison evidence at three widths and representative screenshots, tested interactions and limitations. No claims of exact mockup replication, authenticated functionality or production deployment without that evidence. First milestone ends at a concrete review package; broad integration follows visual review as agreed.
