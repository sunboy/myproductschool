# PWA Manifest Audit

Last updated: May 6, 2026

This is a static repo, local production route, and local browser installability audit.

## Evidence

- `src/app/layout.tsx` links `metadata.manifest` to `/manifest.json`.
- Local production smoke confirmed `/manifest.json` responds without the app auth redirect.
- `public/manifest.json` parses as valid JSON.
- Required manifest fields are present: `name`, `short_name`, `start_url`, `display`, and `icons`.
- Referenced manifest icon files exist: `public/brand/favicon-192.png` and `public/brand/favicon-512.png`.
- `public/brand/favicon-192.png` is a 192 x 192 PNG.
- `public/brand/favicon-512.png` is a 512 x 512 PNG.
- Local Chromium CDP browser probe against `RATE_LIMIT_MEMORY_FALLBACK=true npx next start -p 3014` returned `installabilityErrors: []` from `Page.getInstallabilityErrors`.
- The same browser probe confirmed the page links `http://localhost:3014/manifest.json`, the manifest responds `200`, `display` is `standalone`, `start_url` is `/`, and the manifest includes 192px, 512px, and maskable 512px PNG icon entries.

## Gaps

- Production-domain installability is not verified because the live domain still serves an older waitlist deployment.
- A Lighthouse PWA score was not recorded.

## Launch Decision

Local PWA installability passes in Chromium against the current production build. Production PWA sign-off remains blocked until the deployed domain serves the current app and the same browser check is repeated there.
