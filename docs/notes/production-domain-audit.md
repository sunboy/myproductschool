# Production Domain Audit

Last updated: May 6, 2026

This is a read-only live check of `https://hackproduct.com` and `https://www.hackproduct.com/waitlist`.

## Routing

- `https://hackproduct.com` returns `307` to `https://www.hackproduct.com/`.
- Browser fetch of `https://hackproduct.com/` resolves to `https://www.hackproduct.com/waitlist`.
- The live page appears to be an older waitlist build, not the current launch-ready local app.

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
