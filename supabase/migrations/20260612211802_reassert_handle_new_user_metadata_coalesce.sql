-- Re-assert the canonical handle_new_user. Migration 20260519001000
-- (v2_schema_extensions) regressed the repo definition to read only
-- raw_user_meta_data->>'full_name', dropping email-signup display_name,
-- Google's name fallback, and the Google avatar picture (all added by 034).
-- The live DB still has the good version; this migration pins it so a
-- rebuild from migration files can't resurrect the regression.
--
-- Applied to the live DB on 2026-06-12 via MCP; this file mirrors that
-- migration so repo and live histories stay aligned.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    new.raw_user_meta_data->>'picture'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (new.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO move_levels (user_id, move, level, progress_pct, xp)
  VALUES
    (new.id, 'frame',    1, 0, 0),
    (new.id, 'list',     1, 0, 0),
    (new.id, 'optimize', 1, 0, 0),
    (new.id, 'win',      1, 0, 0)
  ON CONFLICT (user_id, move) DO NOTHING;

  INSERT INTO user_settings (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user error: % %', SQLERRM, SQLSTATE;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.handle_new_user() SET search_path = public, extensions, auth;
