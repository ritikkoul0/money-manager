# Database Scripts

This directory contains database initialization and migration scripts for the Money Manager application.

## Available Scripts

### 1. `init_db.sh` - Shell-based Database Initialization

A bash script that initializes the PostgreSQL database using `psql` commands.

**Usage:**
```bash
cd backend
./scripts/init_db.sh
```

**Requirements:**
- PostgreSQL client (`psql`) installed
- `.env` file configured with database credentials
- PostgreSQL server running

**What it does:**
- Tests database connection
- Creates database if it doesn't exist
- Runs `schema.sql` to create tables
- Applies `migrate_investments.sql` migration
- Applies `migrate_goals.sql` migration

### 2. `schema.sql` - Database Schema Definition

Contains the complete database schema including:
- **Core Tables:** users, transactions, user_preferences
- **Financial Tables:** total_spendings, savings, investments
- **Feature Tables:** bills, goals, goal_investments
- **Indexes:** Performance optimization indexes for all tables
- **Extensions:** UUID generation support

### 3. `migrate_investments.sql` - Investment Table Migration

Adds additional columns to the investments table:
- `investment_name` - Name of the investment
- `quantity` - Number of units/shares
- `purchase_date` - Date of purchase
- `notes` - Additional notes

### 4. `migrate_goals.sql` - Goals Feature Migration

Creates tables for the goals feature:
- `goals` - Financial goals tracking
- `goal_investments` - Links investments to goals

## Go-based Initialization (Recommended)

For a more robust and portable solution, use the Go-based initialization tool:

```bash
cd backend
go run cmd/initdb/main.go
```

### Advantages of Go-based Initialization:

1. **Cross-platform:** Works on Windows, macOS, and Linux
2. **No external dependencies:** Only requires Go and PostgreSQL server
3. **Better error handling:** Detailed error messages and transaction support
4. **Verification:** Built-in schema verification
5. **Statistics:** Shows database statistics after initialization
6. **Flexible:** Multiple operation modes (init, verify, migrate, stats)

### Go CLI Options:

```bash
# Full initialization (default)
go run cmd/initdb/main.go

# Verify schema only
go run cmd/initdb/main.go -verify

# Show database statistics
go run cmd/initdb/main.go -stats

# Run migrations only
go run cmd/initdb/main.go -migrate

# Use custom .env file
go run cmd/initdb/main.go -env=/path/to/.env
```

## Database Schema Overview

### Core Tables

**users**
- User account information
- Email, name, currency preferences
- Timestamps for tracking

**transactions**
- Income and expense records
- Categories, payment methods
- Recurring transaction support

**user_preferences**
- User-specific settings
- Budget alerts
- Currency preferences

### Financial Tables

**total_spendings**
- Aggregated spending data
- Period-based tracking (weekly/monthly)
- Historical spending trends

**savings**
- Savings tracking over time
- Period-based records
- Growth analysis

**investments**
- Investment portfolio tracking
- Quantity and purchase date
- Investment names and notes

### Feature Tables

**bills**
- Bill reminders and tracking
- Due dates and recurrence
- Status tracking (pending/paid/overdue)

**goals**
- Financial goal setting
- Target amounts
- Status and progress tracking
- Visual customization (colors)

**goal_investments**
- Links investments to goals
- Many-to-many relationship
- Unique investment constraint

## Indexes

All tables have appropriate indexes for:
- Foreign key relationships (user_id)
- Date-based queries (created_at, due_date, date)
- Status and category filtering
- Performance optimization

## Migration Strategy

1. **Initial Setup:** Run full initialization
2. **Schema Updates:** Use migration scripts
3. **Data Preservation:** Migrations use `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`
4. **Backward Compatibility:** Existing data is preserved and updated with defaults

## Troubleshooting

### Connection Issues

```bash
# Check if PostgreSQL is running
pg_isready

# Test connection manually
psql -h localhost -p 5432 -U postgres -d postgres
```

### Permission Issues

```bash
# Make script executable
chmod +x scripts/init_db.sh
```

### Schema Verification

```bash
# Verify all tables exist
go run cmd/initdb/main.go -verify

# Check table structure
psql -U postgres -d moneymanager -c "\dt"
```

### View Statistics

```bash
# Show record counts
go run cmd/initdb/main.go -stats
```

## Best Practices

1. **Always backup** before running migrations on production
2. **Test migrations** on a development database first
3. **Use transactions** for complex migrations
4. **Verify schema** after initialization
5. **Check statistics** to ensure data integrity

#