package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID        uuid.UUID `json:"id" db:"id"`
	Email     string    `json:"email" db:"email"`
	Name      string    `json:"name" db:"name"`
	Currency  string    `json:"currency" db:"currency"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type UserPreferences struct {
	UserID       uuid.UUID `json:"user_id" db:"user_id"`
	Currency     string    `json:"currency" db:"currency"`
	BudgetAlert  float64   `json:"budget_alert" db:"budget_alert"`
	AlertEnabled bool      `json:"alert_enabled" db:"alert_enabled"`
}
