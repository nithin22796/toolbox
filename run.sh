#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

trap 'kill 0' EXIT

(cd backend && source .venv/bin/activate && uvicorn main:app --port 8000 --reload) &
(cd frontend && npm run dev) &

wait
