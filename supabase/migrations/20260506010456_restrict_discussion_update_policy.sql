-- Upvotes, edits, and deletes now go through server routes.
-- Do not allow broad direct table updates from exposed API roles.
DROP POLICY IF EXISTS "Users can upvote discussions" ON public.challenge_discussions;
