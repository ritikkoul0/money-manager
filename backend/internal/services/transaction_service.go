package services

import (
	"database/sql"
	"fmt"
	"time"

	"moneymanager/internal/models"

	"github.com/google/uuid"
)

type TransactionService struct {
	db *sql.DB
}

func NewTransactionService(db *sql.DB) *TransactionService {
	return &TransactionService{db: db}
}

func (s *TransactionService) CreateTransaction(userID uuid.UUID, req models.CreateTransactionRequest) (*models.Transaction, error) {
	transaction := &models.Transaction{
		ID:            uuid.New(),
		UserID:        userID,
		Amount:        req.Amount,
		Type:          req.Type,
		Category:      req.Category,
		PaymentMethod: req.PaymentMethod,
		Description:   req.Description,
		IsRecurring:   req.IsRecurring,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if req.Date != nil && *req.Date != "" {
		parsedDate, err := parseTransactionDate(*req.Date)
		if err != nil {
			return nil, fmt.Errorf("invalid date format: %w", err)
		}
		transaction.CreatedAt = parsedDate
	}

	query := `
		INSERT INTO transactions (id, user_id, amount, type, category, payment_method, description, is_recurring, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, user_id, amount, type, category, payment_method, description, is_recurring, created_at, updated_at
	`

	err := s.db.QueryRow(
		query,
		transaction.ID,
		transaction.UserID,
		transaction.Amount,
		transaction.Type,
		transaction.Category,
		transaction.PaymentMethod,
		transaction.Description,
		transaction.IsRecurring,
		transaction.CreatedAt,
		transaction.UpdatedAt,
	).Scan(
		&transaction.ID,
		&transaction.UserID,
		&transaction.Amount,
		&transaction.Type,
		&transaction.Category,
		&transaction.PaymentMethod,
		&transaction.Description,
		&transaction.IsRecurring,
		&transaction.CreatedAt,
		&transaction.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("error creating transaction: %w", err)
	}

	return transaction, nil
}

func (s *TransactionService) GetTransactionByID(id uuid.UUID, userID uuid.UUID) (*models.Transaction, error) {
	transaction := &models.Transaction{}
	query := `
		SELECT id, user_id, amount, type, category, payment_method, description, is_recurring, created_at, updated_at
		FROM transactions
		WHERE id = $1 AND user_id = $2
	`

	err := s.db.QueryRow(query, id, userID).Scan(
		&transaction.ID,
		&transaction.UserID,
		&transaction.Amount,
		&transaction.Type,
		&transaction.Category,
		&transaction.PaymentMethod,
		&transaction.Description,
		&transaction.IsRecurring,
		&transaction.CreatedAt,
		&transaction.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("transaction not found")
	}
	if err != nil {
		return nil, fmt.Errorf("error fetching transaction: %w", err)
	}

	return transaction, nil
}

func (s *TransactionService) GetTransactions(userID uuid.UUID, startDate, endDate time.Time) ([]models.Transaction, error) {
	query := `
		SELECT id, user_id, amount, type, category, payment_method, description, is_recurring, created_at, updated_at
		FROM transactions
		WHERE user_id = $1 AND created_at >= $2 AND created_at <= $3
		ORDER BY created_at DESC
	`

	rows, err := s.db.Query(query, userID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("error fetching transactions: %w", err)
	}
	defer rows.Close()

	var transactions []models.Transaction
	for rows.Next() {
		var t models.Transaction
		err := rows.Scan(
			&t.ID,
			&t.UserID,
			&t.Amount,
			&t.Type,
			&t.Category,
			&t.PaymentMethod,
			&t.Description,
			&t.IsRecurring,
			&t.CreatedAt,
			&t.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning transaction: %w", err)
		}
		transactions = append(transactions, t)
	}

	return transactions, nil
}

func (s *TransactionService) UpdateTransaction(id uuid.UUID, userID uuid.UUID, req models.UpdateTransactionRequest) (*models.Transaction, error) {
	query := `
		UPDATE transactions
		SET amount = COALESCE($1, amount),
		    type = COALESCE($2, type),
		    category = COALESCE($3, category),
		    payment_method = COALESCE($4, payment_method),
		    description = COALESCE($5, description),
		    is_recurring = COALESCE($6, is_recurring),
		    updated_at = $7
		WHERE id = $8 AND user_id = $9
		RETURNING id, user_id, amount, type, category, payment_method, description, is_recurring, created_at, updated_at
	`

	transaction := &models.Transaction{}
	err := s.db.QueryRow(
		query,
		req.Amount,
		req.Type,
		req.Category,
		req.PaymentMethod,
		req.Description,
		req.IsRecurring,
		time.Now(),
		id,
		userID,
	).Scan(
		&transaction.ID,
		&transaction.UserID,
		&transaction.Amount,
		&transaction.Type,
		&transaction.Category,
		&transaction.PaymentMethod,
		&transaction.Description,
		&transaction.IsRecurring,
		&transaction.CreatedAt,
		&transaction.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("transaction not found")
	}
	if err != nil {
		return nil, fmt.Errorf("error updating transaction: %w", err)
	}

	return transaction, nil
}

func (s *TransactionService) DeleteTransaction(id uuid.UUID, userID uuid.UUID) error {
	query := `DELETE FROM transactions WHERE id = $1 AND user_id = $2`
	result, err := s.db.Exec(query, id, userID)
	if err != nil {
		return fmt.Errorf("error deleting transaction: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error checking rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("transaction not found")
	}

	return nil
}

func (s *TransactionService) GetMonthlyAggregates(userID uuid.UUID, months int) ([]models.MonthlyAggregate, error) {
	query := `
		SELECT 
			TO_CHAR(created_at, 'YYYY-MM') as month,
			COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
			COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
			COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as net_balance
		FROM transactions
		WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '1 month' * $2
		GROUP BY TO_CHAR(created_at, 'YYYY-MM')
		ORDER BY month DESC
	`

	rows, err := s.db.Query(query, userID, months)
	if err != nil {
		return nil, fmt.Errorf("error fetching monthly aggregates: %w", err)
	}
	defer rows.Close()

	var aggregates []models.MonthlyAggregate
	for rows.Next() {
		var agg models.MonthlyAggregate
		err := rows.Scan(&agg.Month, &agg.TotalIncome, &agg.TotalExpense, &agg.NetBalance)
		if err != nil {
			return nil, fmt.Errorf("error scanning aggregate: %w", err)
		}
		aggregates = append(aggregates, agg)
	}

	return aggregates, nil
}

func (s *TransactionService) GetCategoryAggregates(userID uuid.UUID, startDate, endDate time.Time) ([]models.CategoryAggregate, error) {
	query := `
		SELECT 
			category,
			SUM(amount) as total_amount
		FROM transactions
		WHERE user_id = $1 AND type = 'expense' AND created_at >= $2 AND created_at <= $3
		GROUP BY category
		ORDER BY total_amount DESC
	`

	rows, err := s.db.Query(query, userID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("error fetching category aggregates: %w", err)
	}
	defer rows.Close()

	var aggregates []models.CategoryAggregate
	var totalExpense float64

	for rows.Next() {
		var agg models.CategoryAggregate
		err := rows.Scan(&agg.Category, &agg.TotalAmount)
		if err != nil {
			return nil, fmt.Errorf("error scanning category aggregate: %w", err)
		}
		totalExpense += agg.TotalAmount
		aggregates = append(aggregates, agg)
	}

	// Calculate percentages
	for i := range aggregates {
		if totalExpense > 0 {
			aggregates[i].Percentage = (aggregates[i].TotalAmount / totalExpense) * 100
		}
	}

	return aggregates, nil
}

func (s *TransactionService) GetDailySpending(userID uuid.UUID, startDate, endDate time.Time) ([]models.DailySpending, error) {
	query := `
		SELECT 
			TO_CHAR(created_at, 'YYYY-MM-DD') as date,
			COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as daily_total
		FROM transactions
		WHERE user_id = $1 AND created_at >= $2 AND created_at <= $3
		GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
		ORDER BY date ASC
	`

	rows, err := s.db.Query(query, userID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("error fetching daily spending: %w", err)
	}
	defer rows.Close()

	var dailySpending []models.DailySpending
	var cumulativeTotal float64

	for rows.Next() {
		var ds models.DailySpending
		err := rows.Scan(&ds.Date, &ds.DailyTotal)
		if err != nil {
			return nil, fmt.Errorf("error scanning daily spending: %w", err)
		}
		cumulativeTotal += ds.DailyTotal
		ds.CumulativeTotal = cumulativeTotal
		dailySpending = append(dailySpending, ds)
	}

	return dailySpending, nil
}

func parseTransactionDate(value string) (time.Time, error) {
	if parsedDate, err := time.Parse("2006-01-02", value); err == nil {
		return parsedDate, nil
	}

	if parsedDate, err := time.Parse(time.RFC3339, value); err == nil {
		return parsedDate, nil
	}

	return time.Time{}, fmt.Errorf("expected format YYYY-MM-DD or RFC3339")
}
