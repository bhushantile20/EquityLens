#!/bin/bash

cd /home/azureuser/equity-lens/backend
source venv/bin/activate

gunicorn \
--workers 3 \
--threads 2 \
--bind unix:/home/azureuser/equity-lens/backend/equitylens.sock \
equitylens.wsgi:application
