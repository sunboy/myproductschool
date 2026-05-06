# Discussions Schema

Sources audited:

- `supabase/migrations/004_discussions.sql`
- `supabase/migrations/017_discussions_enrich.sql`
- `supabase/migrations/018_luma_seed_flag.sql`
- `supabase/migrations/062_rename_luma_to_hatch.sql`
- `supabase/migrations/075_discussions_challenge_id_text.sql`

## Tables

### `challenge_discussions`

Current shape after later migrations:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key, defaults to `gen_random_uuid()`. |
| `challenge_id` | `text` | Originally a UUID FK to `challenge_prompts(id)`. Migration 075 drops the FK and casts this to text after challenges moved to text IDs. Challenge existence is now enforced by application code only. |
| `user_id` | `uuid` | Nullable after migration 018 for Hatch/system posts. Still references `profiles(id)` with `ON DELETE CASCADE`. |
| `display_name` | `text` | Nullable persona label for Hatch/system posts. Migration 062 rewrites old `Luma` labels to `Hatch`. |
| `content` | `text` | Required. |
| `is_expert_pick` | `boolean` | Defaults to `false`; used for Hatch/expert surfaced posts. |
| `upvote_count` | `integer` | Defaults to `0`; maintained by the app's upvote route. |
| `upvoted_by` | `uuid[]` | Defaults to `{}`; tracks users who toggled an upvote. |
| `reply_count` | `integer` | Defaults to `0`; maintained by the reply-count trigger. |
| `created_at` | `timestamptz` | Defaults to `now()`. |
| `updated_at` | `timestamptz` | Defaults to `now()`. |

Indexes:

- `idx_discussions_challenge` on `challenge_discussions(challenge_id)`
- `idx_discussions_user` on `challenge_discussions(user_id)`

### `discussion_replies`

Current shape after later migrations:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key, defaults to `gen_random_uuid()`. |
| `discussion_id` | `uuid` | Required FK to `challenge_discussions(id)` with `ON DELETE CASCADE`. |
| `user_id` | `uuid` | Nullable after migration 018 for Hatch/system replies. Still references `profiles(id)` with `ON DELETE CASCADE`. |
| `display_name` | `text` | Nullable persona label for Hatch/system replies. |
| `content` | `text` | Required. |
| `created_at` | `timestamptz` | Defaults to `now()`. |

Indexes:

- `idx_replies_discussion` on `discussion_replies(discussion_id)`

## Trigger

`sync_reply_count()` runs after insert or delete on `discussion_replies` and rewrites `challenge_discussions.reply_count` with the current count for the affected discussion.

## RLS

`challenge_discussions` has RLS enabled.

- `Users read all discussions`: `SELECT USING (true)`
- `Users insert own`: permits authenticated users to insert rows where `auth.uid() = user_id`, and permits null `user_id` rows for service-role seeded Hatch/system posts.
- `Users can upvote discussions`: `UPDATE USING (true) WITH CHECK (true)`

`discussion_replies` has RLS enabled.

- `Users read all replies`: `SELECT USING (true)`
- `Users insert own replies`: permits authenticated users to insert rows where `auth.uid() = user_id`, and permits null `user_id` rows for service-role seeded Hatch/system replies.

There are no explicit update/delete policies for editing or deleting user-authored discussions or replies. The app routes currently use the Supabase admin client for discussion reads/writes, so those routes bypass RLS and must enforce authorization in route code.

## API Inventory

### `GET /api/challenges/:id/discussions`

Implemented in `src/app/api/challenges/[id]/discussions/route.ts`.

Input:

- Route param `id`.
- No body.

Output:

- `200` with a `ChallengeDiscussion[]`.
- `500` with `discussion_fetch_failed`.

Behavior:

- Calls `getChallengeDiscussions(id)`.
- Data helper reads `challenge_discussions` through the admin client, joins `profiles(username)`, filters by `challenge_id`, and orders newest first.
- In mock mode, the helper currently returns all mock discussions because the filter includes `|| true`.

### `POST /api/challenges/:id/discussions`

Implemented in `src/app/api/challenges/[id]/discussions/route.ts`.

Input:

- Route param `id`.
- JSON body `{ "content": string }`.
- `content` is trimmed and must be 1 to 10000 characters.

Output:

- `201` with the inserted discussion.
- `400` with `invalid_request` for schema failures.
- `400` with `invalid_json` for invalid JSON.
- `500` with `discussion_post_failed`.

Behavior and edge cases:

- Reads the Supabase user from server auth.
- Falls back to `mock-user` when no session exists instead of returning `401`.
- Inserts through the admin client, so API code, not RLS, is the effective authorization layer.
- The inserted row is not rejoined to `profiles`, so the immediate response may not include `username`.

### `GET /api/challenges/:id/discussions/:discussionId/replies`

Implemented in `src/app/api/challenges/[id]/discussions/[discussionId]/replies/route.ts`.

Input:

- Route param `discussionId`.
- No body.

Output:

- `200` with reply rows enriched with `username`.
- `500` with `discussion_replies_fetch_failed`.

Behavior and edge cases:

- Reads `discussion_replies` through the admin client.
- Does not verify that `discussionId` belongs to the route's `challengeId`.

### `POST /api/challenges/:id/discussions/:discussionId/replies`

Implemented in `src/app/api/challenges/[id]/discussions/[discussionId]/replies/route.ts`.

Input:

- Route param `discussionId`.
- JSON body `{ "content": string }`.
- `content` is trimmed and must be 1 to 10000 characters.

Output:

- `201` with the inserted reply.
- `400` with `invalid_request` for schema failures.
- `400` with `invalid_json` for invalid JSON.
- `500` with `discussion_reply_post_failed`.

Behavior and edge cases:

- Reads the Supabase user from server auth.
- Falls back to `mock-user` when no session exists instead of returning `401`.
- Inserts through the admin client.
- Does not verify that `discussionId` belongs to the route's `challengeId`.

### `PATCH /api/challenges/:id/discussions/:discussionId/upvote`

Implemented in `src/app/api/challenges/[id]/discussions/[discussionId]/upvote/route.ts`.

Input:

- Route param `discussionId`.
- No body.

Output:

- `200` with `{ "upvote_count": number, "upvoted": boolean }`.
- `404` with `discussion_not_found`.
- `500` with `discussion_upvote_failed`.

Behavior and edge cases:

- Reads the Supabase user from server auth.
- Falls back to `mock-user` when no session exists instead of returning `401`.
- Reads `upvote_count` and `upvoted_by`, toggles the current user ID in memory, then writes both fields through the admin client.
- The update is not atomic, so simultaneous upvotes can race.
- Does not verify that `discussionId` belongs to the route's `challengeId`.

## UI Inventory

### Dedicated discussion page

`src/app/(app)/challenges/[id]/discussion/page.tsx`

- Fetches `GET /api/challenges/:id/discussions`.
- Renders expert picks before regular posts.
- Renders `DiscussionInput`.
- Optimistically toggles upvotes with no rollback if the API call fails.
- Does not fetch or pass replies into `DiscussionThread`.
- Has no edit/delete UI.

### Workspace Discussions tab

`src/components/v2/FlowWorkspace.tsx`

- Loads discussions once when the left panel tab changes to `Discussions`.
- Renders the same `DiscussionThread` and `DiscussionInput` components as the dedicated discussion page.
- Uses the same upvote endpoint and local optimistic state.
- Does not fetch or pass replies into `DiscussionThread`.

### `DiscussionInput`

`src/components/challenge/DiscussionInput.tsx`

- Sends `POST /api/challenges/:id/discussions`.
- Truncates client input to 500 characters even though the API allows 10000.
- Does not check `res.ok`; any completed HTTP response is treated as a successful post.

### `DiscussionThread`

`src/components/challenge/DiscussionThread.tsx`

- Renders the discussion, upvote action, reply toggle, and optional replies from a `replies` prop.
- Sends `POST /api/challenges/:id/discussions/:discussionId/replies`.
- Does not check `res.ok`; any completed HTTP response is treated as a successful reply.
- Does not refetch or append the created reply after posting.
- Includes an inert `more_horiz` button.

### Dashboard card

`src/components/dashboard/cards/DiscussionsCard.tsx`

- Displays discussion preview data passed by the dashboard.
- Links to `/challenges`, not to a specific discussion thread.
- Dashboard data helper still attempts `challenge_prompts(title)` even though the live `challenge_discussions.challenge_id` relationship was moved away from that table.
