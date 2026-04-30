-- Allow 'sql' and 'algorithm' as discipline values in loop_rounds
-- Previously only 'coding' was allowed for coding challenges

ALTER TABLE loop_rounds DROP CONSTRAINT IF EXISTS loop_rounds_discipline_check;
ALTER TABLE loop_rounds ADD CONSTRAINT loop_rounds_discipline_check
  CHECK (discipline IN ('product_sense', 'system_design', 'data_modeling', 'sql', 'algorithm'));
