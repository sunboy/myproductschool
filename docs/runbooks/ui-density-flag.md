# ui_density_v1 flag

What it gates: the shell-v2 sidebar and top bar, DashboardV4 (returning and new-user), the Library shelves, the Practice band and card mode, ModuleReaderV2 and AutopsyReaderV2, the Progress band, the Settings title row, the guided interview setup (`InterviewWizard`, URL-stepped) and three-column room, the `/welcome` onboarding page, and the dense landing hero. All of it is built on the design system in `src/design/` (see `docs/design/ui-language.md`); `npm run lint` and `tests/design/ui-language.test.ts` reject ad-hoc sizes and layout in those trees. Legacy components stay mounted and render when the flag is off.

Flip (takes effect within 60 seconds, no deploy; `getAppFlag` caches for 60s):

```sql
update app_flags set value = 'true'::jsonb,  updated_at = now() where key = 'ui_density_v1';
```

Revert:

```sql
update app_flags set value = 'false'::jsonb, updated_at = now() where key = 'ui_density_v1';
```

Dev and prod share the Supabase project, so the flag is global. Code that has not shipped ignores it, so the flag can be `true` while the branch is only deployed to a preview. Flip it only after the founder signs off on the preview, and flip it back before merging if a rollback path is wanted.

Data written by the new UI, harmless with the flag off:
- `profiles.ui_prefs` (`nav_collapsed`, `practice_view`) via `PATCH /api/profile`
- `reading_progress` rows via `PUT /api/reading-progress`
- `learn_chapters.hero_image_url` (nullable; GeoArt placeholder when null)

Verifying locally: run the production build, not the dev server. The dev server on an 8GB machine wedges under Playwright and produces false timeouts.

```bash
npm run build && npx next start -p 3002 &
set -a; source .env.local; set +a
for s in shell dashboard library-practice readers progress-settings-landing onboarding interviews; do
  PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test e2e/density/$s.spec.ts --workers=1
done
```

Removal (follow-up after sign-off): delete the legacy branches (AppShell/AppSidebar/AppTopShell/TopNav usages in `AppLayoutClient.tsx` and the `(workspace)` layout, the legacy dashboard tree, `LibraryCatalog`, the legacy Practice header, `TocRail`/`ReadingColumn`, the `CinematicReader` legacy layout, the `LearningPageHeading` heroes on Progress and Settings, the legacy interview header and room), keep Settings "Redo calibration" pointing at `/welcome?redo=1`, and remove the `getAppFlag('ui_density_v1')` reads.
