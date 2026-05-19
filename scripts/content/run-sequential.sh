#!/usr/bin/env bash
# Runs each pending module one at a time via claude subagent.
# Between each module, the claude subprocess exits cleanly — no shared context.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

set -a
source "${REPO_ROOT}/.env.local"
set +a

MODULES=(
  caching-strategies
  message-queues-streaming
  reliability-sre-concepts
  storage-systems-tradeoffs
  api-gateway-service-mesh
  llm-internals-attention
  rag-architecture
  embeddings-deep-dive
  fine-tuning-in-practice
  llm-evaluation
  agentic-systems-design
  prompt-engineering-advanced
  agent-memory-systems
  subagents-orchestration
  claude-code-mastery
  harness-engineering
  ai-coding-assistants
  agentic-workflows-production
  mcp-server-building
  flow-framework
  user-mental-models
  root-cause-analysis
  metrics-for-engineers
  prioritization-frameworks
  product-sense-for-engineers
  technical-strategy
  advanced-sql-patterns
  system-design-deep-cuts
  llm-inference-serving
  security-for-engineers
)

LOG="/tmp/pipeline-sequential.log"
echo "=== Sequential pipeline start $(date) ===" | tee -a "$LOG"

for slug in "${MODULES[@]}"; do
  chapter_dir="${SCRIPT_DIR}/chapters/${slug}"
  if [ -d "$chapter_dir" ]; then
    count=$(ls "$chapter_dir" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$count" -gt 0 ]; then
      echo "[skip] ${slug} already has ${count} chapters" | tee -a "$LOG"
      continue
    fi
  fi

  echo "" | tee -a "$LOG"
  echo "=== [$(date +%H:%M:%S)] Running module: ${slug} ===" | tee -a "$LOG"

  MODULE_SLUG="${slug}" npx ts-node --esm "${SCRIPT_DIR}/run-pipeline.ts" 2>&1 | tee -a "$LOG"
  exit_code=${PIPESTATUS[0]}

  if [ $exit_code -ne 0 ]; then
    echo "[ERROR] ${slug} failed with exit code ${exit_code}" | tee -a "$LOG"
    echo "[INFO] Waiting 60s before next module..." | tee -a "$LOG"
    sleep 60
  else
    echo "[done] ${slug}" | tee -a "$LOG"
    # Brief pause between modules to avoid hammering rate limits
    echo "[wait] 15s cooldown..." | tee -a "$LOG"
    sleep 15
  fi
done

echo "" | tee -a "$LOG"
echo "=== Sequential pipeline complete $(date) ===" | tee -a "$LOG"
