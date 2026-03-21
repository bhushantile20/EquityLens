#!/bin/bash

# ── Paths (calculated relative to this script) ──────────
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR"
SOCK_FILE="$PROJECT_DIR/equitylens.sock"
LOG_DIR="$(dirname "$PROJECT_DIR")/logs"

# ── Make sure log directory exists ───────────────────────────
mkdir -p "$LOG_DIR"

cd "$PROJECT_DIR"
source venv/bin/activate

gunicorn equitylens.wsgi:application \
    --bind unix:"$SOCK_FILE" \
    --workers 3 \
    --threads 2 \
    --worker-class sync \
    --timeout 120 \
    --max-requests 500 \
    --max-requests-jitter 50 \
    --log-level info \
    --access-logfile "$LOG_DIR/gunicorn_access.log" \
    --error-logfile "$LOG_DIR/gunicorn_error.log"
