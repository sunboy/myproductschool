# Discussions Bugs And Smoke Test Notes

Audit date: 2026-05-05 local time, with the existing Next dev server on `localhost:3001`.

## Smoke Test Result

Requested flow:

- User A opens `/challenges/{id}/discussion`, posts a top-level comment, and confirms it renders.
- User B views the same challenge, replies, and upvotes.
- User A edits and deletes their own comment.
- User A attempts to delete User B's comment and receives `403`.
- Workspace Discussions tab shows the same data.

What could be executed safely:

- `GET /challenges/ch100000-0000-0000-0000-000000000001/discussion` returned `307` to `/login` without a session.
- `GET /api/challenges/ch100000-0000-0000-0000-000000000001/discussions` returned `200 []`.
- A read-only service-client check of `challenge_discussions` returned no seeded rows.
- `POST /api/challenges/ch100000-0000-0000-0000-000000000001/discussions` without an auth session returned `500` with `discussion_post_failed`.
- `POST /api/challenges/ch100000-0000-0000-0000-000000000001/discussions` with empty content returned the expected `400 invalid_request`.
- `PATCH /api/challenges/ch100000-0000-0000-0000-000000000001/discussions/00000000-0000-0000-0000-000000000000/upvote` returned the expected `404 discussion_not_found`.

Full browser A/B smoke was not completed because the repo is configured for the remote Supabase project, no local seeded discussion rows exist, and no user A/user B test credentials or local authenticated sessions were available. I did not create remote users or seed remote data as part of this read-only audit.

## Confirmed Gaps

### Edit/delete flow does not exist

The requested edit/delete smoke steps cannot pass today. There are no `PATCH` or `DELETE` routes for `challenge_discussions`, no reply edit/delete routes, and no edit/delete controls in `DiscussionThread`.

Expected hardening:

- Add owner-only edit/delete routes for top-level discussions.
- Add owner-only edit/delete routes for replies if replies should be mutable.
- Return `403` when an authenticated user tries to mutate another user's post.
- Add UI controls only for owned content.

### Unauthenticated mutation attempts fall through to `mock-user`

Discussion create, reply create, and upvote all use `user?.id ?? 'mock-user'`. In the real schema, `user_id` is a UUID FK to `profiles(id)` and `upvoted_by` is a `uuid[]`, so unauthenticated mutations can fail as server errors instead of returning `401`.

Observed: unauthenticated top-level post returned `500 discussion_post_failed`.

Expected hardening:

- Require an authenticated user for discussion mutations.
- Return `401 auth_required` before attempting inserts or upvotes.
- Remove the `mock-user` fallback from non-mock runtime paths.

### Reply UI is not wired to data

The replies API exists, and `DiscussionThread` can render a `replies` prop, but neither the dedicated discussion page nor the workspace Discussions tab fetches replies or passes them into `DiscussionThread`.

Expected hardening:

- Fetch replies per visible discussion or include them in the discussions payload.
- After posting a reply, append the returned reply or refetch replies.
- Show reply API failures instead of reporting success.

### Post/reply inputs ignore HTTP failures

`DiscussionInput` and `DiscussionThread` await `fetch(...)` but do not check `res.ok`. A completed `500` response is treated as success, clearing content and showing the success state.

Expected hardening:

- Check `res.ok` and parse the error envelope.
- Keep the draft content on failure.
- Show an inline failure state.

### Upvotes are not race-safe

The upvote route reads `upvote_count` and `upvoted_by`, mutates them in memory, then writes both values. Concurrent toggles can overwrite each other.

Expected hardening:

- Move toggle logic into a Postgres function or use a transaction-safe RPC.
- Keep `upvote_count` derived from `upvoted_by` where possible.

### Route params are not cross-checked

Reply and upvote routes accept both `id` and `discussionId`, but only use `discussionId`. A request can operate on a discussion under a mismatched challenge URL.

Expected hardening:

- Verify the discussion exists with both `id` and `discussionId`.
- Return `404 discussion_not_found` for mismatches.

### RLS update policy is broad

`challenge_discussions` has `UPDATE USING (true) WITH CHECK (true)` for upvotes. If table grants allow direct client updates, any authenticated user could update any column on any discussion row. The current app mostly bypasses this with admin-client routes, which makes route-level authorization even more important.

Expected hardening:

- Avoid broad direct table updates for user clients.
- Prefer an RPC for upvote toggles or a narrower table design.
- Add route-level authorization for every admin-client mutation.

### Dashboard latest-discussions helper is stale

`getLatestDiscussions()` selects `challenge_prompts(title)`, but migrations moved discussion challenge IDs away from the old `challenge_prompts` relationship. The helper ignores query errors and falls back to mock discussions when no data is returned.

Expected hardening:

- Join or look up the current `challenges` table by text `challenge_id`.
- Surface query errors in server logs instead of silently falling back to mock data.
