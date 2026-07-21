#!/usr/bin/env bash
# ローカルE2E実行: mock-citras と api を起動し、e2e/run.mjs を実行して後始末する。
set -uo pipefail
cd "$(dirname "$0")/.."

export DATABASE_URL="${DATABASE_URL:-postgres://museum:museum@127.0.0.1:5432/lost_museum}"
export REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379}"
export MOCK_CITRAS_URL="${MOCK_CITRAS_URL:-http://localhost:4100}"
export WEBHOOK_SECRET="${WEBHOOK_SECRET:-mock-citras-secret}"
export JWT_SECRET="${JWT_SECRET:-dev-secret}"
export GAME_WEBHOOK_URL="${GAME_WEBHOOK_URL:-http://localhost:4000/api/v1/webhooks/work-completed}"
# E2Eは多数のアクションを短時間に実行するためレート上限を緩和（本番は既定の10/分）
export RATE_LIMIT_PER_MINUTE="${RATE_LIMIT_PER_MINUTE:-1000}"

MOCK_PID=""
API_PID=""
cleanup() {
  [ -n "$API_PID" ] && kill "$API_PID" 2>/dev/null
  [ -n "$MOCK_PID" ] && kill "$MOCK_PID" 2>/dev/null
  wait 2>/dev/null
}
trap cleanup EXIT

( cd mock-citras && PORT=4100 exec npx tsx src/server.ts ) > /tmp/mock.log 2>&1 &
MOCK_PID=$!
( cd apps/api && PORT=4000 exec npx tsx src/server.ts ) > /tmp/api.log 2>&1 &
API_PID=$!

for i in $(seq 1 40); do
  if curl -sf http://localhost:4000/health >/dev/null 2>&1 && curl -sf http://localhost:4100/health >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

node e2e/run.mjs
exit $?
