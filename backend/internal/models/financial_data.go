package models

import "time"

type TotalSpending struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Amount    float64   `json:"amount"`
	Period    string    `json:"period"`
	Date      time.Time `json:"date"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Saving struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Amount    float64   `json:"amount"`
	Period    string    `json:"period"`
	Date      time.Time `json:"date"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Investment struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	Amount      float64   `json:"amount"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type FinancialDataPoint struct {
	Date   time.Time `json:"date"`
	Amount float64   `json:"amount"`
}

type FinancialSummary struct {
	CurrentAmount    float64              `json:"current_amount"`
	PercentageChange float64              `json:"percentage_change"`
	Period           string               `json:"period"`
	ChartData        []FinancialDataPoint `json:"chart_data"`
}

type InvestmentEntry struct {
	ID             string    `json:"id"`
	UserID         string    `json:"user_id"`
	Amount         float64   `json:"amount"`
	Description    string    `json:"description"`
	InvestmentName string    `json:"investment_name"`
	Quantity       float64   `json:"quantity"`
	PurchaseDate   time.Time `json:"purchase_date"`
	Notes          string    `json:"notes"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type Goal struct {
	ID           string            `json:"id"`
	UserID       string            `json:"user_id"`
	Name         string            `json:"name"`
	TargetAmount float64           `json:"target_amount"`
	Status       string            `json:"status"`
	ColorFrom    string            `json:"color_from"`
	ColorTo      string            `json:"color_to"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
	Investments  []InvestmentEntry `json:"investments"`
}

type SalaryEntry struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	Amount      float64   `json:"amount"`
	CompanyName string    `json:"company_name"`
	PaymentDate time.Time `json:"payment_date"`
	PaymentType string    `json:"payment_type"`
	Notes       string    `json:"notes"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
