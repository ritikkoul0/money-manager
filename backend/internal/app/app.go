package app

import (
	"log"

	"moneymanager/internal/config"
	"moneymanager/internal/database"
	"moneymanager/internal/handlers"
	"moneymanager/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

type App struct {
	Config config.Config
	DB     *database.Database
	Router *gin.Engine
}

func New() (*App, error) {
	log.Println("🚀 Initializing Money Manager Application...")

	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No .env file found, using environment variables")
	} else {
		log.Println("✅ Loaded .env file")
	}

	log.Println("📋 Loading configuration...")
	cfg := config.Load()

	log.Println("🗄️  Connecting to database...")
	db, err := database.NewDatabase(
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBName,
	)
	if err != nil {
		log.Printf("❌ Database connection failed: %v", err)
		return nil, err
	}

	log.Println("🔧 Initializing services...")
	transactionService := services.NewTransactionService(db.DB)
	financialService := services.NewFinancialService(db.DB)
	billService := services.NewBillService(db.DB)

	log.Println("🎯 Initializing handlers...")
	transactionHandler := handlers.NewTransactionHandler(transactionService)
	financialHandler := handlers.NewFinancialHandler(financialService)
	billHandler := handlers.NewBillHandler(billService)
	authHandler := handlers.NewAuthHandler(db.DB)

	log.Println("🌐 Setting up router...")
	router := gin.Default()

	log.Println("✅ Application initialized successfully")
	return &App{
		Config: cfg,
		DB:     db,
		Router: setupRouter(router, transactionHandler, financialHandler, billHandler, authHandler),
	}, nil
}

func (a *App) InitializeDatabase() error {
	log.Println("🗄️  Initializing database schema...")
	if err := a.DB.InitDB(); err != nil {
		log.Printf("❌ Failed to initialize database: %v", err)
		return err
	}

	log.Println("🔄 Running database migrations...")
	if err := a.DB.MigrateInvestments(); err != nil {
		log.Printf("❌ Failed to run migrations: %v", err)
		return err
	}

	log.Println("🔍 Verifying database schema...")
	if err := a.DB.VerifySchema(); err != nil {
		log.Printf("❌ Schema verification failed: %v", err)
		return err
	}

	if stats, err := a.DB.GetDatabaseStats(); err == nil {
		log.Println("📊 Database Statistics:")
		for table, count := range stats {
			log.Printf("   %s: %d records", table, count)
		}
	}

	log.Println("✅ Database initialization complete")
	return nil
}

func (a *App) Run() error {
	log.Println("🌟 Starting HTTP server...")
	log.Printf("🚀 Server listening on http://localhost:%s", a.Config.Port)
	log.Println("📡 Ready to accept requests")
	return a.Router.Run(":" + a.Config.Port)
}

func (a *App) Close() error {
	return a.DB.Close()
}
