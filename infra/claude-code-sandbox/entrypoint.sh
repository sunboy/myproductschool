#!/usr/bin/env bash
# entrypoint.sh — sandbox bootstrap for HackProduct Claude Code sessions
# Reads env vars injected by the Fly Machines API at create-time.
# All secrets are env-only; nothing is committed here.
set -euo pipefail

# ─── 1. Write GCP service-account key (synchronous, fast) ────────────────────
# The `bq` CLI does NOT honor GOOGLE_APPLICATION_CREDENTIALS — it uses gcloud's
# own credential store. We activate the SA via gcloud, but defer that to the
# background so the PTY server can start immediately. The browser races to
# connect ~1 s after machine boot; if PTY server isn't up by then it gives up
# and the user sees "[Session unavailable — sandbox not reachable]".
if [[ -n "${GOOGLE_APPLICATION_CREDENTIALS_JSON:-}" ]]; then
  printf '%s' "$GOOGLE_APPLICATION_CREDENTIALS_JSON" > /secrets/sa.json
  chmod 600 /secrets/sa.json
  export GOOGLE_APPLICATION_CREDENTIALS=/secrets/sa.json

  (
    gcloud auth activate-service-account --key-file=/secrets/sa.json --quiet 2>/dev/null || \
      echo "[entrypoint] WARN: gcloud activate-service-account failed"
    if [[ -n "${BQ_PROJECT:-}" ]]; then
      gcloud config set project "$BQ_PROJECT" --quiet 2>/dev/null || true
    fi
    echo "[entrypoint] gcloud SA activated"
  ) &
fi

# ─── 2. Pull challenge tarball from presigned URL ────────────────────────────
if [[ -n "${CHALLENGE_TARBALL_URL:-}" ]]; then
  echo "[entrypoint] Downloading challenge tarball…"
  curl -fsSL "$CHALLENGE_TARBALL_URL" | tar -xz -C /workspace
fi

# Write CLAUDE.md to workspace if provided via env
if [[ -n "${CLAUDE_MD:-}" ]]; then
  printf '%s' "$CLAUDE_MD" > /workspace/CLAUDE.md
fi

# ─── 2a. Rehydrate the user's prior ~/.claude state ──────────────────────────
# Per-user snapshot of ~/.claude (their .mcp.json MCP registrations + the skills
# they wrote in earlier sessions). Pulled BEFORE step 3a so the platform-curated
# settings.json still wins, but the user's registered MCP servers and authored
# skills carry forward. This is what lets a returning user skip the MCP setup
# step and compounds the skills they build across challenges.
if [[ -n "${USER_CLAUDE_STATE_URL:-}" ]]; then
  echo "[entrypoint] Rehydrating prior ~/.claude state…"
  mkdir -p "$HOME/.claude"
  # The snapshot is tarred relative to $HOME (paths like .mcp.json,
  # .claude/skills/...), so extract into $HOME.
  curl -fsSL "$USER_CLAUDE_STATE_URL" | tar -xz -C "$HOME" 2>/dev/null \
    || echo "[entrypoint] no prior user state (first session)"
fi

# ─── 3. Re-export Anthropic key (passed at machine create time) ─────────────
# ANTHROPIC_API_KEY is already in the env; just ensure it is exported.
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}"

# Budget cap guard (informational — Claude Code CLI will enforce its own limits)
export ANTHROPIC_BUDGET_USD="${ANTHROPIC_BUDGET_USD:-0.50}"

# Suppress the "Auto-update failed · Try claude doctor" banner. The container
# is read-only-ish for the analyst user and can't write to the global npm
# install, so the auto-updater always fails. Disable it instead of leaking
# the error into the user's terminal.
export DISABLE_AUTOUPDATER=1

# ─── 3a. Pre-seed Claude Code config + onboarding state ──────────────────────
# Two files, both required to skip every first-run prompt:
#   ~/.claude/settings.json  — long-lived user preferences (theme, telemetry)
#   ~/.claude.json           — runtime state (onboarding markers)
# Without ~/.claude.json's hasCompletedOnboarding=true, Claude Code re-prompts
# the theme picker on every launch even if a theme is set in settings.json.
mkdir -p ~/.claude
# Permission model: acceptEdits (auto-approve safe edits/writes + an explicit
# Bash allowlist) instead of the old --dangerously-skip-permissions bypass.
# This is Wall 1 of the hardening: even with gVisor isolation around the
# container, Claude itself is fenced. Anything off the allowlist and not on the
# deny list falls to the interactive prompt, which no human can answer over the
# PTY, so it fails cleanly and Claude reports "I was blocked from X".
# `Bash(env)`/`Bash(printenv)` are denied so the API key cannot be echoed even
# though it lives in the child env for the CLI's own use.
cat > ~/.claude/settings.json <<'EOF'
{
  "theme": "dark",
  "telemetry": false,
  "permissions": {
    "defaultMode": "acceptEdits",
    "allow": [
      "mcp__bigquery__*",
      "Read(*)",
      "Edit(/workspace/**)",
      "Write(/workspace/**)",
      "Edit(/home/analyst/.claude/skills/**)",
      "Write(/home/analyst/.claude/skills/**)",
      "Bash(bq:*)",
      "Bash(ls:*)", "Bash(cat:*)", "Bash(grep:*)",
      "Bash(head:*)", "Bash(tail:*)", "Bash(wc:*)",
      "Bash(pwd)", "Bash(echo:*)",
      "Bash(python3:*)", "Bash(node:*)"
    ],
    "deny": [
      "Bash(curl:*)", "Bash(wget:*)",
      "Bash(rm:*)", "Bash(sudo:*)",
      "Bash(chmod:*)", "Bash(chown:*)",
      "Bash(npm:*)", "Bash(pip:*)", "Bash(apt:*)",
      "Bash(env)", "Bash(printenv)",
      "Bash(cat:/etc/*)", "Bash(cat:/proc/*)",
      "Bash(claude:*)",
      "WebFetch", "WebSearch", "Task"
    ]
  }
}
EOF

# Claude Code identifies a custom API key by the last 20 chars of
# ANTHROPIC_API_KEY (function Lv = A => A.slice(-20) inside cli.js).
# Pre-approve that identifier so the "Detected a custom API key in your
# environment / Do you want to use this API key?" prompt never appears.
CUSTOM_API_KEY_SUFFIX="${ANTHROPIC_API_KEY: -20}"
cat > ~/.claude.json <<EOF
{
  "hasCompletedOnboarding": true,
  "hasUsedClaudeCode": true,
  "hasAcknowledgedCostThreshold": true,
  "theme": "dark",
  "verbose": false,
  "tipsHistory": {},
  "preferredAuthMethod": "apiKey",
  "customApiKeyResponses": {
    "approved": ["${CUSTOM_API_KEY_SUFFIX}"],
    "rejected": []
  },
  "projects": {
    "/workspace": {
      "hasTrustDialogAccepted": true,
      "hasCompletedProjectOnboarding": true,
      "allowedTools": [],
      "history": []
    }
  }
}
EOF

# ─── 3b. Pre-create workspace skills directory ───────────────────────────────
# Task #32 (T7) will mount starter skill files here at challenge launch time.
mkdir -p /workspace/.claude/skills

# ─── 3c. Set up the analyst's bash shell ─────────────────────────────────────
# The session opens on a bash prompt, not the Claude Code REPL, so the user
# can learn to register the BigQuery MCP themselves. This is the whole
# pedagogical point of the first 90 seconds.
#
# What we set up here:
#   - Short PS1 (`$ `) so the prompt fits in narrow xterm widths.
#   - claude alias that runs in acceptEdits mode with the allow/deny lists in
#     ~/.claude/settings.json. Safe edits/writes to /workspace and the
#     allowlisted bash + BigQuery MCP run without a prompt; anything else fails
#     closed (no human at the TTY to approve), and Claude reports it was blocked.
#   - A one-time Hatch-tagged MOTD with the two commands the user is
#     supposed to run. Stored in a flag file so re-sourcing .bashrc
#     after restart doesn't reprint it.
cat > ~/.bashrc <<'EOF'
# PATH must be set before the interactive-shell guard so that subprocesses
# launched from non-interactive contexts (e.g. node spawning bq-mcp-server.js
# which shells out to `bq`) inherit gcloud's location. The Dockerfile sets
# this via ENV but `bash --login` re-reads /etc/profile which can clobber it.
export PATH=/opt/google-cloud-sdk/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# Stop here for non-interactive shells
[[ $- != *i* ]] && return

# Short prompt — fits in narrow xterm columns
export PS1='\$ '

# `claude` should always skip permissions inside this sandbox; the user is
# in a locked-down VM and we've pre-accepted the bypass mode in ~/.claude.json
alias claude='command claude --permission-mode acceptEdits'

# Bash should not echo aliases on expansion (cleaner output)
shopt -s expand_aliases

# One-time welcome banner — coaches the user through their first commands
if [[ ! -f ~/.claude_welcome_shown ]]; then
  cat <<'MOTD'

  Welcome. You are inside a sandbox VM with BigQuery access.

  Step 1: give Claude Code the BigQuery tool:
    claude mcp add bigquery -- bq-mcp

  Step 2: start the analyst:
    claude

  Then ask Claude what tables are in the dataset.

MOTD
  touch ~/.claude_welcome_shown
fi
EOF

# Also write .bash_profile so login shells source .bashrc
cat > ~/.bash_profile <<'EOF'
[[ -f ~/.bashrc ]] && source ~/.bashrc
EOF

# ─── 4. 30-second autosave loop (background) ─────────────────────────────────
# POSTs a tarball of /workspace to ORCHESTRATOR_SNAPSHOT_URL every 30 s.
# The orchestrator passes a shared secret via SNAPSHOT_AUTH_TOKEN.
#
# It also POSTs a per-user ~/.claude snapshot (the portable bits: .mcp.json MCP
# registrations + the skills/ the user wrote) to USER_STATE_SNAPSHOT_URL, so the
# next session rehydrates it (see step 2a). We snapshot only the portable subset,
# not the whole ~/.claude (which includes the bulky plugins cache).
if [[ -n "${ORCHESTRATOR_SNAPSHOT_URL:-}" ]]; then
  (
    while true; do
      sleep 30

      # Workspace snapshot (per-session, graded)
      TARBALL_PATH=$(mktemp /tmp/snapshot-XXXXXX.tar.gz)
      tar -czf "$TARBALL_PATH" -C / workspace 2>/dev/null || true
      curl -fsSL -X POST \
        -H "Authorization: Bearer ${SNAPSHOT_AUTH_TOKEN:-}" \
        -H "Content-Type: application/gzip" \
        --data-binary "@$TARBALL_PATH" \
        "${ORCHESTRATOR_SNAPSHOT_URL}" 2>/dev/null || true
      rm -f "$TARBALL_PATH"

      # Per-user ~/.claude snapshot (portable: .mcp.json + skills + .claude.json)
      if [[ -n "${USER_STATE_SNAPSHOT_URL:-}" ]]; then
        STATE_PATH=$(mktemp /tmp/userstate-XXXXXX.tar.gz)
        # -C $HOME so paths are relative (.mcp.json, .claude/skills, ...) for a
        # clean extract into ~/.claude on the next boot.
        tar -czf "$STATE_PATH" -C "$HOME" \
          $( [[ -f "$HOME/.mcp.json" ]] && echo .mcp.json ) \
          $( [[ -d "$HOME/.claude/skills" ]] && echo .claude/skills ) \
          $( [[ -f "$HOME/.claude.json" ]] && echo .claude.json ) \
          2>/dev/null || true
        if [[ -s "$STATE_PATH" ]]; then
          curl -fsSL -X POST \
            -H "Authorization: Bearer ${SNAPSHOT_AUTH_TOKEN:-}" \
            -H "Content-Type: application/gzip" \
            --data-binary "@$STATE_PATH" \
            "${USER_STATE_SNAPSHOT_URL}" 2>/dev/null || true
        fi
        rm -f "$STATE_PATH"
      fi
    done
  ) &
  AUTOSAVE_PID=$!
fi

# ─── 5. Graceful shutdown handler ────────────────────────────────────────────
cleanup() {
  echo "[entrypoint] SIGTERM received — shutting down"
  if [[ -n "${AUTOSAVE_PID:-}" ]]; then
    kill "$AUTOSAVE_PID" 2>/dev/null || true
  fi
  # Kill the PTY server
  if [[ -n "${PTY_PID:-}" ]]; then
    kill "$PTY_PID" 2>/dev/null || true
  fi
  exit 0
}
trap cleanup SIGTERM SIGINT

# ─── 6. Start PTY TCP server ─────────────────────────────────────────────────
# entrypoint-pty.js: net.createServer on 0.0.0.0:7681
# Accepts one connection, spawns `claude` in a PTY, pipes bytes bidirectionally.
echo "[entrypoint] Starting PTY server on :7681…"
node /entrypoint-pty.js &
PTY_PID=$!

# Wait for PTY process to exit (it will when the connection closes or crashes)
wait "$PTY_PID"
