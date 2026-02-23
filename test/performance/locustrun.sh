#!/usr/bin/env bash
# To run in terminal from project root, use this pattern: ./test/performance/locustrun.sh, 
# or to set params. use i.e. USERS=250 SPAWN_RATE=25 DURATION=10m ./test/performance/locustrun.sh

set -euo pipefail

# -----------------------------
# Config (override via env vars)
# -----------------------------
USERS="${USERS:-100}"
SPAWN_RATE="${SPAWN_RATE:-10}"
DURATION="${DURATION:-5m}"
HOST="${HOST:-http://127.0.0.1:8080}"
LOCUST_FILE="${LOCUST_FILE:-test/performance/locustfile.py}"

# -----------------------------
# Validation
# -----------------------------
if [[ ! -f "$LOCUST_FILE" ]]; then
  echo "Locust file not found: $LOCUST_FILE"
  exit 1
fi

echo "Starting load test"
echo "Users:        $USERS"
echo "Spawn Rate:   $SPAWN_RATE"
echo "Duration:     $DURATION"
echo "Target Host:  $HOST"
echo "Locust File:  $LOCUST_FILE"
echo "----------------------------------"

# -----------------------------
# Run Locust
# -----------------------------
python -m locust \
  -f "$LOCUST_FILE" \
  --headless \
  -u "$USERS" \
  -r "$SPAWN_RATE" \
  -t "$DURATION" \
  --host "$HOST"