package handlers

import (
	"moneymanager/internal/models"
	"moneymanager/internal/services"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type BillHandler struct {
	service *services.BillService
}

func NewBillHandler(service *services.BillService) *BillHandler {
	return &BillHandler{service: service}
}

func (h *BillHandler) CreateBill(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req struct {
		Title      string  `json:"title" binding:"required"`
		Amount     float64 `json:"amount" binding:"required"`
		Category   string  `json:"category" binding:"required"`
		DueDate    string  `json:"due_date" binding:"required"`
		Recurrence string  `json:"recurrence"`
		Status     string  `json:"status"`
		Notes      string  `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	dueDate, err := time.Parse("2006-01-02", req.DueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid due date format. Use YYYY-MM-DD"})
		return
	}

	if req.Recurrence == "" {
		req.Recurrence = "none"
	}
	if req.Status == "" {
		req.Status = "pending"
	}

	bill := &models.Bill{
		Title:      req.Title,
		Amount:     req.Amount,
		Category:   req.Category,
		DueDate:    dueDate,
		Recurrence: req.Recurrence,
		Status:     req.Status,
		Notes:      req.Notes,
	}

	createdBill, err := h.service.CreateBill(userID, bill)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, createdBill)
}

func (h *BillHandler) GetBills(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	bills, err := h.service.GetBills(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, bills)
}

func (h *BillHandler) GetUpcomingBills(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	daysStr := c.DefaultQuery("days", "7")
	days, err := strconv.Atoi(daysStr)
	if err != nil {
		days = 7
	}

	// Update overdue bills first
	_ = h.service.UpdateOverdueBills(userID)

	bills, err := h.service.GetUpcomingBills(userID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, bills)
}

func (h *BillHandler) UpdateBill(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	billID := c.Param("id")

	var req struct {
		Title      string  `json:"title" binding:"required"`
		Amount     float64 `json:"amount" binding:"required"`
		Category   string  `json:"category" binding:"required"`
		DueDate    string  `json:"due_date" binding:"required"`
		Recurrence string  `json:"recurrence"`
		Status     string  `json:"status"`
		Notes      string  `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	dueDate, err := time.Parse("2006-01-02", req.DueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid due date format. Use YYYY-MM-DD"})
		return
	}

	if req.Recurrence == "" {
		req.Recurrence = "none"
	}
	if req.Status == "" {
		req.Status = "pending"
	}

	bill := &models.Bill{
		Title:      req.Title,
		Amount:     req.Amount,
		Category:   req.Category,
		DueDate:    dueDate,
		Recurrence: req.Recurrence,
		Status:     req.Status,
		Notes:      req.Notes,
	}

	updatedBill, err := h.service.UpdateBill(userID, billID, bill)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedBill)
}

func (h *BillHandler) DeleteBill(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	billID := c.Param("id")

	if err := h.service.DeleteBill(userID, billID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Bill deleted successfully"})
}

func (h *BillHandler) MarkBillAsPaid(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	billID := c.Param("id")

	if err := h.service.MarkBillAsPaid(userID, billID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Bill marked as paid"})
}

func (h *BillHandler) GetPaidBills(c *gin.Context) {
	userID, err := GetUserIDString(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 10
	}

	bills, err := h.service.GetPaidBills(userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, bills)
}
