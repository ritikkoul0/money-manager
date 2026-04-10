package handlers

import (
	"moneymanager/internal/services"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type FinancialHandler struct {
	service *services.FinancialService
}

func NewFinancialHandler(service *services.FinancialService) *FinancialHandler {
	return &FinancialHandler{service: service}
}

func (h *FinancialHandler) GetTotalSpendingsSummary(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	timeRange := c.DefaultQuery("range", "week")

	summary, err := h.service.GetTotalSpendingsSummary(userID, timeRange)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Update period based on time range
	summary.Period = getTimeRangeLabel(timeRange)
	c.JSON(http.StatusOK, summary)
}

func (h *FinancialHandler) GetSavingsSummary(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	timeRange := c.DefaultQuery("range", "year")

	summary, err := h.service.GetSavingsSummary(userID, timeRange)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Update period based on time range
	summary.Period = getTimeRangeLabel(timeRange)
	c.JSON(http.StatusOK, summary)
}

func (h *FinancialHandler) GetRecentInvestmentEntries(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	entries, err := h.service.GetRecentInvestmentEntries(userID, 10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, entries)
}

func (h *FinancialHandler) GetInvestmentsSummary(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	timeRange := c.DefaultQuery("range", "year")

	summary, err := h.service.GetInvestmentsSummary(userID, timeRange)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Update period based on time range
	summary.Period = getTimeRangeLabel(timeRange)
	c.JSON(http.StatusOK, summary)
}

func (h *FinancialHandler) CreateInvestmentEntry(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req struct {
		Amount         float64 `json:"amount" binding:"required"`
		Description    string  `json:"description"`
		InvestmentName string  `json:"investment_name" binding:"required"`
		Quantity       float64 `json:"quantity" binding:"required"`
		PurchaseDate   string  `json:"purchase_date" binding:"required"`
		Notes          string  `json:"notes"`
		Date           string  `json:"date"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	purchaseDate, err := time.Parse("2006-01-02", req.PurchaseDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid purchase_date format. Use YYYY-MM-DD"})
		return
	}

	var createdAt time.Time
	if req.Date != "" {
		dateOnly, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
			return
		}

		now := time.Now()
		createdAt = time.Date(dateOnly.Year(), dateOnly.Month(), dateOnly.Day(),
			now.Hour(), now.Minute(), now.Second(), now.Nanosecond(), now.Location())
	} else {
		createdAt = time.Now()
	}

	entry, err := h.service.CreateInvestmentEntry(
		userID,
		req.Amount,
		req.Description,
		req.InvestmentName,
		req.Quantity,
		purchaseDate,
		req.Notes,
		createdAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, entry)
}

func (h *FinancialHandler) UpdateInvestmentEntry(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	entryID := c.Param("id")

	var req struct {
		Amount         float64 `json:"amount" binding:"required"`
		Description    string  `json:"description"`
		InvestmentName string  `json:"investment_name" binding:"required"`
		Quantity       float64 `json:"quantity" binding:"required"`
		PurchaseDate   string  `json:"purchase_date" binding:"required"`
		Notes          string  `json:"notes"`
		Date           string  `json:"date"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	purchaseDate, err := time.Parse("2006-01-02", req.PurchaseDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid purchase_date format. Use YYYY-MM-DD"})
		return
	}

	var createdAt time.Time
	if req.Date != "" {
		dateOnly, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
			return
		}

		now := time.Now()
		createdAt = time.Date(dateOnly.Year(), dateOnly.Month(), dateOnly.Day(),
			now.Hour(), now.Minute(), now.Second(), now.Nanosecond(), now.Location())
	} else {
		createdAt = time.Now()
	}

	entry, err := h.service.UpdateInvestmentEntry(
		userID,
		entryID,
		req.Amount,
		req.Description,
		req.InvestmentName,
		req.Quantity,
		purchaseDate,
		req.Notes,
		createdAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, entry)
}

func (h *FinancialHandler) DeleteInvestmentEntry(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	entryID := c.Param("id")

	if err := h.service.DeleteInvestmentEntry(userID, entryID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Investment entry deleted successfully"})
}

func (h *FinancialHandler) GetGoals(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	goals, err := h.service.GetGoals(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, goals)
}

func (h *FinancialHandler) CreateGoal(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req struct {
		Name         string  `json:"name" binding:"required"`
		TargetAmount float64 `json:"target_amount" binding:"required"`
		Status       string  `json:"status"`
		ColorFrom    string  `json:"color_from" binding:"required"`
		ColorTo      string  `json:"color_to" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.TargetAmount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "target_amount must be greater than 0"})
		return
	}

	if req.Status == "" {
		req.Status = "Planned"
	}

	goal, err := h.service.CreateGoal(
		userID,
		req.Name,
		req.TargetAmount,
		req.Status,
		req.ColorFrom,
		req.ColorTo,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, goal)
}

func (h *FinancialHandler) LinkInvestmentToGoal(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	goalID := c.Param("id")

	var req struct {
		InvestmentID string `json:"investment_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.LinkInvestmentToGoal(userID, goalID, req.InvestmentID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Investment linked successfully"})
}

func (h *FinancialHandler) UnlinkInvestmentFromGoal(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	goalID := c.Param("id")
	investmentID := c.Param("investmentId")

	if err := h.service.UnlinkInvestmentFromGoal(userID, goalID, investmentID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Investment unlinked successfully"})
}

// Salary Entry Handlers

func (h *FinancialHandler) GetSalaryEntries(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	entries, err := h.service.GetSalaryEntries(userID, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, entries)
}

func (h *FinancialHandler) CreateSalaryEntry(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req struct {
		Amount      float64 `json:"amount" binding:"required"`
		CompanyName string  `json:"company_name" binding:"required"`
		PaymentDate string  `json:"payment_date" binding:"required"`
		PaymentType string  `json:"payment_type" binding:"required"`
		Notes       string  `json:"notes"`
		Date        string  `json:"date"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	paymentDate, err := time.Parse("2006-01-02", req.PaymentDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment_date format. Use YYYY-MM-DD"})
		return
	}

	var createdAt time.Time
	if req.Date != "" {
		dateOnly, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
			return
		}

		now := time.Now()
		createdAt = time.Date(dateOnly.Year(), dateOnly.Month(), dateOnly.Day(),
			now.Hour(), now.Minute(), now.Second(), now.Nanosecond(), now.Location())
	} else {
		createdAt = time.Now()
	}

	entry, err := h.service.CreateSalaryEntry(
		userID,
		req.Amount,
		req.CompanyName,
		paymentDate,
		req.PaymentType,
		req.Notes,
		createdAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, entry)
}

func (h *FinancialHandler) UpdateSalaryEntry(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	entryID := c.Param("id")

	var req struct {
		Amount      float64 `json:"amount" binding:"required"`
		CompanyName string  `json:"company_name" binding:"required"`
		PaymentDate string  `json:"payment_date" binding:"required"`
		PaymentType string  `json:"payment_type" binding:"required"`
		Notes       string  `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	paymentDate, err := time.Parse("2006-01-02", req.PaymentDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment_date format. Use YYYY-MM-DD"})
		return
	}

	entry, err := h.service.UpdateSalaryEntry(
		userID,
		entryID,
		req.Amount,
		req.CompanyName,
		paymentDate,
		req.PaymentType,
		req.Notes,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, entry)
}

func (h *FinancialHandler) DeleteSalaryEntry(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	entryID := c.Param("id")

	if err := h.service.DeleteSalaryEntry(userID, entryID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Salary entry deleted successfully"})
}

func (h *FinancialHandler) GetSalaryStats(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	stats, err := h.service.GetSalaryStats(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func getTimeRangeLabel(timeRange string) string {
	labels := map[string]string{
		"day":   "THIS DAY",
		"week":  "THIS WEEK",
		"month": "THIS MONTH",
		"year":  "THIS YEAR",
	}
	if label, ok := labels[timeRange]; ok {
		return label
	}
	return "THIS WEEK"
}
