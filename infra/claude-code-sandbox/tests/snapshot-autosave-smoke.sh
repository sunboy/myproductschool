#!/usr/bin/env bash
# Run inside the built sandbox image so this exercises /entrypoint.sh itself:
#   docker run --rm --entrypoint bash \
#     -v "$PWD/infra/claude-code-sandbox/tests/snapshot-autosave-smoke.sh:/tmp/snapshot-autosave-smoke.sh:ro" \
#     IMAGE_DIGEST /tmp/snapshot-autosave-smoke.sh
#
# The only HTTP endpoint is a loopback stub. Its first workspace response is a
# deliberate 503, which makes the real curl command retry the same archive.

set -euo pipefail

fail() {
  echo "snapshot autosave smoke: FAIL: $*" >&2
  exit 1
}

SMOKE_DIR=$(mktemp -d /tmp/snapshot-autosave-smoke-XXXXXX)
STUB_PID=''
ENTRYPOINT_PID=''

cleanup() {
  if [[ -n "$ENTRYPOINT_PID" ]]; then
    kill -TERM "$ENTRYPOINT_PID" 2>/dev/null || true
    wait "$ENTRYPOINT_PID" 2>/dev/null || true
  fi
  if [[ -n "$STUB_PID" ]]; then
    kill -TERM "$STUB_PID" 2>/dev/null || true
    wait "$STUB_PID" 2>/dev/null || true
  fi
  rm -rf "$SMOKE_DIR"
}
trap cleanup EXIT INT TERM

[[ -x /entrypoint.sh ]] || fail '/entrypoint.sh is missing from the image'
[[ -x /usr/bin/tar ]] || fail '/usr/bin/tar is missing from the image'

mkdir -p "$SMOKE_DIR/bin" "$HOME/.claude/skills/smoke" /workspace
printf '%s\n' 'workspace capture sentinel' > /workspace/smoke-report.md
printf '%s\n' '# Smoke skill' '' 'Portable state capture sentinel.' > "$HOME/.claude/skills/smoke/SKILL.md"

# Record the instant at which the real entrypoint invokes tar. The wrapper then
# delegates unchanged to the image's tar binary.
cat > "$SMOKE_DIR/bin/tar" <<'TAR_WRAPPER'
#!/usr/bin/env bash
set -euo pipefail
kind=other
case " $* " in
  *" -C / workspace "*) kind=workspace ;;
  *"/tmp/userstate-"*) kind=user-state ;;
esac
printf '%s\t%s\n' "$kind" "$(date +%s%3N)" >> "$SMOKE_TAR_EVENTS"
exec /usr/bin/tar "$@"
TAR_WRAPPER
chmod +x "$SMOKE_DIR/bin/tar"

# Store only provenance headers and request timing; never persist Authorization.
cat > "$SMOKE_DIR/stub.py" <<'PYTHON_STUB'
import http.server
import os
import time

root = os.environ['SMOKE_DIR']
counts = {'workspace': 0, 'user-state': 0}


class Handler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        kind = self.path.strip('/')
        if kind not in counts:
            self.send_response(404)
            self.end_headers()
            return

        counts[kind] += 1
        attempt = counts[kind]
        body = self.rfile.read(int(self.headers.get('content-length', '0')))
        prefix = os.path.join(root, f'{kind}-{attempt}')
        with open(prefix + '.tar.gz', 'wb') as archive:
            archive.write(body)
        with open(prefix + '.headers', 'w', encoding='utf-8') as metadata:
            metadata.write(f"version={self.headers.get('x-snapshot-provenance-version', '')}\n")
            metadata.write(f"started={self.headers.get('x-snapshot-capture-started-at', '')}\n")
            metadata.write(f"capture_id={self.headers.get('x-snapshot-capture-id', '')}\n")
            metadata.write(f"received={time.time_ns() // 1_000_000}\n")

        self.send_response(503 if kind == 'workspace' and attempt == 1 else 204)
        self.send_header('Content-Length', '0')
        self.end_headers()
        with open(prefix + '.done', 'w', encoding='utf-8'):
            pass

    def log_message(self, _format, *_args):
        return


http.server.ThreadingHTTPServer(('127.0.0.1', 18080), Handler).serve_forever()
PYTHON_STUB

SMOKE_DIR="$SMOKE_DIR" python3 "$SMOKE_DIR/stub.py" &
STUB_PID=$!

# Wait until the loopback listener is ready without making an HTTP request that
# could be confused with an autosave attempt.
for _ in $(seq 1 50); do
  if python3 - <<'PYTHON_READY'
import socket
sock = socket.socket()
sock.settimeout(0.1)
try:
    sock.connect(('127.0.0.1', 18080))
except OSError:
    raise SystemExit(1)
finally:
    sock.close()
PYTHON_READY
  then
    break
  fi
  sleep 0.1
done
kill -0 "$STUB_PID" 2>/dev/null || fail 'loopback stub did not start'

export PATH="$SMOKE_DIR/bin:$PATH"
export SMOKE_TAR_EVENTS="$SMOKE_DIR/tar-events.tsv"
export ORCHESTRATOR_SNAPSHOT_URL='http://127.0.0.1:18080/workspace'
export USER_STATE_SNAPSHOT_URL='http://127.0.0.1:18080/user-state'
export SNAPSHOT_AUTH_TOKEN='smoke-token'
export SESSION_TOKEN_SECRET='smoke-session-secret'
export ANTHROPIC_API_KEY=''
export SHELL_CMD='/bin/bash'

/entrypoint.sh > "$SMOKE_DIR/entrypoint.log" 2>&1 &
ENTRYPOINT_PID=$!

deadline=$((SECONDS + 42))
while [[ ! -f "$SMOKE_DIR/workspace-2.done" || ! -f "$SMOKE_DIR/user-state-1.done" ]]; do
  if (( SECONDS >= deadline )); then
    tail -n 30 "$SMOKE_DIR/entrypoint.log" >&2 || true
    fail 'autosaves did not complete within 42 seconds'
  fi
  kill -0 "$ENTRYPOINT_PID" 2>/dev/null || fail 'entrypoint exited before autosave'
  sleep 0.2
done

header_value() {
  local key=$1 file=$2
  sed -n "s/^${key}=//p" "$file"
}

workspace_started_1=$(header_value started "$SMOKE_DIR/workspace-1.headers")
workspace_started_2=$(header_value started "$SMOKE_DIR/workspace-2.headers")
workspace_id_1=$(header_value capture_id "$SMOKE_DIR/workspace-1.headers")
workspace_id_2=$(header_value capture_id "$SMOKE_DIR/workspace-2.headers")
workspace_received=$(header_value received "$SMOKE_DIR/workspace-2.headers")
workspace_tar_started=$(awk -F '\t' '$1 == "workspace" { print $2; exit }' "$SMOKE_TAR_EVENTS")

[[ $(header_value version "$SMOKE_DIR/workspace-1.headers") == 2 ]] || fail 'workspace v2 header missing'
[[ "$workspace_started_1" =~ ^[0-9]{13}$ ]] || fail 'workspace capture-start header is invalid'
[[ "$workspace_tar_started" =~ ^[0-9]{13}$ ]] || fail 'workspace tar invocation time is invalid'
[[ "$workspace_received" =~ ^[0-9]{13}$ ]] || fail 'workspace receipt time is invalid'
[[ -n "$workspace_id_1" ]] || fail 'workspace capture id is missing'
[[ "$workspace_started_1" == "$workspace_started_2" ]] || fail 'workspace retry changed capture-start time'
[[ "$workspace_id_1" == "$workspace_id_2" ]] || fail 'workspace retry changed capture identity'
[[ "$workspace_started_1" -le "$workspace_tar_started" ]] || fail 'workspace timestamp was not captured before tar'
[[ "$workspace_tar_started" -le "$workspace_received" ]] || fail 'workspace archive arrived before tar invocation'
cmp -s "$SMOKE_DIR/workspace-1.tar.gz" "$SMOKE_DIR/workspace-2.tar.gz" \
  || fail 'workspace retry body changed'
/usr/bin/tar -tzf "$SMOKE_DIR/workspace-2.tar.gz" | grep -qx 'workspace/smoke-report.md' \
  || fail 'workspace archive is not a valid gzip tar with the sentinel'

state_started=$(header_value started "$SMOKE_DIR/user-state-1.headers")
state_received=$(header_value received "$SMOKE_DIR/user-state-1.headers")
state_tar_started=$(awk -F '\t' '$1 == "user-state" { print $2; exit }' "$SMOKE_TAR_EVENTS")
[[ $(header_value version "$SMOKE_DIR/user-state-1.headers") == 2 ]] || fail 'user-state v2 header missing'
[[ "$state_started" =~ ^[0-9]{13}$ ]] || fail 'user-state capture-start header is invalid'
[[ "$state_tar_started" =~ ^[0-9]{13}$ ]] || fail 'user-state tar invocation time is invalid'
[[ "$state_received" =~ ^[0-9]{13}$ ]] || fail 'user-state receipt time is invalid'
[[ -n $(header_value capture_id "$SMOKE_DIR/user-state-1.headers") ]] || fail 'user-state capture id is missing'
[[ "$state_started" -le "$state_tar_started" ]] || fail 'user-state timestamp was not captured before tar'
[[ "$state_tar_started" -le "$state_received" ]] || fail 'user-state archive arrived before tar invocation'
/usr/bin/tar -tzf "$SMOKE_DIR/user-state-1.tar.gz" | grep -qx '.claude/skills/smoke/SKILL.md' \
  || fail 'user-state archive is not a valid gzip tar with the portable skill'

echo 'snapshot autosave smoke: PASS (workspace retry identity, pre-tar timestamps, gzip archives)'
