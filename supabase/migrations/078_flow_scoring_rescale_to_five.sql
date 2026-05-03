-- 078_flow_scoring_rescale_to_five.sql
--
-- Rescale FLOW scoring from two incompatible scales (challenges 0–3,
-- interviews 0–100) to a single shared 0–5 scale across both pipelines.
--
-- Multipliers:
--   challenges 0–3 → 0–5   : value * (5/3)
--   interviews 0–100 → 0–5 : value / 20
--
-- Reversible: down-migration multiplies by inverse (3/5 for challenges, 20 for interviews).

BEGIN;

-- ── Challenge attempts: per-attempt totals ──────────────────────────────────
UPDATE challenge_attempts
SET total_score = ROUND((total_score * 5.0 / 3.0)::numeric, 2),
    max_score = 5.0
WHERE max_score IS NOT NULL AND max_score > 0;

-- ── Challenge attempts: feedback_json.step_breakdown[].score and .max_score ──
UPDATE challenge_attempts
SET feedback_json = jsonb_set(
  jsonb_set(
    feedback_json,
    '{step_breakdown}',
    (
      SELECT jsonb_agg(
        jsonb_set(
          jsonb_set(elem, '{score}', to_jsonb(ROUND((COALESCE((elem->>'score')::numeric, 0) * 5.0 / 3.0)::numeric, 2))),
          '{max_score}', to_jsonb(5.0)
        )
      )
      FROM jsonb_array_elements(feedback_json->'step_breakdown') elem
    )
  ),
  '{max_score}', to_jsonb(5.0)
)
WHERE feedback_json ? 'step_breakdown';

-- ── Challenge attempts: feedback_json.total_score (when present at top level) ──
UPDATE challenge_attempts
SET feedback_json = jsonb_set(
  feedback_json,
  '{total_score}',
  to_jsonb(ROUND((COALESCE((feedback_json->>'total_score')::numeric, 0) * 5.0 / 3.0)::numeric, 2))
)
WHERE feedback_json ? 'total_score';

-- ── Step attempts: per-question score ───────────────────────────────────────
UPDATE step_attempts
SET score = ROUND((score * 5.0 / 3.0)::numeric, 2)
WHERE score IS NOT NULL;

-- ── Live interview debriefs ─────────────────────────────────────────────────
UPDATE live_interview_sessions
SET debrief_json = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          debrief_json,
          '{overallScore}',
          to_jsonb(ROUND((COALESCE((debrief_json->>'overallScore')::numeric, 0) / 20.0)::numeric, 2))
        ),
        '{flowScores,frame}', to_jsonb(ROUND((COALESCE((debrief_json#>>'{flowScores,frame}')::numeric, 0) / 20.0)::numeric, 2))
      ),
      '{flowScores,list}', to_jsonb(ROUND((COALESCE((debrief_json#>>'{flowScores,list}')::numeric, 0) / 20.0)::numeric, 2))
    ),
    '{flowScores,optimize}', to_jsonb(ROUND((COALESCE((debrief_json#>>'{flowScores,optimize}')::numeric, 0) / 20.0)::numeric, 2))
  ),
  '{flowScores,win}', to_jsonb(ROUND((COALESCE((debrief_json#>>'{flowScores,win}')::numeric, 0) / 20.0)::numeric, 2))
)
WHERE debrief_json IS NOT NULL AND debrief_json ? 'overallScore';

-- ── Loop rounds: round_debrief_json mirrors debrief_json shape ──────────────
UPDATE loop_rounds
SET round_debrief_json = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          round_debrief_json,
          '{overallScore}',
          to_jsonb(ROUND((COALESCE((round_debrief_json->>'overallScore')::numeric, 0) / 20.0)::numeric, 2))
        ),
        '{flowScores,frame}', to_jsonb(ROUND((COALESCE((round_debrief_json#>>'{flowScores,frame}')::numeric, 0) / 20.0)::numeric, 2))
      ),
      '{flowScores,list}', to_jsonb(ROUND((COALESCE((round_debrief_json#>>'{flowScores,list}')::numeric, 0) / 20.0)::numeric, 2))
    ),
    '{flowScores,optimize}', to_jsonb(ROUND((COALESCE((round_debrief_json#>>'{flowScores,optimize}')::numeric, 0) / 20.0)::numeric, 2))
  ),
  '{flowScores,win}', to_jsonb(ROUND((COALESCE((round_debrief_json#>>'{flowScores,win}')::numeric, 0) / 20.0)::numeric, 2))
)
WHERE round_debrief_json IS NOT NULL AND round_debrief_json ? 'overallScore';

-- ── Loop rounds: round_score column was INTEGER 0–100; widen + rescale ──────
ALTER TABLE loop_rounds
  ALTER COLUMN round_score TYPE NUMERIC(4,2)
  USING CASE WHEN round_score IS NULL THEN NULL ELSE round_score / 20.0 END;

COMMIT;
