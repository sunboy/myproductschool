-- Migration 085: AI voice violation audit log
-- Records sanitizer replacements so admins can inspect prompt/output quality issues.

CREATE TABLE IF NOT EXISTS ai_voice_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  route TEXT NOT NULL,
  model TEXT NOT NULL,
  rule TEXT NOT NULL CHECK (rule IN ('em_dash', 'identity_leak', 'role_framing', 'slop')),
  needle TEXT NOT NULL,
  replacement TEXT NOT NULL DEFAULT '',
  context_excerpt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_voice_violations_created_at_idx
  ON ai_voice_violations(created_at DESC);

CREATE INDEX IF NOT EXISTS ai_voice_violations_rule_route_idx
  ON ai_voice_violations(rule, route);

CREATE INDEX IF NOT EXISTS ai_voice_violations_user_created_idx
  ON ai_voice_violations(user_id, created_at DESC);

ALTER TABLE ai_voice_violations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_voice_violations'
      AND policyname = 'Admins can read AI voice violations'
  ) THEN
    CREATE POLICY "Admins can read AI voice violations"
      ON ai_voice_violations
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM profiles
          WHERE profiles.id = (SELECT auth.uid())
            AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

COMMENT ON TABLE ai_voice_violations IS 'Audit log for AI output sanitizer replacements and stripped voice-rule violations.';
COMMENT ON COLUMN ai_voice_violations.rule IS 'Sanitizer rule that fired: em_dash, identity_leak, role_framing, or slop.';
COMMENT ON COLUMN ai_voice_violations.needle IS 'Original model-output text that matched a sanitizer rule.';
COMMENT ON COLUMN ai_voice_violations.replacement IS 'Replacement text applied by the sanitizer. Empty means the matched text was stripped.';
