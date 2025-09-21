#!/usr/bin/env bash
set -Eeuo pipefail

PORT=${PORT:-3005}
TOKEN=${CF_TUNNEL_TOKEN:-"eyJhIjoiMzE2YzE3OWMwMDkzOTVjY2ZiY2QxNDU0NjFlOGJmMjQiLCJ0IjoiZDY5ZjA3ODEtNDkwMC00YjM1LWFlMWMtZjUzZGQyMDJkMDg5IiwicyI6Ik5HVXlOak5pTWpBdE5UZ3daaTAwWVRJMUxUazBZVGd0TW1GaE16QmhPR1kxTkRJeSJ9"}

cleanup() {
  trap - EXIT INT TERM
  if [[ -n "${DEV_PID:-}" ]] && kill -0 "$DEV_PID" 2>/dev/null; then
    kill "$DEV_PID" 2>/dev/null || true
  fi
  if [[ -n "${TUNNEL_PID:-}" ]] && kill -0 "$TUNNEL_PID" 2>/dev/null; then
    kill "$TUNNEL_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starting Next.js dev server on port ${PORT}..."
PORT="$PORT" npm run dev &
DEV_PID=$!

echo "Opening Cloudflare tunnel..."
cloudflared tunnel run --token "$TOKEN" &
TUNNEL_PID=$!

wait -n "$DEV_PID" "$TUNNEL_PID"
EXIT_CODE=$?
cleanup
# Wait for remaining background processes to exit quietly
wait "$DEV_PID" "$TUNNEL_PID" 2>/dev/null || true
exit "$EXIT_CODE"
