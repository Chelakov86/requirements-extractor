#!/usr/bin/env bash
# Run backend + frontend locally without Docker.
# SQLite is used by default — no database setup needed.
#
# Prerequisites:
#   cd backend && pip install -e ".[dev]"
#   cd frontend && npm install
#
# Usage: ./dev.sh

set -e

ROOT=$(cd "$(dirname "$0")" && pwd)

cleanup() {
  echo ""
  echo "Stopping…"
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting backend  → http://localhost:8000"
cd "$ROOT/backend"
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

echo "Starting frontend → http://localhost:3000"
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID"
