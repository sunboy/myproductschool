-- Fix handle_new_user to read display_name (email signup), name (Google OAuth),
-- and picture (Google avatar) from raw_user_meta_data
CREATE OR REPLACE FUNCTION handle_new_user()
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

  PERFORM initialize_move_levels(new.id);
  PERFORM initialize_user_settings(new.id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
