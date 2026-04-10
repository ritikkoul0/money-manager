package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

type Database struct {
	DB *sql.DB
}

// NewDatabase creates a new database connection
// If databaseURL is provided, it uses that; otherwise it constructs from individual params
func NewDatabase(host, port, user, password, dbname string) (*Database, error) {
	log.Println("🔌 Attempting to connect to database...")
	log.Printf("   Host: %s", host)
	log.Printf("   Port: %s", port)
	log.Printf("   User: %s", user)
	log.Printf("   Database: %s", dbname)
	log.Printf("   SSL Mode: require")

	// Force IPv4 connection and add connection parameters for Supabase
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=require connect_timeout=10",
		host, port, user, password, dbname)

	log.Println("📡 Opening database connection...")
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Printf("❌ Failed to open database connection: %v", err)
		return nil, fmt.Errorf("error opening database: %w", err)
	}

	log.Println("🏓 Pinging database to verify connection...")
	if err := db.Ping(); err != nil {
		log.Printf("❌ Failed to ping database: %v", err)
		log.Println("💡 Troubleshooting tips:")
		log.Println("   1. Check if database credentials in .env are correct")
		log.Println("   2. Verify database server is running and accessible")
		log.Println("   3. Ensure firewall allows connection to database port")
		log.Println("   4. Confirm SSL is properly configured")
		return nil, fmt.Errorf("error connecting to database: %w", err)
	}

	log.Println("✅ Successfully connected to database")
	return &Database{DB: db}, nil
}

// NewDatabaseFromURL creates a new database connection from a connection URL
func NewDatabaseFromURL(databaseURL string) (*Database, error) {
	log.Println("🔌 Attempting to connect to database using DATABASE_URL...")

	log.Println("📡 Opening database connection...")
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		log.Printf("❌ Failed to open database connection: %v", err)
		return nil, fmt.Errorf("error opening database: %w", err)
	}

	log.Println("🏓 Pinging database to verify connection...")
	if err := db.Ping(); err != nil {
		log.Printf("❌ Failed to ping database: %v", err)
		log.Println("💡 Troubleshooting tips:")
		log.Println("   1. Check if DATABASE_URL is correct")
		log.Println("   2. Verify database server is running and accessible")
		log.Println("   3. Ensure firewall allows connection to database port")
		log.Println("   4. Confirm SSL is properly configured")
		return nil, fmt.Errorf("error connecting to database: %w", err)
	}

	log.Println("✅ Successfully connected to database")
	return &Database{DB: db}, nil
}

func (d *Database) Close() error {
	return d.DB.Close()
}

func (d *Database) InitSchema() error {
	schema := `
	CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

	CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		email VARCHAR(255) UNIQUE NOT NULL,
		name VARCHAR(255) NOT NULL,
		currency VARCHAR(10) DEFAULT 'INR',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

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

	CREATE TABLE IF NOT EXISTS user_preferences (
		user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
		currency VARCHAR(10) DEFAULT 'INR',
		budget_alert DECIMAL(15, 2) DEFAULT 0.80,
		alert_enabled BOOLEAN DEFAULT TRUE
	);

	CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
	CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
	CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
	CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

	CREATE TABLE IF NOT EXISTS total_spendings (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		amount DECIMAL(15, 2) NOT NULL,
		period VARCHAR(20) NOT NULL,
		date DATE NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS savings (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		amount DECIMAL(15, 2) NOT NULL,
		period VARCHAR(20) NOT NULL,
		date DATE NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

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

	CREATE TABLE IF NOT EXISTS bills (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		title VARCHAR(255) NOT NULL,
		amount DECIMAL(15, 2) NOT NULL,
		category VARCHAR(100) NOT NULL,
		due_date DATE NOT NULL,
		recurrence VARCHAR(20) CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
		status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
		notes TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

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

	CREATE TABLE IF NOT EXISTS goal_investments (
		goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
		investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (goal_id, investment_id),
		UNIQUE (investment_id)
	);

	CREATE INDEX IF NOT EXISTS idx_total_spendings_user_id ON total_spendings(user_id);
	CREATE INDEX IF NOT EXISTS idx_total_spendings_date ON total_spendings(date);
	CREATE INDEX IF NOT EXISTS idx_savings_user_id ON savings(user_id);
	CREATE INDEX IF NOT EXISTS idx_savings_date ON savings(date);
	CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
	CREATE INDEX IF NOT EXISTS idx_investments_created_at ON investments(created_at);
	CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
	CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
	CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
	CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
	CREATE INDEX IF NOT EXISTS idx_goal_investments_goal_id ON goal_investments(goal_id);
	CREATE INDEX IF NOT EXISTS idx_goal_investments_investment_id ON goal_investments(investment_id);
	`

	_, err := d.DB.Exec(schema)
	if err != nil {
		return fmt.Errorf("error initializing schema: %w", err)
	}

	log.Println("Database schema initialized successfully")
	return nil
}
