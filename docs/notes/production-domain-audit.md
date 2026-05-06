# Production Domain Audit

Last updated: May 6, 2026

This is a read-only live check of `https://hackproduct.com`, public launch pages, `/manifest.json`, and `/api/health`.

## Routing

- `https://hackproduct.com/` resolves to `https://www.hackproduct.com/` with `200`.
- `https://hackproduct.com/waitlist` resolves to `https://www.hackproduct.com/waitlist` with `200`.
- `/privacy`, `/terms`, `/help`, and `/changelog` currently resolve to the login page rather than the public legal/help/changelog pages from the current app.
- `/api/health` returns `404`.
- `/manifest.json` resolves to login HTML rather than JSON, so production PWA validation fails.
- The live domain appears to be an older mixed deployment, not the current launch-ready local app.

## Vercel State

- Linked Vercel project: `myproductschool` (`prj_BnLtw2GgCcCyCnMciQ3Ps1Wezkff`).
- Vercel production deployment at audit time: `dpl_AWzq77zMCsSFvpot7ZY1FZCEhQik`, target `production`, Git ref `main`, commit `da0370e8e5cc2c4799f461ec8a5059a43fcbc605`.
- Latest ready Vercel deployment at audit time: `dpl_5CdRx9DAauKzie4Y52GiLcMy6451`, target `null`, Git ref `dev`, commit `21f0ba7cc2415074432da9d2d200301506e0d70d`.
- Local `dev` contains unpublished launch-readiness commits beyond the Vercel Git-backed deployments.
- Conclusion: neither the production deployment nor the newest ready preview reflects this local launch-readiness work. A fresh push or explicit Vercel deployment is required before production-like verification can be meaningful.

## Content Mismatch

The live root page still contains legacy "Luma" coach copy. The live waitlist page still contains waitlist copy. Both conflict with the current launch-ready local app state, so production should not be treated as launch-signed-off.

## Headers

`https://www.hackproduct.com/` returned:

- `strict-transport-security: max-age=63072000`
- `x-content-type-options: nosniff`
- `x-frame-options: DENY`
- `referrer-policy: strict-origin-when-cross-origin`
- `permissions-policy: camera=(), microphone=(self), geolocation=()`
- no `x-powered-by`

Missing on the live root response:

- `content-security-policy`

## Launch Decision

Production deployment/domain routing is a blocker. Deploy the current app and recheck:

- `LAUNCH_PREFLIGHT_URL=https://hackproduct.com npm run launch:preflight`
- `/dashboard` visual parity after login
- `/privacy`, `/terms`, `/pricing`, `/help`, `/changelog`
- security headers, especially CSP
- no legacy Luma/provider/internal copy
- `/api/health`
- `/manifest.json`
