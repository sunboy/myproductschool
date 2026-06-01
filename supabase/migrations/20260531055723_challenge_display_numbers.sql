-- Per-type challenge catalog numbers (display_number).
--
-- Adds a stable, human-readable number scoped to each challenge_type, banded in
-- thousands ranges so the number is globally unique and self-describing once
-- prefixed in the app (ALGO-1xxx, SQL-2xxx, PS-3xxx, QT-5xxx, SD-6xxx, DM-7xxx,
-- CCA-8xxx). Band 4000 is reserved (formerly freeform); 9000 is the sentinel for
-- any unknown/future type until it earns its own band.
--
-- Numbers are assigned to ALL rows (published or not) so they never shift.
-- Review before applying.

BEGIN;

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS display_number INTEGER;

-- Single source of truth for band offsets, shared by the backfill and the trigger.
CREATE OR REPLACE FUNCTION challenge_band_offset(p_type TEXT)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_type
    WHEN 'algorithm'             THEN 1000
    WHEN 'sql'                   THEN 2000
    WHEN 'flow'                  THEN 3000
    WHEN 'freeform'              THEN 4000  -- reserved; rows are being converted to 'flow'
    WHEN 'quick_take'            THEN 5000
    WHEN 'system_design'         THEN 6000
    WHEN 'data_modeling'         THEN 7000
    WHEN 'claude_code_analytics' THEN 8000
    ELSE 9000
  END;
$$;

-- Backfill: per-type sequential by created_at; id breaks ties deterministically.
WITH numbered AS (
  SELECT
    id,
    challenge_band_offset(challenge_type)
      + ROW_NUMBER() OVER (
          PARTITION BY challenge_type
          ORDER BY created_at ASC, id ASC
        ) AS n
  FROM challenges
)
UPDATE challenges c
SET display_number = numbered.n
FROM numbered
WHERE numbered.id = c.id;

-- BEFORE INSERT trigger: assign the next in-band number for the row's type.
-- MAX-based (no sequence objects) so it auto-extends to new types; the per-type
-- advisory lock removes the MAX+1 race for concurrent same-type inserts.
CREATE OR REPLACE FUNCTION assign_challenge_display_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_offset INTEGER := challenge_band_offset(NEW.challenge_type);
  v_max    INTEGER;
BEGIN
  IF NEW.display_number IS NOT NULL THEN
    RETURN NEW;  -- explicit value (data import) wins
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('challenge_dn_' || NEW.challenge_type));
  SELECT MAX(display_number) INTO v_max
  FROM challenges
  WHERE challenge_type = NEW.challenge_type;
  NEW.display_number := COALESCE(v_max, v_offset) + 1;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS challenges_assign_display_number ON challenges;
CREATE TRIGGER challenges_assign_display_number
  BEFORE INSERT ON challenges
  FOR EACH ROW EXECUTE FUNCTION assign_challenge_display_number();

ALTER TABLE challenges ALTER COLUMN display_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS challenges_type_display_number_uq
  ON challenges (challenge_type, display_number);

COMMIT;
