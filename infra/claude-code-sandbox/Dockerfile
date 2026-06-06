# hackproduct-cc-sandbox — Claude Code Analytics session container.
#
# Reconstructed 2026-06-02 from the live image registry.fly.io/hackproduct-cc-sandbox:mvp
# (sha256:6f4d78e2…) after the original source was lost from git. Runtime facts
# verified against the running machine: Debian 12 bookworm, Node 20.20.2,
# claude 2.1.136, gcloud SDK at /opt/google-cloud-sdk, PTY/WSS server on :7681,
# non-root `analyst` user.
#
# Host-agnostic: runs identically on Fly, Cloud Run, or GKE. The orchestrator
# injects all config via env at create time (see entrypoint.sh / entrypoint-pty.js).

FROM node:20-bookworm-slim

# ── System packages: bq needs python3; curl/tar for tarball + autosave; ca-certs;
#    ripgrep (Claude Code's search depends on `rg`); util-linux for `ionice`.
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl ca-certificates tar gzip python3 bash ripgrep util-linux \
    && rm -rf /var/lib/apt/lists/*

# ── Google Cloud SDK (provides the `bq` CLI used by the BigQuery MCP server).
ENV CLOUDSDK_INSTALL_DIR=/opt
RUN curl -fsSL https://sdk.cloud.google.com | bash -s -- --disable-prompts --install-dir=/opt \
    && /opt/google-cloud-sdk/bin/gcloud --version
ENV PATH=/opt/google-cloud-sdk/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# ── Claude Code CLI (pinned; never auto-update inside an ephemeral container).
ENV DISABLE_AUTOUPDATER=1
RUN npm install -g @anthropic-ai/claude-code@2.1.136

# ── PTY/WSS bridge deps (node-pty needs build tools at install, then drop them).
WORKDIR /
COPY package.json package-lock.json* ./
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && npm install --omit=dev \
    && apt-get purge -y make g++ && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

# ── App files.
COPY entrypoint-pty.js /entrypoint-pty.js
COPY entrypoint.sh /entrypoint.sh
COPY bq-mcp /usr/local/bin/bq-mcp
COPY bq-mcp-server.js /usr/local/bin/bq-mcp-server.js
COPY session-launch /usr/local/bin/session-launch
RUN chmod +x /entrypoint.sh /usr/local/bin/bq-mcp /usr/local/bin/session-launch

# ── Non-root analyst user + writable workspace + secrets dir.
#    The rootfs is mounted READ-ONLY at runtime (gVisor + `--read-only` on the
#    host). Everything the session writes lives under these dirs, which the
#    orchestrator backs with writable tmpfs mounts:
#      /workspace                 session files (graded, ephemeral)
#      /home/analyst/.claude      settings, skills the user authors
#      /home/analyst/.cache, /tmp scratch
#    Run flags (Cloud Run / docker): --read-only --tmpfs /tmp --tmpfs
#    /home/analyst/.cache  and a writable volume/emptyDir for /workspace +
#    /home/analyst/.claude.
RUN useradd -m -u 1100 -s /bin/bash analyst \
    && mkdir -p /workspace /secrets /home/analyst/.claude/skills /home/analyst/.cache \
    && chown -R analyst:analyst /workspace /secrets /home/analyst
COPY --chown=analyst:analyst workspace-CLAUDE.md /workspace/CLAUDE.md

USER analyst
EXPOSE 7681
ENTRYPOINT ["/entrypoint.sh"]
