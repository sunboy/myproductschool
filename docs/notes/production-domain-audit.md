# Production Domain Audit

Last updated: May 6, 2026

This is a read-only live check of `https://hackproduct.com` and `https://www.hackproduct.com/waitlist`.

## Routing

- `https://hackproduct.com` returns `307` to `https://www.hackproduct.com/`.
- Browser fetch of `https://hackproduct.com/` resolves to `https://www.hackproduct.com/waitlist`.
- The live page appears to be an older waitlist build, not the current launch-ready local app.

## Vercel State

- Linked Vercel project: `myproductschool` (`prj_BnLtw2GgCcCyCnMciQ3Ps1Wezkff`).
- Vercel production deployment at audit time: `dpl_AWzq77zMCsSFvpot7ZY1FZCEhQik`, target `production`, Git ref `main`, commit `da0370e8e5cc2c4799f461ec8a5059a43fcbc605`.
- Latest ready Vercel deployment at audit time: `dpl_5CdRx9DAauKzie4Y52GiLcMy6451`, target `null`, Git ref `dev`, commit `21f0ba7cc2415074432da9d2d200301506e0d70d`.
- Current local `dev` HEAD at audit time: `d5882690c2e6228122bf2155ceb89d7ba04c19e7`.
- Conclusion: neither the production deployment nor the newest ready preview reflects the current local launch-readiness commits.

## Content Mismatch

The live waitlist page still contains legacy "Luma" coach copy. That conflicts with the current Hatch identity work and means production should not be treated as launch-signed-off.

## Headers

`https://www.hackproduct.com/waitlist` returned:

- `strict-transport-security: max-age=63072000`
- `x-content-type-options: nosniff`
- `x-frame-options: DENY`
- `referrer-policy: strict-origin-when-cross-origin`
- `permissions-policy: camera=(), microphone=(self), geolocation=()`
- no `x-powered-by`

Missing on the live waitlist response:

- `content-security-policy`

## Launch Decision

Production deployment/domain routing is a blocker. Deploy the current app and recheck:

- `/dashboard` visual parity after login
- `/privacy`, `/terms`, `/pricing`, `/help`, `/changelog`
- security headers, especially CSP
- no legacy Luma/provider/internal copy
