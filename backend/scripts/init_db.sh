#!/bin/bash

echo "🗄️  Initializing Database..."
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  No .env file found, using default values"
    export DB_HOST=localhost
    export DB_PORT=5432
    export DB_USER=postgres
    export DB_PASSWORD=postgres
    export DB_NAME=moneymanager
fi

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL client (psql) not found. Please install PostgreSQL."
    exit 1
fi

echo "📊 Database Configuration:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Test connection
echo "🔌 Testing database connection..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1;" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Cannot connect to PostgreSQL server"
    echo "   Please ensure PostgreSQL is running and credentials are correct"
    exit 1
fi

echo "✅ Database connection successful"
echo ""

# Create database if it doesn't exist
echo "📦 Creating database if not exists..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database '$DB_NAME' created"
else
    echo "ℹ️  Database '$DB_NAME' already exists"
fi

echo ""
echo "🔧 Running schema initialization..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema initialized successfully"
else
    echo "❌ Error initializing schema"
    exit 1
fi

echo ""
echo "🔄 Running investment table migration..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/migrate_investments.sql

if [ $? -eq 0 ]; then
    echo "✅ Investment table migrated successfully"
else
    echo "❌ Error migrating investment table"
    exit 1
fi

echo ""
echo "🎯 Running goals table migration..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/migrate_goals.sql

if [ $? -eq 0 ]; then
    echo "✅ Goals table migrated successfully"
else
    echo "❌ Error migrating goals table"
    exit 1
fi

echo ""
echo "📅 Running half-yearly migration..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/migrate_half_yearly.sql

if [ $? -eq 0 ]; then
    echo "✅ Half-yearly migration completed successfully"
else
    echo "❌ Error running half-yearly migration"
    exit 1
fi

echo ""
echo "💰 Running salary table migration..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/migrate_salary.sql

if [ $? -eq 0 ]; then
    echo "✅ Salary table migrated successfully"
else
    echo "❌ Error migrating salary table"
    exit 1
fi

echo ""
echo "💰 Updating salary payment types..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/update_salary_payment_types.sql

if [ $? -eq 0 ]; then
    echo "✅ Salary payment types updated successfully"
else
    echo "❌ Error updating salary payment types"
    exit 1
fi

echo ""
echo "✨ Database initialization complete!"
echo ""
echo "You can now start the application with: ./start.sh"
echo ""

