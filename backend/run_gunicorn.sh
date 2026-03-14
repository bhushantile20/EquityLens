#!/bin/bash

# ── Paths (must match your Azure VM clone location) ──────────
PROJECT_DIR="/home/azureuser/equity-lens/backend"
SOCK_FILE="$PROJECT_DIR/equitylens.sock"
LOG_DIR="/home/azureuser/equity-lens/logs"

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
