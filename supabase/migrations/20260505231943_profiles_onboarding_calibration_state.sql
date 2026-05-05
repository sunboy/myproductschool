ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS calibration_scores JSONB,
  ADD COLUMN IF NOT EXISTS weakness_move TEXT;

ALTER TABLE public.profiles
  ALTER COLUMN calibration_scores SET DEFAULT '{}'::jsonb;

UPDATE public.profiles
SET calibration_scores = '{}'::jsonb
WHERE calibration_scores IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN calibration_scores SET NOT NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_preferred_role_check,
  DROP CONSTRAINT IF EXISTS profiles_weakness_move_check;

UPDATE public.profiles
SET preferred_role = CASE preferred_role
  WHEN 'SWE' THEN 'swe'
  WHEN 'Data Eng' THEN 'data_eng'
  WHEN 'ML Eng' THEN 'ml_eng'
  WHEN 'DevOps' THEN 'devops'
  WHEN 'EM' THEN 'em'
  WHEN 'Founding Eng' THEN 'founding_eng'
  ELSE preferred_role
END
WHERE preferred_role IN ('SWE', 'Data Eng', 'ML Eng', 'DevOps', 'EM', 'Founding Eng');

UPDATE public.profiles
SET preferred_role = NULL
WHERE preferred_role IS NOT NULL
  AND preferred_role NOT IN (
    'swe',
    'data_eng',
    'ml_eng',
    'devops',
    'em',
    'founding_eng',
    'tech_lead',
    'pm',
    'designer',
    'data_scientist'
  );

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_preferred_role_check
    CHECK (
      preferred_role IS NULL
      OR preferred_role IN (
        'swe',
        'data_eng',
        'ml_eng',
        'devops',
        'em',
        'founding_eng',
        'tech_lead',
        'pm',
        'designer',
        'data_scientist'
      )
    ),
  ADD CONSTRAINT profiles_weakness_move_check
    CHECK (
      weakness_move IS NULL
      OR weakness_move IN ('frame', 'list', 'optimize', 'win')
    );

CREATE INDEX IF NOT EXISTS idx_profiles_weakness_move
  ON public.profiles(weakness_move);

CREATE INDEX IF NOT EXISTS idx_profiles_calibration_scores_gin
  ON public.profiles USING GIN (calibration_scores);
