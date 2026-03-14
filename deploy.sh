#!/bin/bash

# Configuration
PROJECT_DIR="/home/azureuser/equity-lens"
APP_NAME="equitylens"

echo "🚀 Starting deployment..."

cd $PROJECT_DIR
git pull origin main

# Backend
echo "🐍 Setting up backend..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
chmod +x run_gunicorn.sh
python manage.py migrate
python manage.py collectstatic --no-input
deactivate

# Frontend
echo "⚛️ Setting up frontend..."
cd ../frontend
npm install
npm run build

# Restart Services
echo "🔄 Restarting services..."
pm2 restart all || pm2 start ../backend/run_gunicorn.sh --name $APP_NAME

sudo systemctl restart nginx

echo "✅ Deployment complete!"
