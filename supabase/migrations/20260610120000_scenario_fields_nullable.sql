-- Per docs/CHALLENGE_DESCRIPTION_SPEC.md, scenario_trigger and scenario_question are
-- optional: canvas (system_design/data_modeling) and sql challenges set them to NULL and
-- the presentation layer (buildChallengeBrief) supplies type-appropriate defaults.
-- Previously NOT NULL, which forced commit-interview-seeds.ts to write boilerplate
-- ("You have 30 minutes." / "Design your solution on the canvas...") that leaked into
-- card summaries and Hatch context.

ALTER TABLE challenges ALTER COLUMN scenario_trigger DROP NOT NULL;
ALTER TABLE challenges ALTER COLUMN scenario_question DROP NOT NULL;
