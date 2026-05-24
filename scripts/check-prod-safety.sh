#!/bin/bash
# CI grep gate: fail if mock-mode env vars are read directly in non-test source files.
# Files should import IS_MOCK from src/lib/mock.ts (which has the production guard)
# rather than reading process.env.USE_MOCK_DATA etc. directly.

set -e

# These env var patterns are dangerous when read directly — they bypass the IS_MOCK guard
RAW_ENV_PATTERNS=("USE_MOCK_DATA" "NEXT_PUBLIC_MOCK_MODE" "NEXT_PUBLIC_USE_MOCK_DATA")
EXCLUDE_DIRS="--exclude-dir=__tests__ --exclude-dir=e2e --exclude-dir=node_modules --exclude-dir=.next"
EXCLUDE_FILES="--exclude=*.mock.ts --exclude=*.test.ts --exclude=*.spec.ts --exclude=check-prod-safety.sh"

FOUND=0

# Check for raw env var reads (these bypass the IS_MOCK guard in src/lib/mock.ts)
for pattern in "${RAW_ENV_PATTERNS[@]}"; do
  results=$(grep -r "process\.env\.$pattern\|NEXT_PUBLIC_$pattern" src/ $EXCLUDE_DIRS $EXCLUDE_FILES --include="*.ts" --include="*.tsx" -l 2>/dev/null || true)
  # Allow src/lib/mock.ts itself — that's the definition file
  results=$(echo "$results" | grep -v "src/lib/mock.ts" || true)
  # Allow next.config.ts — that's the build-time guard
  results=$(echo "$results" | grep -v "next.config.ts" || true)
  if [ -n "$results" ]; then
    echo "ERROR: Direct env var read of '$pattern' found outside of src/lib/mock.ts."
    echo "       Use 'import { IS_MOCK } from \"\@/lib/mock\"' instead."
    echo "$results"
    FOUND=1
  fi
done

if [ $FOUND -eq 1 ]; then
  echo ""
  echo "FAIL: Raw mock env vars read directly in production code — these bypass the IS_MOCK production guard."
  echo "      Replace with: import { IS_MOCK } from '@/lib/mock'"
  exit 1
else
  echo "PASS: No raw mock env var reads found outside src/lib/mock.ts."
fi
