package models

import (
	"time"

	"github.com/google/uuid"
)

type TransactionType string

const (
	TypeIncome  TransactionType = "income"
	TypeExpense TransactionType = "expense"
)

type Transaction struct {
	ID            uuid.UUID       `json:"id" db:"id"`
	UserID        uuid.UUID       `json:"user_id" db:"user_id"`
	Amount        float64         `json:"amount" db:"amount"`
	Type          TransactionType `json:"type" db:"type"`
	Category      string          `json:"category" db:"category"`
	PaymentMethod string          `json:"payment_method" db:"payment_method"`
	Description   string          `json:"description" db:"description"`
	IsRecurring   bool            `json:"is_recurring" db:"is_recurring"`
	CreatedAt     time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at" db:"updated_at"`
}

type CreateTransactionRequest struct {
	Amount        float64         `json:"amount" binding:"required,gt=0"`
	Type          TransactionType `json:"type" binding:"required,oneof=income expense"`
	Category      string          `json:"category" binding:"required"`
	PaymentMethod string          `json:"payment_method"`
	Description   string          `json:"description"`
	IsRecurring   bool            `json:"is_recurring"`
	Date          *string         `json:"date"`
}

type UpdateTransactionRequest struct {
	Amount        *float64         `json:"amount" binding:"omitempty,gt=0"`
	Type          *TransactionType `json:"type" binding:"omitempty,oneof=income expense"`
	Category      *string          `json:"category"`
	PaymentMethod *string          `json:"payment_method"`
	Description   *string          `json:"description"`
	IsRecurring   *bool            `json:"is_recurring"`
}

type MonthlyAggregate struct {
	Month        string  `json:"month" db:"month"`
	TotalIncome  float64 `json:"total_income" db:"total_income"`
	TotalExpense float64 `json:"total_expense" db:"total_expense"`
	NetBalance   float64 `json:"net_balance" db:"net_balance"`
}

type CategoryAggregate struct {
	Category    string  `json:"category" db:"category"`
	TotalAmount float64 `json:"total_amount" db:"total_amount"`
	Percentage  float64 `json:"percentage"`
}

type DailySpending struct {
	Date            string  `json:"date" db:"date"`
	DailyTotal      float64 `json:"daily_total" db:"daily_total"`
	CumulativeTotal float64 `json:"cumulative_total"`
}
