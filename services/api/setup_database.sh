#!/bin/bash

echo "============================================================"
echo "  CUB Platform - Database Setup"
echo "============================================================"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed"
    echo "Please install PostgreSQL and try again"
    exit 1
fi

echo "✅ PostgreSQL found"
echo ""

# Database configuration
DB_NAME="cub_database"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

echo "📊 Database Configuration:"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo ""

# Create database
echo "Creating database '$DB_NAME'..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -c "CREATE DATABASE $DB_NAME;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database created successfully"
else
    echo "⚠️  Database may already exist (this is OK)"
fi

echo ""
echo "Running database schema..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f database_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully"
else
    echo "❌ Failed to create database schema"
    exit 1
fi

echo ""
echo "============================================================"
echo "✅ Database setup complete!"
echo "============================================================"
echo ""
echo "Next steps:"
echo "  1. Update .env file with your database credentials"
echo "  2. Install Python dependencies: pip install -r requirements.txt"
echo "  3. Start the backend: python main.py"
echo ""
