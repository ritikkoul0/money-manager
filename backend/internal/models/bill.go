package models

import "time"

type Bill struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	Title      string    `json:"title"`
	Amount     float64   `json:"amount"`
	Category   string    `json:"category"`
	DueDate    time.Time `json:"due_date"`
	Recurrence string    `json:"recurrence"` // none, daily, weekly, monthly, half-yearly, yearly
	Status     string    `json:"status"`     // pending, paid, overdue
	Notes      string    `json:"notes"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
