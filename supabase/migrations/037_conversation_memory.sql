-- Add conversation memory column for in-session Luma references
-- Stores salient candidate claims, contradictions, strong moments, and deflected questions
-- Capped at ~12 items by the application layer
ALTER TABLE live_interview_sessions
  ADD COLUMN IF NOT EXISTS conversation_memory JSONB DEFAULT '[]'::jsonb;
