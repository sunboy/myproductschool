/**
 * entrypoint-pty.js
 *
 * WSS PTY server — replaces the raw TCP bridge.
 *
 * Behaviour:
 *   - Listens on 0.0.0.0:7681 as a WebSocket server (Fly terminates TLS at edge).
 *   - On incoming WS connection, validates the URL query ?token=<sessionId>.<machineId>.<base64-hmac>.
 *     The HMAC is SHA-256 over "<sessionId>.<machineId>" using SESSION_TOKEN_SECRET.
 *   - Also validates that FLY_MACHINE_ID matches the machineId embedded in the token,
 *     so Fly's load-balancer routing to the wrong machine is caught immediately.
 *   - If invalid: ws.close(4401, 'Invalid token')
 *   - If wrong machine: ws.close(4403, 'Wrong machine')
 *   - If valid: spawns a node-pty `claude` process and pipes ws <-> pty bidirectionally.
 *   - Supports resize via control prefix \x1b[?resize={"cols":N,"rows":N}.
 *   - Allows multiple concurrent connections (reconnect after tab refresh).
 *     Each connection gets its own PTY.
 *   - On close: kills the PTY.
 *
 * Token format: <sessionId>.<machineId>.<base64url-hmac>
 *   - sessionId:  the claude_code_sessions UUID
 *   - machineId:  the Fly machine ID (FLY_MACHINE_ID env var on this machine)
 *   - base64url-hmac: base64url(HMAC-SHA256("<sessionId>.<machineId>", SESSION_TOKEN_SECRET))
 *
 * Environment variables:
 *   PORT                  (default 7681)
 *   SHELL_CMD             (default "claude")
 *   SHELL_ARGS            (default "")
 *   COLS                  (default 220)
 *   ROWS                  (default 50)
 *   SESSION_TOKEN_SECRET  (required) — shared HMAC secret
 *   FLY_MACHINE_ID        (injected by Fly automatically)
 */

'use strict';

const { WebSocketServer } = require('ws');
const http = require('http');
const pty = require('node-pty');
const crypto = require('crypto');
const { URL } = require('url');

// Secrets that must never leak into the user's shell/PTY environment. The
// orchestrator injects these into the container process; the analyst driving
// the terminal must not be able to `env | grep` them out. We strip them from
// the env handed to node-pty and rebuild a clean allowlisted env instead.
// (E2B's envd does the same — scrub child env down to an allowlist.)
const SECRET_ENV_KEYS = new Set([
  'ANTHROPIC_API_KEY',
  'SESSION_TOKEN_SECRET',
  'GOOGLE_APPLICATION_CREDENTIALS_JSON',
  'SNAPSHOT_AUTH_TOKEN',
  'ORCHESTRATOR_SNAPSHOT_URL',
  'CHALLENGE_TARBALL_URL',
  'HOST_ID',
  'FLY_MACHINE_ID',
  'FLY_API_TOKEN',
]);

/**
 * Build the env the PTY child sees: everything except the secret keys above,
 * plus ANTHROPIC_API_KEY kept ONLY because the `claude` CLI needs it — but the
 * Claude permission deny list blocks `Bash(env)`/`Bash(printenv)` so it can't be
 * echoed to the terminal. GOOGLE_APPLICATION_CREDENTIALS (the file path, not the
 * JSON) is preserved so `bq` works; the JSON blob itself is stripped.
 */
function buildChildEnv() {
  const clean = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (SECRET_ENV_KEYS.has(k)) continue;
    clean[k] = v;
  }
  // claude needs the key; it is fenced from `env`/`printenv` by the deny list.
  if (process.env.ANTHROPIC_API_KEY) clean.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  return clean;
}

const PORT        = parseInt(process.env.PORT ?? '7681', 10);
// We default to an interactive bash shell, NOT `claude` directly.
// The first thing the user does in this challenge is learn how to register
// the BigQuery MCP — that requires a real shell prompt to run
// `claude mcp add bigquery -- bq-mcp` followed by `claude`. Spawning the
// REPL directly would skip the teaching moment.
const SHELL_CMD   = process.env.SHELL_CMD ?? 'bash';
const SHELL_ARGS  = process.env.SHELL_ARGS ? process.env.SHELL_ARGS.split(' ') : ['--login'];
const COLS        = parseInt(process.env.COLS ?? '220', 10);
const ROWS        = parseInt(process.env.ROWS ?? '50', 10);
const TOKEN_SECRET = process.env.SESSION_TOKEN_SECRET ?? '';
// Host identifier the token's host segment is cross-checked against. HOST_ID is
// set by the orchestrator on any provider (Cloud Run revision suffix, etc.);
// FLY_MACHINE_ID is the legacy Fly fallback (Fly injects it automatically).
const MY_MACHINE_ID = process.env.HOST_ID ?? process.env.FLY_MACHINE_ID ?? '';

// Active PTY connections keyed by a connection-local id (for logging)
const connections = new Map();
let connCounter = 0;

// ---------------------------------------------------------------------------
// Token validation
// ---------------------------------------------------------------------------

/**
 * Validates a token string.
 * Format: <sessionId>.<machineId>.<base64url-hmac>
 * Returns { valid: true, sessionId, machineId } or { valid: false, reason }.
 */
function validateToken(tokenStr) {
  if (!TOKEN_SECRET) {
    console.error('[pty] SESSION_TOKEN_SECRET not set — rejecting all connections');
    return { valid: false, reason: 'Server misconfigured' };
  }

  if (!tokenStr) {
    return { valid: false, reason: 'Missing token' };
  }

  // Split on the LAST two dots: <sessionId>.<machineId>.<hmac>
  // sessionId may contain hyphens but not dots; machineId is hex (no dots); hmac is base64url
  const parts = tokenStr.split('.');
  if (parts.length < 3) {
    return { valid: false, reason: 'Malformed token' };
  }

  // Last part is hmac, second-to-last is machineId, everything before is sessionId
  const hmacB64 = parts[parts.length - 1];
  const machineId = parts[parts.length - 2];
  const sessionId = parts.slice(0, parts.length - 2).join('.');

  if (!sessionId || !machineId || !hmacB64) {
    return { valid: false, reason: 'Malformed token parts' };
  }

  // Compute expected HMAC
  const payload = `${sessionId}.${machineId}`;
  const expected = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('base64url');

  // Constant-time comparison
  const hmacBuf = Buffer.from(hmacB64, 'base64url');
  const expectedBuf = Buffer.from(expected, 'base64url');

  if (hmacBuf.length !== expectedBuf.length) {
    return { valid: false, reason: 'Invalid token signature' };
  }

  let mismatch = 0;
  for (let i = 0; i < hmacBuf.length; i++) {
    mismatch |= hmacBuf[i] ^ expectedBuf[i];
  }

  if (mismatch !== 0) {
    return { valid: false, reason: 'Invalid token signature' };
  }

  return { valid: true, sessionId, machineId };
}

// ---------------------------------------------------------------------------
// WebSocket server
// ---------------------------------------------------------------------------

// HTTP server hosts both the readiness probe and the WebSocket upgrade. The
// orchestrator polls GET /health and only hands the browser a wss:// URL once it
// returns 204, eliminating the "browser connects ~1s after boot and gives up"
// race the bootstrap used to suffer. (E2B's envd uses the same readiness gate.)
const httpServer = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(204, { 'Cache-Control': 'no-store' });
    res.end();
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: httpServer });

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[pty] HTTP+WebSocket server listening on 0.0.0.0:${PORT} (GET /health, WS upgrade)`);
  if (MY_MACHINE_ID) {
    console.log(`[pty] Host ID: ${MY_MACHINE_ID}`);
  } else {
    console.warn('[pty] HOST_ID/FLY_MACHINE_ID not set (running locally?)');
  }
});

// Idle keepalive: ping the client on an interval, reset whenever data flows.
// Cloud Run (and most proxies/LBs) drop a WebSocket that is silent for ~minutes;
// an analyst reading output or thinking produces exactly that silence. A ping
// that only fires during genuine idle keeps the socket alive without spamming.
// (Mirrors envd's keepalive-reset-on-data design.)
const KEEPALIVE_MS = 30_000;

wss.on('connection', (ws, req) => {
  const connId = ++connCounter;
  console.log(`[pty#${connId}] Connection from ${req.socket.remoteAddress}`);

  let keepaliveTimer = null;
  const resetKeepalive = () => {
    if (keepaliveTimer) clearInterval(keepaliveTimer);
    keepaliveTimer = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        try { ws.ping(); } catch { /* closing */ }
      }
    }, KEEPALIVE_MS);
  };
  const stopKeepalive = () => {
    if (keepaliveTimer) { clearInterval(keepaliveTimer); keepaliveTimer = null; }
  };
  ws.on('close', stopKeepalive);
  ws.on('error', stopKeepalive);
  resetKeepalive();

  // ── 1. Parse and validate token ───────────────────────────────────────────
  let parsedUrl;
  try {
    // req.url is just the path+query; prepend a dummy base so URL() parses it
    parsedUrl = new URL(req.url || '/', 'http://localhost');
  } catch {
    console.error(`[pty#${connId}] Failed to parse URL: ${req.url}`);
    ws.close(4400, 'Bad request');
    return;
  }

  const tokenStr = parsedUrl.searchParams.get('token');
  const validation = validateToken(tokenStr);

  if (!validation.valid) {
    console.error(`[pty#${connId}] Token invalid: ${validation.reason}`);
    ws.close(4401, 'Invalid token');
    return;
  }

  const { sessionId, machineId } = validation;
  console.log(`[pty#${connId}] Token valid — session=${sessionId} machineId=${machineId}`);

  // ── 2. Machine ID check ───────────────────────────────────────────────────
  // Only enforce when FLY_MACHINE_ID is set (i.e. running on Fly, not locally)
  if (MY_MACHINE_ID && machineId !== MY_MACHINE_ID) {
    console.error(
      `[pty#${connId}] Wrong machine: token targets ${machineId}, this is ${MY_MACHINE_ID}`
    );
    ws.close(4403, 'Wrong machine');
    return;
  }

  // ── 3. Defer PTY spawn until the browser sends initial dimensions ────────
  // Claude Code paints its banner the moment it starts. If we spawn at the
  // env defaults (220×50) and the browser is actually 80×30, the first
  // ~5 KB of output is rendered at the wrong width before any resize lands —
  // that's what shows up as garbled, torn lines and overlapping characters.
  //
  // Fix: spawn lazily on the first \x1b[?resize=... message. The browser
  // sends one immediately after `ws.onopen`, so the human-perceived delay is
  // a few milliseconds. Any keystrokes that arrive before the spawn are
  // queued in inputBuffer and flushed once the PTY exists.
  //
  // The session runs as the non-root analyst with acceptEdits mode (the `claude`
  // alias in ~/.bashrc adds --permission-mode acceptEdits). We deprioritize the
  // whole session vs the daemon: nice/ionice lower CPU+IO priority, and the
  // child marks itself most-OOM-killable (oom_score_adj=1000) so a runaway
  // user process is reaped before the PTY bridge. (E2B's envd wraps every exec
  // the same way.) `exec` keeps the PID tree flat so resize/signal still work.
  const SESSION_LAUNCHER = process.env.SESSION_LAUNCHER ?? '/usr/local/bin/session-launch';

  /** Spawn (or re-spawn) the claude child inside the existing PTY session. */
  function spawnClaude(cols, rows) {
    try {
      const proc = pty.spawn(SESSION_LAUNCHER, [SHELL_CMD, ...SHELL_ARGS], {
        name: 'xterm-256color',
        cols,
        rows,
        cwd: '/workspace',
        env: buildChildEnv(),
      });
      return proc;
    } catch (err) {
      console.error(`[pty#${connId}] Failed to spawn PTY:`, err.message);
      ws.close(4500, 'Failed to start session');
      return null;
    }
  }

  let ptyProcess = null;
  const inputBuffer = []; // queued keystrokes received before spawn

  // ── 4. PTY → WS (attach listeners for the current ptyProcess) ───────────
  // Wrapped in a helper so it can be re-called after a restart.
  let restartInProgress = false;

  function attachPtyListeners(proc) {
    proc.onData((data) => {
      try {
        if (ws.readyState === ws.OPEN) {
          ws.send(data);
          resetKeepalive(); // data flowed — push the idle ping back out
        }
      } catch {
        // ws may be closing
      }
    });

    proc.onExit(({ exitCode, signal }) => {
      // If we triggered the exit ourselves (restart flow), don't close the WS.
      if (restartInProgress) return;
      console.log(`[pty#${connId}] PTY exited code=${exitCode} signal=${signal}`);
      connections.delete(connId);
      try {
        ws.close(1000, 'Session ended');
      } catch {
        // already closed
      }
    });
  }

  // ── 5. WS → PTY (resize + restart control sequences) ─────────────────────
  //
  // Control sequence \x1b[?ccrestart] — sent by the browser UI when the user
  // clicks "Restart session".  This kills the current claude child via SIGTERM,
  // waits up to 3 s for a clean exit (then SIGKILLs), and re-spawns it inside
  // the same xterm session.  The WebSocket stays open throughout so the
  // terminal emulator on the client side sees a seamless continuation.
  const RESIZE_PREFIX  = '\x1b[?resize=';
  const RESTART_SEQ    = '\x1b[?ccrestart]';

  /** Kill proc gracefully (SIGTERM → 3 s → SIGKILL), resolve when done. */
  function killGracefully(proc) {
    return new Promise((resolve) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        console.log(`[pty#${connId}] SIGKILL after timeout`);
        try { proc.kill('SIGKILL'); } catch { /* already dead */ }
        resolve();
      }, 3000);

      proc.onExit(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      });

      try {
        proc.kill('SIGTERM');
      } catch {
        // Process already gone — resolve immediately
        clearTimeout(timer);
        if (!settled) { settled = true; resolve(); }
      }
    });
  }

  ws.on('message', async (data) => {
    try {
      const str = Buffer.isBuffer(data) ? data.toString() : String(data);

      // ── Resize ────────────────────────────────────────────────────────────
      if (str.startsWith(RESIZE_PREFIX)) {
        try {
          const json = JSON.parse(str.slice(RESIZE_PREFIX.length));
          const cols = Number.isFinite(json.cols) ? Math.max(20, Math.min(500, Math.floor(json.cols))) : COLS;
          const rows = Number.isFinite(json.rows) ? Math.max(5,  Math.min(200, Math.floor(json.rows))) : ROWS;

          if (!ptyProcess) {
            // First resize — spawn now at the correct size
            ptyProcess = spawnClaude(cols, rows);
            if (!ptyProcess) return;
            console.log(`[pty#${connId}] Spawned PTY pid=${ptyProcess.pid} ${cols}x${rows}`);
            connections.set(connId, { ws, ptyProcess, sessionId });
            attachPtyListeners(ptyProcess);
            // Flush any queued keystrokes
            for (const queued of inputBuffer.splice(0)) {
              try { ptyProcess.write(queued); } catch { /* ignore */ }
            }
          } else {
            ptyProcess.resize(cols, rows);
          }
        } catch {
          // Not a valid resize payload; ignore
        }
        return; // Don't forward to PTY
      }

      // ── Restart ───────────────────────────────────────────────────────────
      if (str === RESTART_SEQ) {
        if (restartInProgress) return; // Debounce concurrent restarts
        if (!ptyProcess) return;        // Nothing to restart
        restartInProgress = true;
        console.log(`[pty#${connId}] Restart requested — killing current claude child`);

        const prevCols = ptyProcess.cols;
        const prevRows = ptyProcess.rows;
        await killGracefully(ptyProcess);

        console.log(`[pty#${connId}] Re-spawning claude`);
        const newProc = spawnClaude(prevCols, prevRows);
        if (!newProc) {
          restartInProgress = false;
          return;
        }

        ptyProcess = newProc;
        connections.set(connId, { ws, ptyProcess, sessionId });
        attachPtyListeners(ptyProcess);
        restartInProgress = false;
        console.log(`[pty#${connId}] Restarted — new pid=${ptyProcess.pid}`);
        return;
      }

      // ── Normal input ──────────────────────────────────────────────────────
      if (!ptyProcess) {
        // Pre-spawn — queue the keystroke. Browsers should send resize
        // immediately on connect, so this buffer drains within milliseconds.
        inputBuffer.push(str);
        return;
      }
      ptyProcess.write(str);
    } catch {
      // PTY may have exited; ignore
    }
  });

  // ── 6. WS close → kill current PTY ──────────────────────────────────────
  ws.on('close', (code, reason) => {
    console.log(`[pty#${connId}] WS closed code=${code} reason=${reason?.toString()}`);
    connections.delete(connId);
    if (ptyProcess) {
      try { ptyProcess.kill(); } catch { /* already dead */ }
    }
  });

  ws.on('error', (err) => {
    console.error(`[pty#${connId}] WS error:`, err.message);
    connections.delete(connId);
    if (ptyProcess) {
      try { ptyProcess.kill(); } catch { /* already dead */ }
    }
  });
});

wss.on('error', (err) => {
  console.error('[pty] WSS server error:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[pty] SIGTERM — shutting down');
  for (const [id, { ws, ptyProcess }] of connections) {
    console.log(`[pty] Killing connection #${id}`);
    try { ptyProcess.kill(); } catch { /* ignore */ }
    try { ws.close(1001, 'Server shutting down'); } catch { /* ignore */ }
  }
  wss.close(() => process.exit(0));
});
