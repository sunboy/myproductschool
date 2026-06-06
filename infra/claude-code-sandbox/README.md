# Claude Code Analytics sandbox container

Runs one analytics session: an in-browser terminal (xterm over WSS) into a
container where the `claude` CLI talks to a BigQuery MCP server over a read-only
demo dataset. The user drives Claude in plain language; `/workspace` is tarballed
to the orchestrator every 30s for grading.

## Provenance

This directory was **recovered on 2026-06-02** from the live Fly image
`registry.fly.io/hackproduct-cc-sandbox:mvp` (`sha256:6f4d78e2953b16a76b478ac279394434bb43344f636b35a5bc72c885fc83b18f`)
after the original source was lost from git. `entrypoint-pty.js`, `entrypoint.sh`,
`bq-mcp`, `bq-mcp-server.js`, `package.json`, and `workspace-CLAUDE.md` are
verbatim copies pulled off the running machine via `fly machine exec ... cat`.
The `Dockerfile` is reconstructed from the verified runtime (Debian 12 bookworm,
Node 20.20.2, claude 2.1.136, gcloud SDK at `/opt/google-cloud-sdk`).

## Files

| File | Role |
|---|---|
| `Dockerfile` | Image build (reconstructed). |
| `entrypoint.sh` | Boot: activate GCP SA, pull challenge tarball, pre-seed Claude config, bash MOTD, 30s autosave loop, start PTY server. |
| `entrypoint-pty.js` | WSS server on `:7681`. Validates `?token=<sessionId>.<hostId>.<hmac>` (HMAC-SHA256 over `SESSION_TOKEN_SECRET`), spawns `claude` in a node-pty, pipes ws↔pty, supports resize. |
| `bq-mcp` / `bq-mcp-server.js` | BigQuery MCP server (shells to `bq`). User registers it with `claude mcp add bigquery -- bq-mcp`. |
| `session-launch` | Wraps the PTY session in `nice`/`ionice` + `oom_score_adj=1000` so a runaway user process is deprioritized and OOM-killed before the bridge. |
| `workspace-CLAUDE.md` | The CLAUDE.md seeded into `/workspace` for the session. |

## Hardening applied (E2B-informed, 2026-06-02)

After studying `e2b-dev/infra`'s `envd` daemon, the recovered container was hardened:

- **Permission model.** Dropped `--dangerously-skip-permissions`. The `claude`
  alias now runs `--permission-mode acceptEdits`; `~/.claude/settings.json`
  carries an allow list (BigQuery MCP, Read, Edit/Write under `/workspace` and
  `~/.claude/skills`, a small Bash allowlist) and a deny list (`curl`/`wget`,
  `rm`/`sudo`/`chmod`, `npm`/`pip`/`apt`, `env`/`printenv`, recursive `claude`,
  WebFetch/WebSearch/Task). Off-list calls fail closed (no TTY to approve).
- **Env scrubbing.** `entrypoint-pty.js` strips secrets
  (`SESSION_TOKEN_SECRET`, `GOOGLE_APPLICATION_CREDENTIALS_JSON`,
  `SNAPSHOT_AUTH_TOKEN`, etc.) from the env handed to the PTY child;
  `ANTHROPIC_API_KEY` is kept only for the CLI and fenced from the terminal by
  the `Bash(env)`/`Bash(printenv)` deny rules.
- **Idle keepalive.** The WSS bridge pings on a 30s timer that resets on every
  data event, so Cloud Run / proxies don't drop a quiet terminal.
- **Readiness probe.** `GET /health` → `204`. The orchestrator polls this before
  handing the browser a `wss://` URL (fixes the connect-before-ready race).
- **Exec deprioritization.** `session-launch` (nice/ionice/oom_score_adj).
- **No auto-update.** `DISABLE_AUTOUPDATER=1`, claude pinned to `2.1.136`.
- **Read-only rootfs at runtime.** Run with `--read-only` + tmpfs for `/tmp` and
  `/home/analyst/.cache`, and a writable mount for `/workspace` +
  `/home/analyst/.claude`.

**Egress:** intentionally NOT network-allowlisted at the container layer (Cloud
Run can't run iptables). Relies on gVisor isolation + the Claude deny list +
a read-only BigQuery service account. VPC egress allowlist is deferred to a
pre-launch security pass.

## Runtime env (injected by the orchestrator at create time)

`ANTHROPIC_API_KEY`, `ANTHROPIC_BUDGET_USD`, `SESSION_ID`, `SESSION_TOKEN_SECRET`,
`GOOGLE_APPLICATION_CREDENTIALS_JSON`, `BQ_PROJECT`, `BQ_DATASET`,
`CHALLENGE_TARBALL_URL`, `CLAUDE_MD`, `ORCHESTRATOR_SNAPSHOT_URL`, `SNAPSHOT_AUTH_TOKEN`.

## Build & push

For Cloud Run (recommended host), build to Artifact Registry and deploy:

```bash
# from infra/claude-code-sandbox/
gcloud builds submit --tag REGION-docker.pkg.dev/hackproduct/cc/sandbox:mvp .
gcloud run deploy cc-sandbox --image REGION-docker.pkg.dev/hackproduct/cc/sandbox:mvp \
  --region REGION --concurrency 1 --min-instances 1 --no-allow-unauthenticated
```

The legacy Fly build (kept for reference) was:

```bash
export FLY_API_TOKEN=...   # from a fly auth token
fly deploy --build-only --remote-only --push --image-label mvp --app hackproduct-cc-sandbox
```
