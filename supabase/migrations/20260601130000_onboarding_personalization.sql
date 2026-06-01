-- Onboarding personalization columns on profiles.
--
-- primary_goal:   what the user wants to achieve (drives dashboard difficulty
--                 biasing, study-plan recommendation, and Hatch coaching tone).
-- prep_timeline:  urgency signal (drives sprint framing, countdown card, Hatch
--                 context). Target company is stored inside interview_meta jsonb
--                 as interview_meta->>'target_company' — no separate column needed.
--
-- Both columns are nullable (set during the new onboarding modal flow).
-- CHECK constraints enumerate the exact values accepted by the UI.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS primary_goal text
    CHECK (primary_goal IS NULL OR primary_goal IN (
      'land_pm_adjacent',
      'level_up_current',
      'ship_better',
      'explore'
    )),
  ADD COLUMN IF NOT EXISTS prep_timeline text
    CHECK (prep_timeline IS NULL OR prep_timeline IN (
      'lt_1mo',
      '1_3mo',
      'gt_3mo',
      'no_timeline'
    ));
