-- Per-user Claude Code state: the storage path of the user's latest ~/.claude
-- snapshot (their .mcp.json MCP registrations + the skills they wrote). The
-- session start route presigns a download of this so a returning user's MCP
-- setup and skills carry forward; the per-user state snapshot endpoint updates
-- it. Stored on profiles since it is one latest-state pointer per user.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cc_claude_state_uri text;
