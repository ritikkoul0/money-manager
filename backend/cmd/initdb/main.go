package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"moneymanager/internal/database"

	"github.com/joho/godotenv"
)

func main() {
	// Command line flags
	verify := flag.Bool("verify", false, "Verify database schema only")
	stats := flag.Bool("stats", false, "Show database statistics")
	migrate := flag.Bool("migrate", false, "Run migrations only")
	envFile := flag.String("env", ".env", "Path to .env file")
	flag.Parse()

	// Load environment variables
	if err := godotenv.Load(*envFile); err != nil {
		log.Printf("⚠️  No .env file found at %s, using environment variables\n", *envFile)
	}

	// Database configuration
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "moneymanager")

	fmt.Println("🗄️  Money Manager Database Initialization Tool")
	fmt.Println("=" + string(make([]byte, 50)))
	fmt.Printf("📊 Database Configuration:\n")
	fmt.Printf("   Host: %s\n", dbHost)
	fmt.Printf("   Port: %s\n", dbPort)
	fmt.Printf("   Database: %s\n", dbName)
	fmt.Printf("   User: %s\n", dbUser)
	fmt.Println()

	// Connect to database
	db, err := database.NewDatabase(dbHost, dbPort, dbUser, dbPassword, dbName)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Handle different modes
	switch {
	case *verify:
		// Verify schema only
		if err := db.VerifySchema(); err != nil {
			log.Fatalf("❌ Schema verification failed: %v", err)
		}
		fmt.Println("✅ Schema verification successful!")

	case *stats:
		// Show statistics only
		if err := showStats(db); err != nil {
			log.Fatalf("❌ Failed to get statistics: %v", err)
		}

	case *migrate:
		// Run migrations only
		fmt.Println("🔄 Running database migrations...")
		if err := db.MigrateInvestments(); err != nil {
			log.Fatalf("❌ Migration failed: %v", err)
		}
		fmt.Println("✅ Migrations completed successfully!")

	default:
		// Full initialization
		fmt.Println("🚀 Starting full database initialization...")
		fmt.Println()

		// Initialize database schema
		if err := db.InitDB(); err != nil {
			log.Fatalf("❌ Failed to initialize database: %v", err)
		}

		// Run migrations
		fmt.Println()
		if err := db.MigrateInvestments(); err != nil {
			log.Fatalf("❌ Failed to migrate investments: %v", err)
		}

		// Verify schema
		fmt.Println()
		if err := db.VerifySchema(); err != nil {
			log.Fatalf("❌ Failed to verify schema: %v", err)
		}

		// Show statistics
		fmt.Println()
		if err := showStats(db); err != nil {
			log.Printf("⚠️  Warning: Could not retrieve statistics: %v", err)
		}

		fmt.Println()
		fmt.Println("✨ Database initialization complete!")
		fmt.Println()
		fmt.Println("You can now start the application with:")
		fmt.Println("   cd backend && go run cmd/api/main.go")
		fmt.Println()
	}
}

func showStats(db *database.Database) error {
	stats, err := db.GetDatabaseStats()
	if err != nil {
		return err
	}

	fmt.Println("📊 Database Statistics:")
	fmt.Println("   Table                 | Records")
	fmt.Println("   " + string(make([]byte, 40)))

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
		count := stats[table]
		fmt.Printf("   %-20s | %d\n", table, count)
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
