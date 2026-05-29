ALTER TABLE public.nudge_usage
  ADD COLUMN IF NOT EXISTS nudge_sequence INTEGER;

WITH numbered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, attempt_id
      ORDER BY created_at ASC, id ASC
    ) AS sequence
  FROM public.nudge_usage
  WHERE nudge_sequence IS NULL
)
UPDATE public.nudge_usage
SET nudge_sequence = numbered.sequence
FROM numbered
WHERE nudge_usage.id = numbered.id;

ALTER TABLE public.nudge_usage
  ALTER COLUMN nudge_sequence SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'nudge_usage_sequence_positive'
  ) THEN
    ALTER TABLE public.nudge_usage
      ADD CONSTRAINT nudge_usage_sequence_positive
      CHECK (nudge_sequence > 0);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS nudge_usage_attempt_sequence_unique
  ON public.nudge_usage(user_id, attempt_id, nudge_sequence)
  WHERE attempt_id IS NOT NULL;
