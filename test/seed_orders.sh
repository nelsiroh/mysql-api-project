#!/usr/bin/env bash
# Run using pattern: ./orders_generator.sh or setting env i.e. DB_HOST=192.168.1.10 ./orders_generator.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-rootpasswd}"
DB_NAME="${DB_NAME:-coffeedb}"
NUM_ORDERS="${1:-50}"
TAX_RATE="${TAX_RATE:-0.0825}"
DB_PORT="${DB_PORT:-3306}"

export DB_HOST DB_USER DB_PASSWORD DB_NAME NUM_ORDERS TAX_RATE DB_PORT

echo "Generating ${NUM_ORDERS} orders into ${DB_NAME}..."

python "${SCRIPT_DIR}/orders_generator.py"