# Approved design integration

Owner approved the September visual review and authorized stage 4.

## Implemented in real routes
- Dashboard: asymmetric welcome, compact real resume/recommendation card, adjacent personalized Hatch suggestions. Existing loaders, study plans, quick questions, progress and interview continuation remain.
- Practice: approved geometric heading and readable challenge cards in the existing paginated catalog; grid/list, filters, discussion links, task summaries and real status remain. In-progress cards preserve resume intent and the catalog return URL. Limits still apply at the existing session boundary; reading a brief remains available.
- Feature-autopsy reader: editorial split hero, restrained abstract cover, desktop outline/mobile contents, real bookmark persistence and contextual Hatch action. Real sections, sources, evidence and reading resume remain.
- Workspace: approved surfaces and readable brief hierarchy; explicit mobile Brief/Your work controls added to the existing drawer. API loading, answers, save/submit, code execution, canvas, billing and feedback contracts are untouched.

## Not yet complete
- Screenshot follow-up: chapter prose now uses the shared sanitized GFM/math renderer rather than regex-generated HTML. Code blocks and tables have contained horizontal scrolling, code-block pills are reset, and chapter heading weights/body sizing are normalized. Shared workspace/solution math support is wired too.
- Standard challenge phone layout now opens the full-height brief and switches to the still-mounted answer instead of stacking a 55vh drawer over it. Mobile Solutions is also reachable. This is not completion of the desktop/code/canvas/analytics workspace redesign.
- This is the first integration slice, not launch-ready completion of the entire website.
- Legacy autopsy formats still need the same editorial treatment.
- Workspace-specific design needs authenticated visual QA, including code/canvas and analytics. Existing phone restrictions for complex editors have not been removed or claimed solved.
- Remaining stage 5 pages and authenticated end-to-end launch checks are pending.

## Verification
- TypeScript passed after implementation.
- Focused component and service-contract regression run: 26 tests passed, covering dashboard actions, Hatch prompts, catalog navigation/labels, bookmark errors/authentication and workspace attempts.
- Preview deployment is READY: myproductschool-cehhp38n4-sunboy2s-projects.vercel.app, commit 3272df66. Production build passed.
- Browser opening the actual dashboard redirects to login with its return destination retained. The browser is signed out; real-route visual QA and authenticated saves/submissions remain BLOCKED pending authenticated testing access. The prior prototype width checks are not being claimed as validation of these integrated routes.
- No production promotion, schema, security-header or infrastructure changes were made. The screenshot follow-up adds only the math-rendering dependencies required for the formatter fix.
