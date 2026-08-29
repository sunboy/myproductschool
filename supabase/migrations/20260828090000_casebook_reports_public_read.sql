-- Casebook Loop Phase 5 — public-read policy for shared reports.
--
-- Phase 0 created cc_reports with owner-only policies and left a note that the
-- public-read policy "arrives later with the share route
-- (GET /api/casebook/reports/[slug]) — deliberately NOT added in this
-- migration". That share route is Phase 5, so the policy lands here. This is
-- deferred-on-purpose work from the original design, not new scope.
--
-- WHY A POLICY AND NOT A SERVICE-ROLE READ: the share page must render for a
-- LOGGED-OUT visitor. Serving it through the service role would work, but it
-- would put the bypass-everything key on a public, unauthenticated path where a
-- single query-shape mistake exposes every row in the table. A narrow RLS
-- policy fails closed instead: anon can read exactly the rows the author chose
-- to publish, and nothing else, no matter what the route asks for.
--
-- SCOPE OF THE GRANT (deliberately narrow):
--   - SELECT only. No insert/update/delete for anon.
--   - Only rows with is_public = true. An author un-publishing a report
--     (is_public -> false) revokes anon access immediately, with no code change
--     and no cache to bust.
--   - The three owner-only policies from Phase 0 are UNTOUCHED. Postgres
--     combines permissive policies with OR, so an owner keeps full access to
--     their own private rows and this only ADDS the public case.
--
-- WHAT IS EXPOSED: cc_reports.snapshot is a FROZEN copy of the report content,
-- written once at share time. The share route renders from the snapshot and
-- never re-reads cc_case_attempts, so making a snapshot readable cannot leak
-- anything the attempt row later accumulates.
--
-- CORRECTED 2026-08-28. An earlier version of this comment claimed the table
-- "carries no rubric, no answer key". That was an OVERCLAIM: it is not a
-- property of the table, it is contingent on every writer building `snapshot`
-- through the field allowlist in src/lib/casebook/public-report-projection.ts
-- (toPublicReportPayload).
--
-- The trap is concrete, not hypothetical. cc_case_attempts.report.narrative_md
-- contains a "## Moves you missed" section listing expert move labels (see
-- src/lib/casebook/report-narrative.ts). Copying `report` into `snapshot`
-- verbatim would publish the case's answer key to anyone holding a slug,
-- permanently and possibly search-indexed.
--
-- So: any writer of this table MUST use the projection module. Never spread a
-- cc_case_attempts row into snapshot, never select('*') into it. A future
-- column would otherwise join the public payload with no diff to review.
--
-- user_id is a column on this table and IS readable by anon under this policy.
-- That is an opaque uuid, already the pattern used by other public share
-- surfaces in this repo, and it is required for the row to be useful at all.
--
-- Purely additive: adds one SELECT policy. No table, column, constraint or
-- existing-policy changes.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cc_reports' AND policyname = 'Anyone can read public cc_reports'
  ) THEN
    CREATE POLICY "Anyone can read public cc_reports"
      ON cc_reports FOR SELECT
      USING (is_public = true);
  END IF;
END $$;
