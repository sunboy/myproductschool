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

// ── PERSISTENT PTY SESSIONS ────────────────────────────────────────────────
// The PTY (the running `claude`) is keyed by sessionId and SURVIVES a WebSocket
// drop, so a transient network blip / tab refresh re-attaches to the SAME live
// session instead of killing claude and spawning a fresh shell (which lost the
// user's conversation and dumped them at a bare `$`, where mouse-tracking reports
// then echoed as garbage like "11M"/"120"). Each entry:
//   { proc, scrollback, attachedWs, killTimer, sessionId, cols, rows, restartInProgress }
// The PTY's onData is bound ONCE at spawn and writes to whatever WS is currently
// attached; a reconnect just swaps attachedWs and replays the scrollback so the
// screen restores. The PTY is killed only on genuine exit or after a grace period
// with no client attached.
const ptySessions = new Map();
// How long a detached PTY lingers waiting for a reconnect before being killed.
// Generous: a user closing the tab for a moment, a flaky network, or switching
// apps should not lose their session. The session's own TTL (Cloud Run revision
// timeout) is the hard upper bound. Override via env.
const DETACH_GRACE_MS = parseInt(process.env.PTY_DETACH_GRACE_MS ?? '180000', 10);
// Cap the replayed scrollback so a reconnect restores the visible screen without
// flooding the socket with the entire session history.
const SCROLLBACK_MAX_BYTES = parseInt(process.env.PTY_SCROLLBACK_MAX ?? '131072', 10);

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
  const RESIZE_PREFIX  = '\x1b[?resize=';
  const RESTART_SEQ    = '\x1b[?ccrestart]';

  /**
   * Get the existing persistent PTY session for this sessionId, or create one.
   * The PTY's onData/onExit are bound ONCE here (at create) and route to the
   * session's CURRENT attachedWs — so a reconnect just swaps attachedWs and the
   * live `claude` keeps running. Returns the session entry, or null on spawn
   * failure (the caller closes the WS).
   */
  function getOrCreatePtySession(cols, rows) {
    let entry = ptySessions.get(sessionId);
    if (entry) return entry;

    let proc;
    try {
      proc = pty.spawn(SESSION_LAUNCHER, [SHELL_CMD, ...SHELL_ARGS], {
        name: 'xterm-256color',
        cols,
        rows,
        cwd: '/workspace',
        env: buildChildEnv(),
      });
    } catch (err) {
      console.error(`[pty#${connId}] Failed to spawn PTY:`, err.message);
      return null;
    }

    entry = {
      proc,
      sessionId,
      scrollback: '',
      attachedWs: null,        // set by the connection handler below
      killTimer: null,
      cols,
      rows,
      restartInProgress: false,
      dead: false,             // tombstone: once true, no callback may re-touch the map
    };
    ptySessions.set(sessionId, entry);
    console.log(`[pty#${connId}] Spawned PTY pid=${proc.pid} ${cols}x${rows} session=${sessionId}`);
    bindProcListeners(entry, proc);
    return entry;
  }

  /**
   * Bind onData/onExit for a specific proc instance to an entry. The closures
   * capture `proc` so a STALE callback (e.g. the old proc exiting late during a
   * restart, after `entry.proc` already points at the new one) is ignored — the
   * `entry.proc !== proc` guard makes the binding proc-scoped, not entry-scoped.
   * Called at spawn and again after a restart respawn.
   */
  function bindProcListeners(entry, proc) {
    // PTY → current client. We keep a capped scrollback so a reconnecting client
    // can restore its screen.
    proc.onData((data) => {
      if (entry.proc !== proc) return;            // stale proc (post-restart) — drop
      entry.scrollback = (entry.scrollback + data).slice(-SCROLLBACK_MAX_BYTES);
      const cur = entry.attachedWs;
      if (cur && cur.readyState === cur.OPEN) {
        try { cur.send(data); } catch { /* closing */ }
      }
    });

    proc.onExit(({ exitCode, signal }) => {
      // A restart kills the old proc and rebinds to a new one; the old proc's
      // exit must NOT tear down the entry. Three guards: `dead` (the entry was
      // already torn down / replaced — never touch the map again), the
      // proc-identity check (entry.proc has already advanced), and the
      // restartInProgress flag (covers the in-flight window before reassignment).
      if (entry.dead) return;
      if (entry.proc !== proc) return;
      if (entry.restartInProgress) return;
      console.log(`[pty] PTY exited code=${exitCode} signal=${signal} session=${sessionId}`);
      entry.dead = true;
      if (entry.killTimer) { clearTimeout(entry.killTimer); entry.killTimer = null; }
      // Only delete if THIS entry is still the one in the map (a replacement for
      // the same sessionId must not be clobbered).
      if (ptySessions.get(sessionId) === entry) ptySessions.delete(sessionId);
      const cur = entry.attachedWs;
      if (cur) { try { cur.close(1000, 'Session ended'); } catch { /* closed */ } }
    });
  }

  /** Kill a proc gracefully (SIGTERM → 3 s → SIGKILL), resolve when done. */
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
        clearTimeout(timer);
        if (!settled) { settled = true; resolve(); }
      }
    });
  }

  // ── Attach THIS WebSocket to the (new or existing) PTY session ───────────
  let session = null;               // the ptySessions entry, once known
  const inputBuffer = [];           // keystrokes received before the first resize/spawn

  function attachThisWs(entry) {
    session = entry;
    // Cancel any pending grace-kill — the client came back.
    if (entry.killTimer) { clearTimeout(entry.killTimer); entry.killTimer = null; }
    // If a different live WS is currently attached (a second tab is taking over),
    // close it so only ONE client drives the PTY. Without this the displaced tab
    // keeps sending input/resize/restart into the shared PTY. 4409 = "taken over
    // by a newer connection" (custom close code).
    const prev = entry.attachedWs;
    if (prev && prev !== ws) {
      try { prev.close(4409, 'Session taken over by a newer connection'); } catch { /* ignore */ }
    }
    entry.attachedWs = ws;
  }

  // ── WS → PTY (resize + restart control sequences) ────────────────────────
  ws.on('message', async (data) => {
    try {
      const str = Buffer.isBuffer(data) ? data.toString() : String(data);

      // Once attached to a session, only the CURRENTLY-attached WS may drive the
      // PTY. A displaced tab (a newer connection took over) must not resize,
      // restart, or inject input into the shared PTY. (Before the first resize
      // `session` is still null, so the spawn/attach path below runs normally.)
      if (session && session.attachedWs !== ws) return;

      // ── Resize (also the trigger that spawns / re-attaches the session) ────
      if (str.startsWith(RESIZE_PREFIX)) {
        try {
          const json = JSON.parse(str.slice(RESIZE_PREFIX.length));
          const cols = Number.isFinite(json.cols) ? Math.max(20, Math.min(500, Math.floor(json.cols))) : COLS;
          const rows = Number.isFinite(json.rows) ? Math.max(5,  Math.min(200, Math.floor(json.rows))) : ROWS;

          if (!session) {
            // First resize on this connection: spawn a fresh PTY, or RE-ATTACH to
            // an existing live one for this sessionId (reconnect / second tab).
            const existed = ptySessions.has(sessionId);
            const entry = getOrCreatePtySession(cols, rows);
            if (!entry) { ws.close(4500, 'Failed to start session'); return; }
            attachThisWs(entry);
            connections.set(connId, { ws, sessionId });

            if (existed) {
              // Re-attach: replay the captured screen so the client restores, then
              // resize to THIS client's geometry. The live claude is untouched.
              // Reset the terminal (ESC c) before replay so a reconnecting xterm
              // starts clean and the scrollback doesn't double-render over stale
              // content. Then nudge claude to repaint via a no-op resize.
              console.log(`[pty#${connId}] Re-attached to live session=${sessionId}`);
              if (entry.scrollback) {
                try { ws.send('\x1bc' + entry.scrollback); } catch { /* ignore */ }
              }
              try { entry.proc.resize(cols, rows); entry.cols = cols; entry.rows = rows; } catch { /* ignore */ }
            } else {
              entry.cols = cols; entry.rows = rows;
            }
            // Flush keystrokes queued before the session existed.
            for (const queued of inputBuffer.splice(0)) {
              try { entry.proc.write(queued); } catch { /* ignore */ }
            }
          } else {
            try { session.proc.resize(cols, rows); session.cols = cols; session.rows = rows; } catch { /* ignore */ }
          }
        } catch {
          // Not a valid resize payload; ignore
        }
        return; // Don't forward to PTY
      }

      // ── Restart (explicit "Restart session" — kills + respawns claude) ─────
      if (str === RESTART_SEQ) {
        if (!session || session.restartInProgress) return;
        const entry = session;
        entry.restartInProgress = true;
        console.log(`[pty#${connId}] Restart requested — killing current claude child`);
        const prevCols = entry.proc.cols || entry.cols;
        const prevRows = entry.proc.rows || entry.rows;
        // The old proc's onExit is guarded by both restartInProgress AND the
        // proc-identity check, so its (possibly late) exit can't tear us down.
        await killGracefully(entry.proc);

        let newProc;
        try {
          newProc = pty.spawn(SESSION_LAUNCHER, [SHELL_CMD, ...SHELL_ARGS], {
            name: 'xterm-256color', cols: prevCols, rows: prevRows, cwd: '/workspace', env: buildChildEnv(),
          });
        } catch (err) {
          // Respawn failed AFTER the old proc was killed — the session is dead.
          // Don't leave a map entry pointing at a dead proc (reconnects would
          // reattach to a corpse). Tombstone it so no later callback (the old
          // proc's late onExit, or detach()'s grace timer) can re-touch the map
          // and clobber a fresh replacement session for the same sessionId.
          console.error(`[pty#${connId}] Restart respawn failed:`, err.message);
          entry.dead = true;
          entry.restartInProgress = false;
          if (entry.killTimer) { clearTimeout(entry.killTimer); entry.killTimer = null; }
          if (ptySessions.get(sessionId) === entry) ptySessions.delete(sessionId);
          // Detach BEFORE closing so the close handler's detach() is a no-op
          // (its `session.attachedWs !== ws` guard fails) and no grace timer arms.
          const cur = entry.attachedWs;
          entry.attachedWs = null;
          if (cur) { try { cur.close(1011, 'Restart failed'); } catch { /* ignore */ } }
          return;
        }
        // Advance entry.proc to the new instance and rebind BEFORE clearing the
        // flag, so the proc-identity guard in bindProcListeners is armed and any
        // straggling old-proc callback is dropped.
        entry.proc = newProc;
        entry.scrollback = '';
        bindProcListeners(entry, newProc);
        entry.restartInProgress = false;
        console.log(`[pty#${connId}] Restarted — new pid=${newProc.pid}`);
        return;
      }

      // ── Normal input ──────────────────────────────────────────────────────
      if (!session) {
        inputBuffer.push(str);   // pre-spawn; drains on first resize
        return;
      }
      session.proc.write(str);
    } catch {
      // PTY may have exited; ignore
    }
  });

  // ── WS close/error → DETACH (do NOT kill the PTY) ───────────────────────
  // A transient WS drop must not lose the live claude session. Detach this WS
  // and start a grace timer; the PTY is killed only if no client re-attaches
  // within DETACH_GRACE_MS. A reconnect (attachThisWs) cancels the timer.
  function detach(why) {
    connections.delete(connId);
    if (!session) return;
    // A tombstoned entry was already torn down (e.g. respawn failure) — do NOT
    // arm a grace timer that could later delete a replacement for this sessionId.
    if (session.dead) return;
    // Only detach if WE are the currently-attached client (a newer tab may have
    // already taken over).
    if (session.attachedWs !== ws) return;
    session.attachedWs = null;
    if (session.killTimer) clearTimeout(session.killTimer);
    const entry = session;
    entry.killTimer = setTimeout(() => {
      entry.killTimer = null;
      // Still nobody attached after the grace period → reap the session, but
      // only if this exact entry is still live and still the one in the map.
      if (entry.dead || entry.attachedWs) return;
      console.log(`[pty] grace expired (${why}) — killing idle session=${sessionId}`);
      entry.dead = true;
      // Delete on confirmed exit (proc onExit handles it), but also kill now.
      try { entry.proc.kill(); } catch { /* already dead */ }
      if (ptySessions.get(sessionId) === entry) ptySessions.delete(sessionId);
    }, DETACH_GRACE_MS);
  }

  ws.on('close', (code, reason) => {
    console.log(`[pty#${connId}] WS closed code=${code} reason=${reason?.toString()} — detaching (PTY survives)`);
    detach('ws-close');
  });

  ws.on('error', (err) => {
    console.error(`[pty#${connId}] WS error:`, err.message);
    detach('ws-error');
  });
});

wss.on('error', (err) => {
  console.error('[pty] WSS server error:', err.message);
  process.exit(1);
});

// Graceful shutdown — kill every persistent PTY and close every socket.
process.on('SIGTERM', () => {
  console.log('[pty] SIGTERM — shutting down');
  for (const [sid, entry] of ptySessions) {
    console.log(`[pty] Killing session=${sid}`);
    if (entry.killTimer) { try { clearTimeout(entry.killTimer); } catch { /* ignore */ } }
    try { entry.proc.kill(); } catch { /* ignore */ }
  }
  // Close ALL clients (including not-yet-attached or displaced sockets that
  // aren't in ptySessions) so wss.close() can actually drain.
  for (const client of wss.clients) {
    try { client.close(1001, 'Server shutting down'); } catch { /* ignore */ }
  }
  wss.close(() => process.exit(0));
  // Hard fallback: never let a stuck socket block the shutdown indefinitely.
  setTimeout(() => process.exit(0), 5000);
});
