package database

import (
	"database/sql"
	"fmt"
	"log"
)

// InitDB initializes the database with all required tables, indexes, and extensions
func (d *Database) InitDB() error {
	log.Println("🗄️  Initializing database schema...")

	// Execute schema initialization in a transaction
	tx, err := d.DB.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Enable UUID extension
	if err := d.enableExtensions(tx); err != nil {
		return err
	}

	// Create core tables
	if err := d.createCoreTables(tx); err != nil {
		return err
	}

	// Create financial tables
	if err := d.createFinancialTables(tx); err != nil {
		return err
	}

	// Create bills and goals tables
	if err := d.createBillsAndGoalsTables(tx); err != nil {
		return err
	}

	// Create indexes
	if err := d.createIndexes(tx); err != nil {
		return err
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	log.Println("✅ Database schema initialized successfully")
	return nil
}

// enableExtensions enables required PostgreSQL extensions
func (d *Database) enableExtensions(tx *sql.Tx) error {
	log.Println("📦 Enabling PostgreSQL extensions...")

	query := `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

	if _, err := tx.Exec(query); err != nil {
		return fmt.Errorf("failed to enable uuid-ossp extension: %w", err)
	}

	log.Println("✅ Extensions enabled")
	return nil
}

// createCoreTables creates users, transactions, and user_preferences tables
func (d *Database) createCoreTables(tx *sql.Tx) error {
	log.Println("👥 Creating core tables (users, transactions, preferences)...")

	query := `
	-- Users table
	CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		email VARCHAR(255) UNIQUE NOT NULL,
		name VARCHAR(255) NOT NULL,
		currency VARCHAR(10) DEFAULT 'INR',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	-- Transactions table
	CREATE TABLE IF NOT EXISTS transactions (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		amount DECIMAL(15, 2) NOT NULL,
		type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
		category VARCHAR(100) NOT NULL,
		payment_method VARCHAR(100),
		description TEXT,
		is_recurring BOOLEAN DEFAULT FALSE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	-- User preferences table
	CREATE TABLE IF NOT EXISTS user_preferences (
		user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
		currency VARCHAR(10) DEFAULT 'INR',
		budget_alert DECIMAL(15, 2) DEFAULT 0.80,
		alert_enabled BOOLEAN DEFAULT TRUE
	);
	`

	if _, err := tx.Exec(query); err != nil {
		return fmt.Errorf("failed to create core tables: %w", err)
	}

	log.Println("✅ Core tables created")
	return nil
}

// createFinancialTables creates total_spendings, savings, and investments tables
func (d *Database) createFinancialTables(tx *sql.Tx) error {
	log.Println("💰 Creating financial tables (spendings, savings, investments)...")

	query := `
	-- Total spendings table
	CREATE TABLE IF NOT EXISTS total_spendings (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		amount DECIMAL(15, 2) NOT NULL,
		period VARCHAR(20) NOT NULL,
		date DATE NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	-- Savings table
	CREATE TABLE IF NOT EXISTS savings (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		amount DECIMAL(15, 2) NOT NULL,
		period VARCHAR(20) NOT NULL,
		date DATE NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	-- Investments table
	CREATE TABLE IF NOT EXISTS investments (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		amount DECIMAL(15, 2) NOT NULL,
		description TEXT,
		investment_name VARCHAR(255),
		quantity DECIMAL(15, 4) DEFAULT 0,
		purchase_date DATE,
		notes TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`

	if _, err := tx.Exec(query); err != nil {
		return fmt.Errorf("failed to create financial tables: %w", err)
	}

	log.Println("✅ Financial tables created")
	return nil
}

// createBillsAndGoalsTables creates bills, goals, and goal_investments tables
func (d *Database) createBillsAndGoalsTables(tx *sql.Tx) error {
	log.Println("📋 Creating bills and goals tables...")

	query := `
	-- Bills/Reminders table
	CREATE TABLE IF NOT EXISTS bills (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		title VARCHAR(255) NOT NULL,
		amount DECIMAL(15, 2) NOT NULL,
		category VARCHAR(100) NOT NULL,
		due_date DATE NOT NULL,
		recurrence VARCHAR(20) CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'half-yearly', 'yearly')),
		status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
		notes TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	-- Goals table
	CREATE TABLE IF NOT EXISTS goals (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		name VARCHAR(255) NOT NULL,
		target_amount DECIMAL(15, 2) NOT NULL CHECK (target_amount > 0),
		status VARCHAR(50) NOT NULL DEFAULT 'Planned',
		color_from VARCHAR(20) NOT NULL,
		color_to VARCHAR(20) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	-- Goal investments junction table
	CREATE TABLE IF NOT EXISTS goal_investments (
		goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
		investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (goal_id, investment_id),
		UNIQUE (investment_id)
	);
	`

	if _, err := tx.Exec(query); err != nil {
		return fmt.Errorf("failed to create bills and goals tables: %w", err)
	}

	log.Println("✅ Bills and goals tables created")
	return nil
}

// createIndexes creates all necessary indexes for performance optimization
func (d *Database) createIndexes(tx *sql.Tx) error {
	log.Println("🔍 Creating database indexes...")

	query := `
	-- Indexes for transactions
	CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
	CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
	CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
	CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

	-- Indexes for total_spendings
	CREATE INDEX IF NOT EXISTS idx_total_spendings_user_id ON total_spendings(user_id);
	CREATE INDEX IF NOT EXISTS idx_total_spendings_date ON total_spendings(date);

	-- Indexes for savings
	CREATE INDEX IF NOT EXISTS idx_savings_user_id ON savings(user_id);
	CREATE INDEX IF NOT EXISTS idx_savings_date ON savings(date);

	-- Indexes for investments
	CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
	CREATE INDEX IF NOT EXISTS idx_investments_created_at ON investments(created_at);

	-- Indexes for bills
	CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
	CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
	CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);

	-- Indexes for goals
	CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
	CREATE INDEX IF NOT EXISTS idx_goal_investments_goal_id ON goal_investments(goal_id);
	CREATE INDEX IF NOT EXISTS idx_goal_investments_investment_id ON goal_investments(investment_id);
	`

	if _, err := tx.Exec(query); err != nil {
		return fmt.Errorf("failed to create indexes: %w", err)
	}

	log.Println("✅ Indexes created")
	return nil
}

// MigrateInvestments applies investment table migrations
func (d *Database) MigrateInvestments() error {
	log.Println("🔄 Running investment table migrations...")

	query := `
	-- Add columns if they don't exist (for backward compatibility)
	ALTER TABLE investments
	ADD COLUMN IF NOT EXISTS investment_name VARCHAR(255),
	ADD COLUMN IF NOT EXISTS quantity DECIMAL(15, 4) DEFAULT 0,
	ADD COLUMN IF NOT EXISTS purchase_date DATE,
	ADD COLUMN IF NOT EXISTS notes TEXT;

	-- Update existing records with default values
	UPDATE investments
	SET
		investment_name = COALESCE(NULLIF(investment_name, ''), description, 'Investment'),
		quantity = COALESCE(quantity, 0),
		purchase_date = COALESCE(purchase_date, DATE(created_at))
	WHERE investment_name IS NULL
		OR investment_name = ''
		OR quantity IS NULL
		OR purchase_date IS NULL;
	`

	if _, err := d.DB.Exec(query); err != nil {
		return fmt.Errorf("failed to migrate investments: %w", err)
	}

	log.Println("✅ Investment migrations completed")
	return nil
}

// VerifySchema verifies that all required tables exist
func (d *Database) VerifySchema() error {
	log.Println("🔍 Verifying database schema...")

	requiredTables := []string{
		"users",
		"transactions",
		"user_preferences",
		"total_spendings",
		"savings",
		"investments",
		"bills",
		"goals",
		"goal_investments",
	}

	for _, table := range requiredTables {
		var exists bool
		query := `
			SELECT EXISTS (
				SELECT FROM information_schema.tables 
				WHERE table_schema = 'public' 
				AND table_name = $1
			);
		`

		if err := d.DB.QueryRow(query, table).Scan(&exists); err != nil {
			return fmt.Errorf("failed to verify table %s: %w", table, err)
		}

		if !exists {
			return fmt.Errorf("required table %s does not exist", table)
		}
	}

	log.Println("✅ Schema verification completed - all tables exist")
	return nil
}

// GetDatabaseStats returns basic statistics about the database
func (d *Database) GetDatabaseStats() (map[string]int, error) {
	stats := make(map[string]int)

	tables := []string{
		"users",
		"transactions",
		"total_spendings",
		"savings",
		"investments",
		"bills",
		"goals",
		"goal_investments",
	}

	for _, table := range tables {
		var count int
		query := fmt.Sprintf("SELECT COUNT(*) FROM %s", table)
		if err := d.DB.QueryRow(query).Scan(&count); err != nil {
			return nil, fmt.Errorf("failed to get count for %s: %w", table, err)
		}
		stats[table] = count
	}

	return stats, nil
}
