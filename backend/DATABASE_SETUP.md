# Database Setup Guide

This guide will help you set up the PostgreSQL database for the Money Manager application.

## Prerequisites

- PostgreSQL installed and running
- PostgreSQL client tools (psql)

## Quick Setup

### 1. Configure Database Connection

Copy the example environment file and update with your database credentials:

```bash
cd backend
cp .env.example .env
```

Edit `.env` file with your PostgreSQL credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=moneymanager
PORT=8080
```

### 2. Initialize Database

You have two options for initializing the database:

#### Option A: Using Go CLI Tool (Recommended)

```bash
cd backend
go run cmd/initdb/main.go
```

This will:
- Test the database connection
- Create all required tables and indexes
- Run necessary migrations
- Verify the schema
- Display database statistics

Additional commands:
```bash
# Verify schema only
go run cmd/initdb/main.go -verify

# Show database statistics
go run cmd/initdb/main.go -stats

# Run migrations only
go run cmd/initdb/main.go -migrate

# Use custom .env file
go run cmd/initdb/main.go -env=/path/to/.env
```

#### Option B: Using Shell Script

```bash
cd backend
./scripts/init_db.sh
```

This script will:
- Test the database connection
- Create the `moneymanager` database if it doesn't exist
- Run schema initialization
- Apply migrations

### 3. Start the Application

After database initialization, start the application:

```bash
cd ..
./start.sh
```

## Manual Setup (Alternative)

If you prefer to set up manually:

### 1. Create Database

```bash
psql -U postgres
CREATE DATABASE moneymanager;
\q
```

### 2. Run the Application

The Go application will automatically create the schema on first run:

```bash
cd backend
go run cmd/api/main.go
```

### 3. Load Seed Data

In a separate terminal:

```bash
cd backend
psql -U postgres -d moneymanager -f scripts/seed.sql
```

## Database Schema

The application creates the following tables:

### Core Tables
- `users` - User accounts
- `transactions` - Income and expense transactions
- `user_preferences` - User settings and preferences

### Financial Data Tables
- `total_spendings` - Weekly/monthly spending aggregates
- `savings` - Savings data over time
- `investments` - Investment portfolio data

## Seed Data

The seed data includes:

- **Demo User**: `demo@example.com`
- **Transactions**: Sample income and expenses
- **Total Spendings**: 7 months of data ($580 - $850 range)
- **Savings**: 7 months of data ($1,650 - $2,512 range)
- **Investments**: 7 months of data ($800 - $1,215 range)

## Troubleshooting

### Connection Issues

If you can't connect to PostgreSQL:

1. Check if PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Verify your credentials in `.env`

3. Check PostgreSQL is listening on the correct port:
   ```bash
   psql -U postgres -c "SHOW port;"
   ```

### Permission Issues

If you get permission errors:

```bash
chmod +x backend/scripts/init_db.sh
```

### Data Already Exists

The seed script uses `ON CONFLICT DO NOTHING` for most inserts, so running it multiple times is safe.

## API Endpoints

After setup, the following endpoints will be available:

### Financial Data
- `GET /api/v1/financial/spendings` - Total spendings summary
- `GET /api/v1/financial/savings` - Savings summary
- `GET /api/v1/financial/investments` - Investments summary

### Transactions
- `GET /api/v1/transactions` - List all transactions
- `POST /api/v1/transactions` - Create transaction
- `PUT /api/v1/transactions/:id` - Update transaction
- `DELETE /api/v1/transactions/:id` - Delete transaction

### Analytics
- `GET /api/v1/analytics/monthly` - Monthly aggregates
- `GET /api/v1/analytics/categories` - Category breakdown
- `GET /api/v1/analytics/daily` - Daily spending trends

#