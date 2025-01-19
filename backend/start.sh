#!/bin/sh

# Wait for database
echo "Waiting for database..."
until pg_isready -h db -U postgres; do
  echo "Database is unavailable - sleeping"
  sleep 1
done

# Create database if it doesn't exist
echo "Ensuring database exists..."
PGPASSWORD=postgres psql -h db -U postgres -d postgres -c "SELECT 1 FROM pg_database WHERE datname = 'ragqa'" | grep -q 1 || PGPASSWORD=postgres psql -h db -U postgres -d postgres -c "CREATE DATABASE ragqa"

# Create migrations
echo "Creating migrations..."
python manage.py makemigrations

# Apply migrations
echo "Applying migrations..."
python manage.py migrate

# Create vector extension
echo "Creating vector extension..."
PGPASSWORD=postgres psql -h db -U postgres -d ragqa -c 'CREATE EXTENSION IF NOT EXISTS vector;'

# Start the application
echo "Starting application..."
exec gunicorn ragqa.wsgi:application --bind 0.0.0.0:8000 --reload
