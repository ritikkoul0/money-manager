package services

import (
	"database/sql"
	"fmt"
	"moneymanager/internal/models"
	"time"
)

type BillService struct {
	db *sql.DB
}

func NewBillService(db *sql.DB) *BillService {
	return &BillService{db: db}
}

func (s *BillService) CreateBill(userID string, bill *models.Bill) (*models.Bill, error) {
	var newBill models.Bill

	err := s.db.QueryRow(`
		INSERT INTO bills (user_id, title, amount, category, due_date, recurrence, status, notes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
		RETURNING id, user_id, title, amount, category, due_date, recurrence, status, notes, created_at, updated_at
	`, userID, bill.Title, bill.Amount, bill.Category, bill.DueDate, bill.Recurrence, bill.Status, bill.Notes).Scan(
		&newBill.ID,
		&newBill.UserID,
		&newBill.Title,
		&newBill.Amount,
		&newBill.Category,
		&newBill.DueDate,
		&newBill.Recurrence,
		&newBill.Status,
		&newBill.Notes,
		&newBill.CreatedAt,
		&newBill.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("error creating bill: %w", err)
	}

	return &newBill, nil
}

func (s *BillService) GetBills(userID string) ([]models.Bill, error) {
	rows, err := s.db.Query(`
		SELECT id, user_id, title, amount, category, due_date, recurrence, status, notes, created_at, updated_at
		FROM bills
		WHERE user_id = $1
		AND status IN ('pending', 'overdue')
		ORDER BY due_date ASC, created_at DESC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("error fetching bills: %w", err)
	}
	defer rows.Close()

	var bills []models.Bill
	for rows.Next() {
		var bill models.Bill
		if err := rows.Scan(
			&bill.ID,
			&bill.UserID,
			&bill.Title,
			&bill.Amount,
			&bill.Category,
			&bill.DueDate,
			&bill.Recurrence,
			&bill.Status,
			&bill.Notes,
			&bill.CreatedAt,
			&bill.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("error scanning bill: %w", err)
		}
		bills = append(bills, bill)
	}

	return bills, nil
}

func (s *BillService) GetUpcomingBills(userID string, days int) ([]models.Bill, error) {
	rows, err := s.db.Query(`
		SELECT id, user_id, title, amount, category, due_date, recurrence, status, notes, created_at, updated_at
		FROM bills
		WHERE user_id = $1
		AND status IN ('pending', 'overdue')
		AND due_date <= CURRENT_DATE + $2 * INTERVAL '1 day'
		ORDER BY due_date ASC
	`, userID, days)
	if err != nil {
		return nil, fmt.Errorf("error fetching upcoming bills: %w", err)
	}
	defer rows.Close()

	var bills []models.Bill
	for rows.Next() {
		var bill models.Bill
		if err := rows.Scan(
			&bill.ID,
			&bill.UserID,
			&bill.Title,
			&bill.Amount,
			&bill.Category,
			&bill.DueDate,
			&bill.Recurrence,
			&bill.Status,
			&bill.Notes,
			&bill.CreatedAt,
			&bill.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("error scanning bill: %w", err)
		}
		bills = append(bills, bill)
	}

	return bills, nil
}

func (s *BillService) UpdateBill(userID string, billID string, bill *models.Bill) (*models.Bill, error) {
	var updatedBill models.Bill

	err := s.db.QueryRow(`
		UPDATE bills
		SET title = $1, amount = $2, category = $3, due_date = $4, recurrence = $5, status = $6, notes = $7, updated_at = NOW()
		WHERE id = $8 AND user_id = $9
		RETURNING id, user_id, title, amount, category, due_date, recurrence, status, notes, created_at, updated_at
	`, bill.Title, bill.Amount, bill.Category, bill.DueDate, bill.Recurrence, bill.Status, bill.Notes, billID, userID).Scan(
		&updatedBill.ID,
		&updatedBill.UserID,
		&updatedBill.Title,
		&updatedBill.Amount,
		&updatedBill.Category,
		&updatedBill.DueDate,
		&updatedBill.Recurrence,
		&updatedBill.Status,
		&updatedBill.Notes,
		&updatedBill.CreatedAt,
		&updatedBill.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("bill not found")
		}
		return nil, fmt.Errorf("error updating bill: %w", err)
	}

	return &updatedBill, nil
}

func (s *BillService) DeleteBill(userID string, billID string) error {
	result, err := s.db.Exec(`
		DELETE FROM bills
		WHERE id = $1 AND user_id = $2
	`, billID, userID)

	if err != nil {
		return fmt.Errorf("error deleting bill: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error checking rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("bill not found")
	}

	return nil
}

func (s *BillService) MarkBillAsPaid(userID string, billID string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("error starting transaction: %w", err)
	}
	defer tx.Rollback()

	var bill models.Bill
	err = tx.QueryRow(`
		SELECT id, user_id, title, amount, category, due_date, recurrence, status, notes, created_at, updated_at
		FROM bills
		WHERE id = $1 AND user_id = $2
	`, billID, userID).Scan(
		&bill.ID,
		&bill.UserID,
		&bill.Title,
		&bill.Amount,
		&bill.Category,
		&bill.DueDate,
		&bill.Recurrence,
		&bill.Status,
		&bill.Notes,
		&bill.CreatedAt,
		&bill.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("bill not found")
		}
		return fmt.Errorf("error fetching bill: %w", err)
	}

	paidAt := time.Now()

	if bill.Recurrence == "none" {
		_, err = tx.Exec(`
			UPDATE bills
			SET status = 'paid', updated_at = $1
			WHERE id = $2 AND user_id = $3
		`, paidAt, billID, userID)
		if err != nil {
			return fmt.Errorf("error marking bill as paid: %w", err)
		}
	} else {
		_, err = tx.Exec(`
			INSERT INTO bills (user_id, title, amount, category, due_date, recurrence, status, notes, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, 'paid', $7, $8, $8)
		`, userID, bill.Title, bill.Amount, bill.Category, bill.DueDate, bill.Recurrence, bill.Notes, paidAt)
		if err != nil {
			return fmt.Errorf("error creating completed payment record: %w", err)
		}

		nextDueDate := calculateNextDueDate(bill.DueDate, bill.Recurrence)

		_, err = tx.Exec(`
			UPDATE bills
			SET due_date = $1, status = 'pending', updated_at = $2
			WHERE id = $3 AND user_id = $4
		`, nextDueDate, paidAt, billID, userID)
		if err != nil {
			return fmt.Errorf("error updating recurring bill next due date: %w", err)
		}
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("error committing transaction: %w", err)
	}

	return nil
}

func calculateNextDueDate(currentDueDate time.Time, recurrence string) time.Time {
	switch recurrence {
	case "daily":
		return currentDueDate.AddDate(0, 0, 1)
	case "weekly":
		return currentDueDate.AddDate(0, 0, 7)
	case "monthly":
		return currentDueDate.AddDate(0, 1, 0)
	case "half-yearly":
		return currentDueDate.AddDate(0, 6, 0)
	case "yearly":
		return currentDueDate.AddDate(1, 0, 0)
	default:
		return currentDueDate
	}
}

func (s *BillService) GetPaidBills(userID string, limit int) ([]models.Bill, error) {
	rows, err := s.db.Query(`
		SELECT id, user_id, title, amount, category, due_date, recurrence, status, notes, created_at, updated_at
		FROM bills
		WHERE user_id = $1
		AND status = 'paid'
		ORDER BY updated_at DESC
		LIMIT $2
	`, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("error fetching paid bills: %w", err)
	}
	defer rows.Close()

	var bills []models.Bill
	for rows.Next() {
		var bill models.Bill
		if err := rows.Scan(
			&bill.ID,
			&bill.UserID,
			&bill.Title,
			&bill.Amount,
			&bill.Category,
			&bill.DueDate,
			&bill.Recurrence,
			&bill.Status,
			&bill.Notes,
			&bill.CreatedAt,
			&bill.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("error scanning bill: %w", err)
		}
		bills = append(bills, bill)
	}

	return bills, nil
}

// UpdateOverdueBills updates the status of bills that are past their due date
func (s *BillService) UpdateOverdueBills(userID string) error {
	_, err := s.db.Exec(`
		UPDATE bills
		SET status = 'overdue', updated_at = NOW()
		WHERE user_id = $1
		AND status = 'pending'
		AND due_date < CURRENT_DATE
	`, userID)

	if err != nil {
		return fmt.Errorf("error updating overdue bills: %w", err)
	}

	return nil
}
