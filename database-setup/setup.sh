#!/bin/bash

echo "🗄️ Setting up School Management Database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Installing..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
fi

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database if it doesn't exist
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw school_management; then
    echo "📊 Creating database..."
    sudo -u postgres createdb school_management
    echo "✅ Database created successfully"
else
    echo "📊 Database already exists"
fi

# Import schema
echo "📋 Importing database schema..."
sudo -u postgres psql -d school_management -f database/schema.sql

echo "✅ Database setup completed!"
echo "📊 Database: school_management"
echo "👤 User: postgres"
echo "🔌 Port: 5432"
