#!/bin/bash
# ==============================================================
# EquityLens – Azure Deployment Script
# Usage:  bash deploy.sh
# Run this from: /home/azureuser/equity-lens/
# ==============================================================
set -e   # exit immediately if any command fails

PROJECT_DIR="/home/azureuser/EquityLens"
APP_NAME="equitylens"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   EquityLens  →  Deploying to Azure      ║"
echo "╚══════════════════════════════════════════╝"
echo ""

cd "$PROJECT_DIR"

# ── 1. Pull latest code ──────────────────────────────────────
echo "📥  Pulling latest code from GitHub..."
git pull origin main

# ── 2. Backend setup ─────────────────────────────────────────
echo ""
echo "🐍  Setting up Django backend..."
cd "$PROJECT_DIR/backend"

# Create venv only if it does not already exist
if [ ! -d "venv" ]; then
    echo "    Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "    Installing Python packages..."
pip install -r requirements.txt --quiet

echo "    Running database migrations..."
python manage.py migrate --no-input

echo "    Creating demo user account..."
python manage.py create_demo_user

echo "    Collecting static files..."
python manage.py collectstatic --no-input --clear

deactivate

# ── 3. Frontend build ─────────────────────────────────────────
echo ""
echo "⚛️   Building React frontend..."
cd "$PROJECT_DIR/frontend"
npm install --silent
npm run build        # .env.production is used automatically

# ── 4. Restart services ───────────────────────────────────────
echo ""
echo "🔄  Restarting services..."

# Restart the Django gunicorn process via PM2
pm2 restart "$APP_NAME" 2>/dev/null || pm2 start "$PROJECT_DIR/backend/run_gunicorn.sh" --name "$APP_NAME"
pm2 save

# Reload Nginx (gracefully, zero downtime)
sudo systemctl reload nginx

echo ""
echo "✅  Deployment complete! → https://equitylens.bhushantile.online"
echo ""
