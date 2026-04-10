package main

import (
	"log"

	"moneymanager/internal/app"
)

func main() {
	application, err := app.New()
	if err != nil {
		log.Fatalf("Failed to initialize application: %v", err)
	}
	defer application.Close()
	if err := application.InitializeDatabase(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	if err := application.Run(); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
