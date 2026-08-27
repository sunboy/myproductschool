-- =============================================================================
-- Casebook Loop — "The Tuesday Dip"
-- Dataset: module_tuesday_dip (BigQuery project: hackproduct)
--
-- STORY
-- Signup completion volume dips on Tuesdays. The obvious explanation is the
-- checkout-form code deploy that shipped on Tuesday 2026-07-14 — it "lines
-- up" with the dip. That explanation is WRONG: the deploy touched checkout,
-- not signup, and the dip appears on every Tuesday in the window, including
-- three Tuesdays with no code deploy at all. The real cause is a recurring
-- weekly ops maintenance window (every Tuesday 02:00-06:00 UTC) that pauses
-- the push/email re-engagement sender, which is where a large share of
-- Tuesday's signups would otherwise have come from.
--
-- Fixed window: 2026-06-29 (Monday) through 2026-07-26 (Sunday), 4 full
-- weeks. ALL dates in this schema and its fixture data are absolute literals.
-- Do NOT introduce CURRENT_DATE(), CURRENT_TIMESTAMP(), date('now'), or any
-- other relative-to-today expression anywhere in this file or in queries
-- written against it — this case is inherently time-shaped ("Tuesday"),
-- which makes it exactly the kind of content that turns into a time bomb.
--
-- THREE DESIGNED TRAPS (see inline comments at each table/view for detail):
--   1. Fan-out grain trap      — `payment_attempts` is 1:many against
--                                 `events`; a naive join + COUNT(*) overcounts.
--   2. NULL cluster trap       — `users.acquisition_channel` is NULL for
--                                 ~92% of the `referral` channel; a naive
--                                 GROUP BY or NOT NULL filter silently
--                                 erases that segment.
--   3. Deploy-correlated trap  — `deploys` holds both the one-off code
--                                 deploy (red herring) and the recurring
--                                 maintenance windows (the real cause), so
--                                 the trap is discoverable by anyone who
--                                 checks whether the pattern holds on
--                                 deploy-free Tuesdays too.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- events — one row per signup_completed event (the ground-truth funnel log).
-- `channel` here is the TRUE acquisition channel at the moment of signup, as
-- captured by the event pipeline. Compare against users.acquisition_channel,
-- which is captured by a separate (buggier) attribution tagging step — see
-- the NULL cluster trap below.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  event_id    STRING,     -- unique per signup event, e.g. e_000123
  user_id     STRING,     -- FK -> users.user_id
  session_id  STRING,
  ts          TIMESTAMP,  -- UTC, absolute (2026-06-29 .. 2026-07-26)
  event_name  STRING,     -- always 'signup_completed' in this fixture
  device      STRING,     -- ios | android | web
  channel     STRING      -- organic | paid_search | push | email | referral (ground truth, never NULL)
);

-- -----------------------------------------------------------------------------
-- users — one row per signed-up user.
--
-- TRAP 2 — NULL CLUSTER: `acquisition_channel` is populated by a separate
-- attribution-tagging step that has a known bug on the referral landing
-- page. In this fixture, ~92% of `referral`-channel signups (per the
-- ground-truth events.channel) land with acquisition_channel = NULL, versus
-- a ~1.6-2.5% baseline NULL rate for every other channel. Any query that
-- does `WHERE acquisition_channel IS NOT NULL`, or that GROUPs BY
-- acquisition_channel (which silently drops NULL groups in most BI tools),
-- will make the referral channel look nearly nonexistent and will
-- systematically undercount referral-driven Tuesday volume. Ground truth
-- for channel attribution should come from events.channel, not this column,
-- when the two disagree.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id             STRING,   -- PK, matches events.user_id
  signup_date         DATE,     -- absolute date, matches events.ts date
  acquisition_channel STRING,   -- NULLABLE — see TRAP 2 above. NULL for ~92% of referral signups.
  region              STRING    -- us | eu | in
);

-- -----------------------------------------------------------------------------
-- payment_attempts — one row per payment/card-verification attempt tied to
-- a signup event.
--
-- TRAP 1 — FAN-OUT GRAIN: this table is 1:MANY against `events`. Most
-- signups have exactly one payment_attempts row, but iOS users hit a known
-- SDK bug that caused retried card-verification calls (2-4 attempts per
-- event) concentrated in the LAST TWO WEEKS of the window (2026-07-13
-- onward), unrelated to the Tuesday story. A naive
--   SELECT COUNT(*) FROM events JOIN payment_attempts USING (event_id)
-- overcounts "conversions" — in this fixture it produces MORE
-- payment_attempts rows (4,459) than events (3,477), i.e. a nonsensical
-- >100% "conversion rate" if COUNT(*) is mistaken for COUNT(DISTINCT
-- event_id). The correct grain-preserving query counts DISTINCT event_id
-- (or user_id) after the join, or aggregates payment_attempts to one row
-- per event_id (e.g. did-any-attempt-succeed) before joining.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_attempts (
  attempt_id    STRING,     -- PK
  event_id      STRING,     -- FK -> events.event_id (1:many — see TRAP 1 above)
  user_id       STRING,     -- FK -> users.user_id
  ts            TIMESTAMP,  -- absolute, >= the parent event's ts
  status        STRING,     -- succeeded | failed
  amount_cents  INT64
);

-- -----------------------------------------------------------------------------
-- deploys — reference table of engineering deploys AND recurring ops
-- maintenance windows, both dated with absolute literals.
--
-- TRAP 3 — DEPLOY-CORRELATED SHIFT: there is exactly one `code_deploy` row
-- (2026-07-14, a Tuesday — the checkout-form rework, which only touches
-- /checkout, not /signup) and it coincides with the dip, inviting the wrong
-- "the deploy caused it" conclusion. The `maintenance_window` rows are the
-- real, recurring cause: EVERY Tuesday in the window (2026-06-30, 07-07,
-- 07-14, 07-21) has a maintenance_window row for a scheduled DB vacuum that
-- pauses the push/email re-engagement sender for 4 hours. The dip is
-- present on all four Tuesdays, including the three that have NO
-- code_deploy row — which falsifies the "the deploy caused it" story and
-- points at the maintenance_window pattern instead.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deploys (
  deploy_id    STRING,   -- PK
  deploy_date  DATE,     -- absolute date
  deploy_type  STRING,   -- code_deploy | maintenance_window
  service      STRING,
  description  STRING
);

-- =============================================================================
-- Derived views — the "careful" queries a diligent analyst should end up
-- writing after tripping each trap once. Not required reading to solve the
-- case, but useful as an answer key / grader reference.
-- =============================================================================

-- Daily signup volume, correctly grained off `events` (not the fan-out
-- payment_attempts table), by day-of-week bucket.
CREATE OR REPLACE VIEW daily_signups AS
SELECT
  DATE(ts)                                   AS signup_date,
  EXTRACT(DAYOFWEEK FROM DATE(ts))            AS day_of_week,   -- BigQuery: 1=Sun .. 3=Tue .. 7=Sat
  COUNT(DISTINCT event_id)                    AS signups
FROM events
GROUP BY signup_date, day_of_week;

-- Careful per-channel daily volume using the ground-truth events.channel
-- (avoids the NULL-cluster undercount described in TRAP 2).
CREATE OR REPLACE VIEW daily_signups_by_channel AS
SELECT
  DATE(ts)  AS signup_date,
  channel,
  COUNT(DISTINCT event_id) AS signups
FROM events
GROUP BY signup_date, channel;

-- Careful conversion-attempt view: one row per event_id, collapsing the
-- payment_attempts fan-out (TRAP 1) to "did this signup ever have a
-- successful payment attempt" instead of counting raw attempt rows.
CREATE OR REPLACE VIEW signup_payment_outcomes AS
SELECT
  e.event_id,
  e.user_id,
  DATE(e.ts) AS signup_date,
  e.device,
  COUNT(pa.attempt_id)                                        AS attempt_count,
  MAX(CASE WHEN pa.status = 'succeeded' THEN 1 ELSE 0 END) = 1 AS ever_succeeded
FROM events e
LEFT JOIN payment_attempts pa ON pa.event_id = e.event_id
GROUP BY e.event_id, e.user_id, signup_date, e.device;

-- Tuesday-vs-rest comparison joined against the deploy/maintenance reference
-- table, to make TRAP 3 (deploy-correlated shift) checkable directly: shows
-- that the dip recurs on Tuesdays with no code_deploy row.
CREATE OR REPLACE VIEW tuesday_dip_vs_deploys AS
SELECT
  d.signup_date,
  d.signups,
  EXISTS (
    SELECT 1 FROM deploys dep
    WHERE dep.deploy_date = d.signup_date AND dep.deploy_type = 'code_deploy'
  ) AS had_code_deploy_that_day,
  EXISTS (
    SELECT 1 FROM deploys dep
    WHERE dep.deploy_date = d.signup_date AND dep.deploy_type = 'maintenance_window'
  ) AS had_maintenance_window_that_day
FROM daily_signups d
WHERE d.day_of_week = 3  -- BigQuery EXTRACT(DAYOFWEEK): Tuesday = 3
ORDER BY d.signup_date;
