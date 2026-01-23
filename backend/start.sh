#!/bin/bash
set -e

# Run database migrations
echo "Running migrations..."
alembic upgrade head

# Start the application
echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
