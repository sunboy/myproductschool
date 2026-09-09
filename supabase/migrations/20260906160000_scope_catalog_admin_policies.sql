-- Published challenges and domains have separate public SELECT policies.
-- Keep anonymous reads away from the admin policy branches, which consult
-- profiles and ultimately call the authenticated-only is_admin() helper.

ALTER POLICY challenges_admin
  ON public.challenges
  TO authenticated;

ALTER POLICY "Admins can manage domains"
  ON public.domains
  TO authenticated;
