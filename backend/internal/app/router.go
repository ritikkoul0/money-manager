package app

import (
	"moneymanager/internal/handlers"

	"github.com/gin-gonic/gin"
)

func setupRouter(
	router *gin.Engine,
	transactionHandler *handlers.TransactionHandler,
	financialHandler *handlers.FinancialHandler,
	billHandler *handlers.BillHandler,
	authHandler *handlers.AuthHandler,
) *gin.Engine {
	router.Use(corsMiddleware())

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := router.Group("/api/v1")
	{
		// User/Auth endpoints (no auth middleware required)
		users := api.Group("/users")
		{
			users.POST("/sync", authHandler.SyncUser)
			users.GET("/by-google-id/:google_id", authHandler.GetUserByGoogleID)
		}

		// Protected routes (require auth middleware)
		transactions := api.Group("/transactions")
		transactions.Use(authMiddleware())
		{
			transactions.POST("", transactionHandler.CreateTransaction)
			transactions.GET("", transactionHandler.GetTransactions)
			transactions.GET("/:id", transactionHandler.GetTransaction)
			transactions.PUT("/:id", transactionHandler.UpdateTransaction)
			transactions.DELETE("/:id", transactionHandler.DeleteTransaction)
		}

		analytics := api.Group("/analytics")
		analytics.Use(authMiddleware())
		{
			analytics.GET("/monthly", transactionHandler.GetMonthlyAggregates)
			analytics.GET("/categories", transactionHandler.GetCategoryAggregates)
			analytics.GET("/daily", transactionHandler.GetDailySpending)
		}

		financial := api.Group("/financial")
		financial.Use(authMiddleware())
		{
			financial.GET("/spendings", financialHandler.GetTotalSpendingsSummary)
			financial.GET("/savings", financialHandler.GetSavingsSummary)
			financial.GET("/investments", financialHandler.GetInvestmentsSummary)
			financial.GET("/investments/recent", financialHandler.GetRecentInvestmentEntries)
			financial.POST("/investments", financialHandler.CreateInvestmentEntry)
			financial.PUT("/investments/:id", financialHandler.UpdateInvestmentEntry)
			financial.DELETE("/investments/:id", financialHandler.DeleteInvestmentEntry)
			financial.GET("/goals", financialHandler.GetGoals)
			financial.POST("/goals", financialHandler.CreateGoal)
			financial.POST("/goals/:id/investments", financialHandler.LinkInvestmentToGoal)
			financial.DELETE("/goals/:id/investments/:investmentId", financialHandler.UnlinkInvestmentFromGoal)
			financial.GET("/salary", financialHandler.GetSalaryEntries)
			financial.POST("/salary", financialHandler.CreateSalaryEntry)
			financial.PUT("/salary/:id", financialHandler.UpdateSalaryEntry)
			financial.DELETE("/salary/:id", financialHandler.DeleteSalaryEntry)
			financial.GET("/salary/stats", financialHandler.GetSalaryStats)
		}

		bills := api.Group("/bills")
		bills.Use(authMiddleware())
		{
			bills.POST("", billHandler.CreateBill)
			bills.GET("", billHandler.GetBills)
			bills.GET("/upcoming", billHandler.GetUpcomingBills)
			bills.GET("/paid", billHandler.GetPaidBills)
			bills.PUT("/:id", billHandler.UpdateBill)
			bills.DELETE("/:id", billHandler.DeleteBill)
			bills.PATCH("/:id/pay", billHandler.MarkBillAsPaid)
		}
	}

	return router
}
