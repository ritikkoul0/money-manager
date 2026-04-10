package services

import (
	"database/sql"
	"fmt"
	"moneymanager/internal/models"
	"time"
)

type FinancialService struct {
	db *sql.DB
}

func NewFinancialService(db *sql.DB) *FinancialService {
	return &FinancialService{db: db}
}

// Helper function to get time range parameters
func getTimeRangeParams(timeRange string) (int, string) {
	switch timeRange {
	case "day":
		return 7, "day"
	case "week":
		return 7, "week"
	case "month":
		return 12, "month"
	case "year":
		return 5, "year"
	default:
		return 7, "week"
	}
}

func (s *FinancialService) GetTotalSpendingsSummary(userID string, timeRange string) (*models.FinancialSummary, error) {
	var currentAmount float64
	var percentageChange float64
	var chartData []models.FinancialDataPoint
	var err error

	switch timeRange {
	case "day":
		// For day, show only today's spending (single bar)
		currentAmount, err = s.getTodaySpending(userID)
		if err != nil {
			return nil, err
		}

		// Get yesterday's spending for comparison
		var yesterdayAmount float64
		err = s.db.QueryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM transactions
			WHERE user_id = $1
			AND type = 'expense'
			AND DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
		`, userID).Scan(&yesterdayAmount)

		if err == nil && yesterdayAmount > 0 {
			percentageChange = ((currentAmount - yesterdayAmount) / yesterdayAmount) * 100
		}

		// Single data point for today
		chartData = []models.FinancialDataPoint{
			{Date: time.Now(), Amount: currentAmount},
		}

	case "week":
		// For week, aggregate by day for the last 7 days
		currentAmount, chartData, err = s.getWeeklySpending(userID)
		if err != nil {
			return nil, err
		}

		// Get previous week's total for comparison
		var previousWeekAmount float64
		err = s.db.QueryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM transactions
			WHERE user_id = $1
			AND type = 'expense'
			AND created_at >= CURRENT_DATE - INTERVAL '14 days'
			AND created_at < CURRENT_DATE - INTERVAL '7 days'
		`, userID).Scan(&previousWeekAmount)

		if err == nil && previousWeekAmount > 0 {
			percentageChange = ((currentAmount - previousWeekAmount) / previousWeekAmount) * 100
		}

	case "month":
		// For month, aggregate by week for the last 4 weeks
		currentAmount, chartData, err = s.getMonthlySpending(userID)
		if err != nil {
			return nil, err
		}

		// Get previous month's total for comparison
		var previousMonthAmount float64
		err = s.db.QueryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM transactions
			WHERE user_id = $1
			AND type = 'expense'
			AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
			AND created_at < DATE_TRUNC('month', CURRENT_DATE)
		`, userID).Scan(&previousMonthAmount)

		if err == nil && previousMonthAmount > 0 {
			percentageChange = ((currentAmount - previousMonthAmount) / previousMonthAmount) * 100
		}

	case "year":
		// For year, aggregate by month for the last 12 months
		currentAmount, chartData, err = s.getYearlySpending(userID)
		if err != nil {
			return nil, err
		}

		// Get previous year's total for comparison
		var previousYearAmount float64
		err = s.db.QueryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM transactions
			WHERE user_id = $1
			AND type = 'expense'
			AND created_at >= DATE_TRUNC('year', CURRENT_DATE - INTERVAL '1 year')
			AND created_at < DATE_TRUNC('year', CURRENT_DATE)
		`, userID).Scan(&previousYearAmount)

		if err == nil && previousYearAmount > 0 {
			percentageChange = ((currentAmount - previousYearAmount) / previousYearAmount) * 100
		}

	default:
		return nil, fmt.Errorf("invalid time range: %s", timeRange)
	}

	return &models.FinancialSummary{
		CurrentAmount:    currentAmount,
		PercentageChange: percentageChange,
		Period:           timeRange,
		ChartData:        chartData,
	}, nil
}

// Helper functions for aggregating spending data
func (s *FinancialService) getTodaySpending(userID string) (float64, error) {
	var amount float64
	err := s.db.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM transactions
		WHERE user_id = $1
		AND type = 'expense'
		AND DATE(created_at) = CURRENT_DATE
	`, userID).Scan(&amount)
	return amount, err
}

func (s *FinancialService) getWeeklySpending(userID string) (float64, []models.FinancialDataPoint, error) {
	rows, err := s.db.Query(`
		SELECT
			DATE(created_at) + TIME '00:00:00' as date,
			COALESCE(SUM(amount), 0) as amount
		FROM transactions
		WHERE user_id = $1
		AND type = 'expense'
		AND created_at >= CURRENT_DATE - INTERVAL '6 days'
		GROUP BY DATE(created_at)
		ORDER BY date ASC
	`, userID)
	if err != nil {
		return 0, nil, fmt.Errorf("error fetching weekly spending: %w", err)
	}
	defer rows.Close()

	var chartData []models.FinancialDataPoint
	var total float64
	for rows.Next() {
		var point models.FinancialDataPoint
		if err := rows.Scan(&point.Date, &point.Amount); err != nil {
			return 0, nil, fmt.Errorf("error scanning weekly data: %w", err)
		}
		chartData = append(chartData, point)
		total += point.Amount
	}

	return total, chartData, nil
}

func (s *FinancialService) getMonthlySpending(userID string) (float64, []models.FinancialDataPoint, error) {
	rows, err := s.db.Query(`
		WITH week_ranges AS (
			SELECT
				generate_series(
					DATE_TRUNC('month', CURRENT_DATE),
					DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day',
					INTERVAL '7 days'
				)::timestamp as week_start
		)
		SELECT
			wr.week_start as date,
			COALESCE(SUM(t.amount), 0) as amount
		FROM week_ranges wr
		LEFT JOIN transactions t ON
			t.user_id = $1
			AND t.type = 'expense'
			AND DATE(t.created_at) >= wr.week_start
			AND DATE(t.created_at) < wr.week_start + INTERVAL '7 days'
			AND t.created_at >= DATE_TRUNC('month', CURRENT_DATE)
			AND t.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
		GROUP BY wr.week_start
		ORDER BY wr.week_start ASC
	`, userID)
	if err != nil {
		return 0, nil, fmt.Errorf("error fetching monthly spending: %w", err)
	}
	defer rows.Close()

	var chartData []models.FinancialDataPoint
	var total float64
	for rows.Next() {
		var point models.FinancialDataPoint
		if err := rows.Scan(&point.Date, &point.Amount); err != nil {
			return 0, nil, fmt.Errorf("error scanning monthly data: %w", err)
		}
		chartData = append(chartData, point)
		total += point.Amount
	}

	return total, chartData, nil
}

func (s *FinancialService) getYearlySpending(userID string) (float64, []models.FinancialDataPoint, error) {
	rows, err := s.db.Query(`
		SELECT
			DATE_TRUNC('month', created_at) as date,
			COALESCE(SUM(amount), 0) as amount
		FROM transactions
		WHERE user_id = $1
		AND type = 'expense'
		AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')
		GROUP BY DATE_TRUNC('month', created_at)
		ORDER BY date ASC
	`, userID)
	if err != nil {
		return 0, nil, fmt.Errorf("error fetching yearly spending: %w", err)
	}
	defer rows.Close()

	var chartData []models.FinancialDataPoint
	var total float64
	for rows.Next() {
		var point models.FinancialDataPoint
		if err := rows.Scan(&point.Date, &point.Amount); err != nil {
			return 0, nil, fmt.Errorf("error scanning yearly data: %w", err)
		}
		chartData = append(chartData, point)
		total += point.Amount
	}

	return total, chartData, nil
}

func (s *FinancialService) GetSavingsSummary(userID string, timeRange string) (*models.FinancialSummary, error) {
	var currentAmount float64
	var percentageChange float64
	var chartData []models.FinancialDataPoint
	var err error

	switch timeRange {
	case "day":
		currentAmount, err = s.getTodaySavings(userID)
		if err != nil {
			return nil, err
		}

		var yesterdayAmount float64
		err = s.db.QueryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM transactions
			WHERE user_id = $1
			AND type = 'income'
			AND DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
		`, userID).Scan(&yesterdayAmount)

		if err == nil && yesterdayAmount > 0 {
			percentageChange = ((currentAmount - yesterdayAmount) / yesterdayAmount) * 100
		}

		chartData = []models.FinancialDataPoint{
			{Date: time.Now(), Amount: currentAmount},
		}

	case "week":
		currentAmount, chartData, err = s.getWeeklySavings(userID)
		if err != nil {
			return nil, err
		}

		var previousWeekAmount float64
		err = s.db.QueryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM transactions
			WHERE user_id = $1
			AND type = 'income'
			AND created_at >= CURRENT_DATE - INTERVAL '14 days'
			AND created_at < CURRENT_DATE - INTERVAL '7 days'
		`, userID).Scan(&previousWeekAmount)

		if err == nil && previousWeekAmount > 0 {
			percentageChange = ((currentAmount - previousWeekAmount) / previousWeekAmount) * 100
		}

	case "month":
		currentAmount, chartData, err = s.getMonthlySavings(userID)
		if err != nil {
			return nil, err
		}

		var previousMonthAmount float64
		err = s.db.QueryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM transactions
			WHERE user_id = $1
			AND type = 'income'
			AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
			AND created_at < DATE_TRUNC('month', CURRENT_DATE)
		`, userID).Scan(&previousMonthAmount)

		if err == nil && previousMonthAmount > 0 {
			percentageChange = ((currentAmount - previousMonthAmount) / previousMonthAmount) * 100
		}

	case "year":
		currentAmount, chartData, err = s.getYearlySavings(userID)
		if err != nil {
			return nil, err
		}

		var previousYearAmount float64
		err = s.db.QueryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM transactions
			WHERE user_id = $1
			AND type = 'income'
			AND created_at >= DATE_TRUNC('year', CURRENT_DATE - INTERVAL '1 year')
			AND created_at < DATE_TRUNC('year', CURRENT_DATE)
		`, userID).Scan(&previousYearAmount)

		if err == nil && previousYearAmount > 0 {
			percentageChange = ((currentAmount - previousYearAmount) / previousYearAmount) * 100
		}

	default:
		return nil, fmt.Errorf("invalid time range: %s", timeRange)
	}

	return &models.FinancialSummary{
		CurrentAmount:    currentAmount,
		PercentageChange: percentageChange,
		Period:           timeRange,
		ChartData:        chartData,
	}, nil
}

func (s *FinancialService) getTodaySavings(userID string) (float64, error) {
	var amount float64
	err := s.db.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM transactions
		WHERE user_id = $1
		AND type = 'income'
		AND DATE(created_at) = CURRENT_DATE
	`, userID).Scan(&amount)
	return amount, err
}

func (s *FinancialService) getWeeklySavings(userID string) (float64, []models.FinancialDataPoint, error) {
	rows, err := s.db.Query(`
		SELECT
			DATE(created_at) + TIME '00:00:00' as date,
			COALESCE(SUM(amount), 0) as amount
		FROM transactions
		WHERE user_id = $1
		AND type = 'income'
		AND created_at >= CURRENT_DATE - INTERVAL '6 days'
		GROUP BY DATE(created_at)
		ORDER BY date ASC
	`, userID)
	if err != nil {
		return 0, nil, fmt.Errorf("error fetching weekly savings: %w", err)
	}
	defer rows.Close()

	var chartData []models.FinancialDataPoint
	var total float64
	for rows.Next() {
		var point models.FinancialDataPoint
		if err := rows.Scan(&point.Date, &point.Amount); err != nil {
			return 0, nil, fmt.Errorf("error scanning weekly savings data: %w", err)
		}
		chartData = append(chartData, point)
		total += point.Amount
	}

	return total, chartData, nil
}

func (s *FinancialService) getMonthlySavings(userID string) (float64, []models.FinancialDataPoint, error) {
	rows, err := s.db.Query(`
		WITH week_ranges AS (
			SELECT
				generate_series(
					DATE_TRUNC('month', CURRENT_DATE),
					DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day',
					INTERVAL '7 days'
				)::timestamp as week_start
		)
		SELECT
			wr.week_start as date,
			COALESCE(SUM(t.amount), 0) as amount
		FROM week_ranges wr
		LEFT JOIN transactions t ON
			t.user_id = $1
			AND t.type = 'income'
			AND DATE(t.created_at) >= wr.week_start
			AND DATE(t.created_at) < wr.week_start + INTERVAL '7 days'
			AND t.created_at >= DATE_TRUNC('month', CURRENT_DATE)
			AND t.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
		GROUP BY wr.week_start
		ORDER BY wr.week_start ASC
	`, userID)
	if err != nil {
		return 0, nil, fmt.Errorf("error fetching monthly savings: %w", err)
	}
	defer rows.Close()

	var chartData []models.FinancialDataPoint
	var total float64
	for rows.Next() {
		var point models.FinancialDataPoint
		if err := rows.Scan(&point.Date, &point.Amount); err != nil {
			return 0, nil, fmt.Errorf("error scanning monthly savings data: %w", err)
		}
		chartData = append(chartData, point)
		total += point.Amount
	}

	return total, chartData, nil
}

func (s *FinancialService) getYearlySavings(userID string) (float64, []models.FinancialDataPoint, error) {
	rows, err := s.db.Query(`
		SELECT
			DATE_TRUNC('month', created_at) as date,
			COALESCE(SUM(amount), 0) as amount
		FROM transactions
		WHERE user_id = $1
		AND type = 'income'
		AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')
		GROUP BY DATE_TRUNC('month', created_at)
		ORDER BY date ASC
	`, userID)
	if err != nil {
		return 0, nil, fmt.Errorf("error fetching yearly savings: %w", err)
	}
	defer rows.Close()

	var chartData []models.FinancialDataPoint
	var total float64
	for rows.Next() {
		var point models.FinancialDataPoint
		if err := rows.Scan(&point.Date, &point.Amount); err != nil {
			return 0, nil, fmt.Errorf("error scanning yearly savings data: %w", err)
		}
		chartData = append(chartData, point)
		total += point.Amount
	}

	return total, chartData, nil
}

func (s *FinancialService) GetRecentInvestmentEntries(userID string, limit int) ([]models.InvestmentEntry, error) {
	rows, err := s.db.Query(`
		SELECT
			id,
			user_id,
			amount,
			description,
			COALESCE(investment_name, description, 'Investment') AS investment_name,
			COALESCE(quantity, 0) AS quantity,
			COALESCE(purchase_date, DATE(created_at)) AS purchase_date,
			COALESCE(notes, '') AS notes,
			created_at,
			updated_at
		FROM investments
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("error fetching recent investment entries: %w", err)
	}
	defer rows.Close()

	var entries []models.InvestmentEntry
	for rows.Next() {
		var entry models.InvestmentEntry
		if err := rows.Scan(
			&entry.ID,
			&entry.UserID,
			&entry.Amount,
			&entry.Description,
			&entry.InvestmentName,
			&entry.Quantity,
			&entry.PurchaseDate,
			&entry.Notes,
			&entry.CreatedAt,
			&entry.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("error scanning recent investment entry: %w", err)
		}
		entries = append(entries, entry)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating recent investment entries: %w", err)
	}

	return entries, nil
}

func (s *FinancialService) GetInvestmentsSummary(userID string, timeRange string) (*models.FinancialSummary, error) {
	var currentAmount float64
	var percentageChange float64
	var chartData []models.FinancialDataPoint

	switch timeRange {
	case "day":
		// Get today's total investment amount
		err := s.db.QueryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM investments
			WHERE user_id = $1
			AND DATE(created_at) = CURRENT_DATE
		`, userID).Scan(&currentAmount)

		if err != nil && err != sql.ErrNoRows {
			return nil, fmt.Errorf("error fetching current day investments: %w", err)
		}

		// Get yesterday's total for comparison
		var previousAmount float64
		err = s.db.QueryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM investments
			WHERE user_id = $1
			AND DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
		`, userID).Scan(&previousAmount)

		if err == nil && previousAmount > 0 {
			percentageChange = ((currentAmount - previousAmount) / previousAmount) * 100
		}

		chartData = []models.FinancialDataPoint{
			{Date: time.Now(), Amount: currentAmount},
		}

	case "week":
		// Get last 7 days of investment data (including today)
		rows, err := s.db.Query(`
			SELECT
				DATE(created_at) + TIME '00:00:00' as date,
				COALESCE(SUM(amount), 0) as amount
			FROM investments
			WHERE user_id = $1
			AND created_at >= CURRENT_DATE - INTERVAL '6 days'
			AND created_at < CURRENT_DATE + INTERVAL '1 day'
			GROUP BY DATE(created_at)
			ORDER BY date ASC
		`, userID)
		if err != nil {
			return nil, fmt.Errorf("error fetching weekly investments: %w", err)
		}
		defer rows.Close()

		for rows.Next() {
			var point models.FinancialDataPoint
			if err := rows.Scan(&point.Date, &point.Amount); err != nil {
				return nil, fmt.Errorf("error scanning weekly investments: %w", err)
			}
			chartData = append(chartData, point)
		}

		if len(chartData) > 0 {
			currentAmount = chartData[len(chartData)-1].Amount

			// Compare with the first day of the week
			if len(chartData) > 1 {
				previousAmount := chartData[0].Amount
				if previousAmount > 0 {
					percentageChange = ((currentAmount - previousAmount) / previousAmount) * 100
				}
			}
		}

	case "month":
		// Get current month's investment data aggregated by week
		rows, err := s.db.Query(`
			WITH week_ranges AS (
				SELECT
					generate_series(
						DATE_TRUNC('month', CURRENT_DATE),
						CURRENT_DATE,
						INTERVAL '7 days'
					)::date as week_start
			)
			SELECT
				wr.week_start + TIME '00:00:00' as date,
				COALESCE(SUM(i.amount), 0) as amount
			FROM week_ranges wr
			LEFT JOIN investments i ON
				i.user_id = $1
				AND DATE(i.created_at) >= wr.week_start
				AND DATE(i.created_at) < LEAST(wr.week_start + INTERVAL '7 days', CURRENT_DATE + INTERVAL '1 day')
			GROUP BY wr.week_start
			ORDER BY wr.week_start ASC
		`, userID)
		if err != nil {
			return nil, fmt.Errorf("error fetching monthly investments: %w", err)
		}
		defer rows.Close()

		for rows.Next() {
			var point models.FinancialDataPoint
			if err := rows.Scan(&point.Date, &point.Amount); err != nil {
				return nil, fmt.Errorf("error scanning monthly investments: %w", err)
			}
			chartData = append(chartData, point)
		}

		if len(chartData) > 0 {
			currentAmount = chartData[len(chartData)-1].Amount

			// Compare with previous month's total
			var previousMonthAmount float64
			err = s.db.QueryRow(`
				SELECT COALESCE(SUM(amount), 0)
				FROM investments
				WHERE user_id = $1
				AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
				AND created_at < DATE_TRUNC('month', CURRENT_DATE)
			`, userID).Scan(&previousMonthAmount)

			if err == nil && previousMonthAmount > 0 {
				percentageChange = ((currentAmount - previousMonthAmount) / previousMonthAmount) * 100
			}
		}

	case "year":
		// Get last 12 months of investment data
		rows, err := s.db.Query(`
			WITH month_ranges AS (
				SELECT
					generate_series(
						DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months'),
						DATE_TRUNC('month', CURRENT_DATE),
						INTERVAL '1 month'
					)::date as month_start
			)
			SELECT
				mr.month_start + TIME '00:00:00' as date,
				COALESCE(SUM(i.amount), 0) as amount
			FROM month_ranges mr
			LEFT JOIN investments i ON
				i.user_id = $1
				AND DATE_TRUNC('month', i.created_at) = mr.month_start
			GROUP BY mr.month_start
			ORDER BY mr.month_start ASC
		`, userID)
		if err != nil {
			return nil, fmt.Errorf("error fetching yearly investments: %w", err)
		}
		defer rows.Close()

		for rows.Next() {
			var point models.FinancialDataPoint
			if err := rows.Scan(&point.Date, &point.Amount); err != nil {
				return nil, fmt.Errorf("error scanning yearly investments: %w", err)
			}
			chartData = append(chartData, point)
		}

		if len(chartData) > 0 {
			currentAmount = chartData[len(chartData)-1].Amount

			// Compare with previous year's total
			var previousYearAmount float64
			err = s.db.QueryRow(`
				SELECT COALESCE(SUM(amount), 0)
				FROM investments
				WHERE user_id = $1
				AND created_at >= DATE_TRUNC('year', CURRENT_DATE - INTERVAL '1 year')
				AND created_at < DATE_TRUNC('year', CURRENT_DATE)
			`, userID).Scan(&previousYearAmount)

			if err == nil && previousYearAmount > 0 {
				percentageChange = ((currentAmount - previousYearAmount) / previousYearAmount) * 100
			}
		}
	}

	return &models.FinancialSummary{
		CurrentAmount:    currentAmount,
		PercentageChange: percentageChange,
		Period:           timeRange,
		ChartData:        chartData,
	}, nil
}

func (s *FinancialService) CreateInvestmentEntry(
	userID string,
	amount float64,
	description string,
	investmentName string,
	quantity float64,
	purchaseDate time.Time,
	notes string,
	createdAt time.Time,
) (*models.InvestmentEntry, error) {
	var entry models.InvestmentEntry

	err := s.db.QueryRow(`
		INSERT INTO investments (
			user_id,
			amount,
			description,
			investment_name,
			quantity,
			purchase_date,
			notes,
			created_at,
			updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
		RETURNING
			id,
			user_id,
			amount,
			description,
			COALESCE(investment_name, description, 'Investment') AS investment_name,
			COALESCE(quantity, 0) AS quantity,
			COALESCE(purchase_date, DATE(created_at)) AS purchase_date,
			COALESCE(notes, '') AS notes,
			created_at,
			updated_at
	`, userID, amount, description, investmentName, quantity, purchaseDate, notes, createdAt).Scan(
		&entry.ID,
		&entry.UserID,
		&entry.Amount,
		&entry.Description,
		&entry.InvestmentName,
		&entry.Quantity,
		&entry.PurchaseDate,
		&entry.Notes,
		&entry.CreatedAt,
		&entry.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("error creating investment entry: %w", err)
	}

	return &entry, nil
}

func (s *FinancialService) UpdateInvestmentEntry(
	userID string,
	entryID string,
	amount float64,
	description string,
	investmentName string,
	quantity float64,
	purchaseDate time.Time,
	notes string,
	createdAt time.Time,
) (*models.InvestmentEntry, error) {
	var entry models.InvestmentEntry

	err := s.db.QueryRow(`
		UPDATE investments
		SET
			amount = $1,
			description = $2,
			investment_name = $3,
			quantity = $4,
			purchase_date = $5,
			notes = $6,
			created_at = $7,
			updated_at = NOW()
		WHERE id = $8 AND user_id = $9
		RETURNING
			id,
			user_id,
			amount,
			description,
			COALESCE(investment_name, description, 'Investment') AS investment_name,
			COALESCE(quantity, 0) AS quantity,
			COALESCE(purchase_date, DATE(created_at)) AS purchase_date,
			COALESCE(notes, '') AS notes,
			created_at,
			updated_at
	`, amount, description, investmentName, quantity, purchaseDate, notes, createdAt, entryID, userID).Scan(
		&entry.ID,
		&entry.UserID,
		&entry.Amount,
		&entry.Description,
		&entry.InvestmentName,
		&entry.Quantity,
		&entry.PurchaseDate,
		&entry.Notes,
		&entry.CreatedAt,
		&entry.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("investment entry not found")
		}
		return nil, fmt.Errorf("error updating investment entry: %w", err)
	}

	return &entry, nil
}

func (s *FinancialService) DeleteInvestmentEntry(userID string, entryID string) error {
	result, err := s.db.Exec(`
		DELETE FROM investments
		WHERE id = $1 AND user_id = $2
	`, entryID, userID)

	if err != nil {
		return fmt.Errorf("error deleting investment entry: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error checking rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("investment entry not found")
	}

	return nil
}

func (s *FinancialService) GetGoals(userID string) ([]models.Goal, error) {
	rows, err := s.db.Query(`
		SELECT
			g.id,
			g.user_id,
			g.name,
			g.target_amount,
			g.status,
			g.color_from,
			g.color_to,
			g.created_at,
			g.updated_at
		FROM goals g
		WHERE g.user_id = $1
		ORDER BY g.created_at DESC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("error fetching goals: %w", err)
	}
	defer rows.Close()

	var goals []models.Goal
	for rows.Next() {
		var goal models.Goal
		if err := rows.Scan(
			&goal.ID,
			&goal.UserID,
			&goal.Name,
			&goal.TargetAmount,
			&goal.Status,
			&goal.ColorFrom,
			&goal.ColorTo,
			&goal.CreatedAt,
			&goal.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("error scanning goal: %w", err)
		}

		investments, err := s.getGoalInvestments(goal.ID)
		if err != nil {
			return nil, err
		}
		goal.Investments = investments

		goals = append(goals, goal)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating goals: %w", err)
	}

	return goals, nil
}

func (s *FinancialService) CreateGoal(
	userID string,
	name string,
	targetAmount float64,
	status string,
	colorFrom string,
	colorTo string,
) (*models.Goal, error) {
	var goal models.Goal

	err := s.db.QueryRow(`
		INSERT INTO goals (
			user_id,
			name,
			target_amount,
			status,
			color_from,
			color_to
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING
			id,
			user_id,
			name,
			target_amount,
			status,
			color_from,
			color_to,
			created_at,
			updated_at
	`, userID, name, targetAmount, status, colorFrom, colorTo).Scan(
		&goal.ID,
		&goal.UserID,
		&goal.Name,
		&goal.TargetAmount,
		&goal.Status,
		&goal.ColorFrom,
		&goal.ColorTo,
		&goal.CreatedAt,
		&goal.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("error creating goal: %w", err)
	}

	goal.Investments = []models.InvestmentEntry{}
	return &goal, nil
}

func (s *FinancialService) LinkInvestmentToGoal(userID string, goalID string, investmentID string) error {
	var goalExists bool
	if err := s.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM goals WHERE id = $1 AND user_id = $2
		)
	`, goalID, userID).Scan(&goalExists); err != nil {
		return fmt.Errorf("error checking goal: %w", err)
	}
	if !goalExists {
		return fmt.Errorf("goal not found")
	}

	var investmentExists bool
	if err := s.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM investments WHERE id = $1 AND user_id = $2
		)
	`, investmentID, userID).Scan(&investmentExists); err != nil {
		return fmt.Errorf("error checking investment: %w", err)
	}
	if !investmentExists {
		return fmt.Errorf("investment not found")
	}

	if _, err := s.db.Exec(`
		INSERT INTO goal_investments (goal_id, investment_id)
		VALUES ($1, $2)
	`, goalID, investmentID); err != nil {
		return fmt.Errorf("error linking investment to goal: %w", err)
	}

	return nil
}

func (s *FinancialService) UnlinkInvestmentFromGoal(userID string, goalID string, investmentID string) error {
	result, err := s.db.Exec(`
		DELETE FROM goal_investments gi
		USING goals g
		WHERE gi.goal_id = g.id
		AND gi.goal_id = $1
		AND gi.investment_id = $2
		AND g.user_id = $3
	`, goalID, investmentID, userID)
	if err != nil {
		return fmt.Errorf("error unlinking investment from goal: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error checking unlink rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("goal investment link not found")
	}

	return nil
}

func (s *FinancialService) getGoalInvestments(goalID string) ([]models.InvestmentEntry, error) {
	rows, err := s.db.Query(`
		SELECT
			i.id,
			i.user_id,
			i.amount,
			i.description,
			COALESCE(i.investment_name, i.description, 'Investment') AS investment_name,
			COALESCE(i.quantity, 0) AS quantity,
			COALESCE(i.purchase_date, DATE(i.created_at)) AS purchase_date,
			COALESCE(i.notes, '') AS notes,
			i.created_at,
			i.updated_at
		FROM goal_investments gi
		INNER JOIN investments i ON i.id = gi.investment_id
		WHERE gi.goal_id = $1
		ORDER BY gi.created_at DESC
	`, goalID)
	if err != nil {
		return nil, fmt.Errorf("error fetching goal investments: %w", err)
	}
	defer rows.Close()

	var investments []models.InvestmentEntry
	for rows.Next() {
		var investment models.InvestmentEntry
		if err := rows.Scan(
			&investment.ID,
			&investment.UserID,
			&investment.Amount,
			&investment.Description,
			&investment.InvestmentName,
			&investment.Quantity,
			&investment.PurchaseDate,
			&investment.Notes,
			&investment.CreatedAt,
			&investment.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("error scanning goal investment: %w", err)
		}
		investments = append(investments, investment)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating goal investments: %w", err)
	}

	return investments, nil
}

// Salary Entry Methods

func (s *FinancialService) GetSalaryEntries(userID string, limit int) ([]models.SalaryEntry, error) {
	query := `
		SELECT
			id,
			user_id,
			amount,
			company_name,
			payment_date,
			payment_type,
			COALESCE(notes, '') AS notes,
			created_at,
			updated_at
		FROM salary_entries
		WHERE user_id = $1
		ORDER BY payment_date DESC, created_at DESC
	`

	if limit > 0 {
		query += fmt.Sprintf(" LIMIT %d", limit)
	}

	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("error fetching salary entries: %w", err)
	}
	defer rows.Close()

	var entries []models.SalaryEntry
	for rows.Next() {
		var entry models.SalaryEntry
		if err := rows.Scan(
			&entry.ID,
			&entry.UserID,
			&entry.Amount,
			&entry.CompanyName,
			&entry.PaymentDate,
			&entry.PaymentType,
			&entry.Notes,
			&entry.CreatedAt,
			&entry.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("error scanning salary entry: %w", err)
		}
		entries = append(entries, entry)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating salary entries: %w", err)
	}

	return entries, nil
}

func (s *FinancialService) CreateSalaryEntry(userID string, amount float64, companyName string, paymentDate time.Time, paymentType string, notes string, createdAt time.Time) (*models.SalaryEntry, error) {
	var entry models.SalaryEntry

	err := s.db.QueryRow(`
		INSERT INTO salary_entries (user_id, amount, company_name, payment_date, payment_type, notes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
		RETURNING id, user_id, amount, company_name, payment_date, payment_type, notes, created_at, updated_at
	`, userID, amount, companyName, paymentDate, paymentType, notes, createdAt).Scan(
		&entry.ID,
		&entry.UserID,
		&entry.Amount,
		&entry.CompanyName,
		&entry.PaymentDate,
		&entry.PaymentType,
		&entry.Notes,
		&entry.CreatedAt,
		&entry.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("error creating salary entry: %w", err)
	}

	return &entry, nil
}

func (s *FinancialService) UpdateSalaryEntry(userID string, entryID string, amount float64, companyName string, paymentDate time.Time, paymentType string, notes string) (*models.SalaryEntry, error) {
	var entry models.SalaryEntry

	err := s.db.QueryRow(`
		UPDATE salary_entries
		SET amount = $1, company_name = $2, payment_date = $3, payment_type = $4, notes = $5, updated_at = CURRENT_TIMESTAMP
		WHERE id = $6 AND user_id = $7
		RETURNING id, user_id, amount, company_name, payment_date, payment_type, notes, created_at, updated_at
	`, amount, companyName, paymentDate, paymentType, notes, entryID, userID).Scan(
		&entry.ID,
		&entry.UserID,
		&entry.Amount,
		&entry.CompanyName,
		&entry.PaymentDate,
		&entry.PaymentType,
		&entry.Notes,
		&entry.CreatedAt,
		&entry.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("salary entry not found")
		}
		return nil, fmt.Errorf("error updating salary entry: %w", err)
	}

	return &entry, nil
}

func (s *FinancialService) DeleteSalaryEntry(userID string, entryID string) error {
	result, err := s.db.Exec(`
		DELETE FROM salary_entries
		WHERE id = $1 AND user_id = $2
	`, entryID, userID)

	if err != nil {
		return fmt.Errorf("error deleting salary entry: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error checking delete rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("salary entry not found")
	}

	return nil
}

func (s *FinancialService) GetSalaryStats(userID string) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Get total salary received
	var totalSalary float64
	err := s.db.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM salary_entries
		WHERE user_id = $1
	`, userID).Scan(&totalSalary)
	if err != nil {
		return nil, fmt.Errorf("error fetching total salary: %w", err)
	}
	stats["total_salary"] = totalSalary

	// Get current month salary
	var currentMonthSalary float64
	err = s.db.QueryRow(`
		SELECT COALESCE(SUM(amount), 0)
		FROM salary_entries
		WHERE user_id = $1
		AND DATE_TRUNC('month', payment_date) = DATE_TRUNC('month', CURRENT_DATE)
	`, userID).Scan(&currentMonthSalary)
	if err != nil {
		return nil, fmt.Errorf("error fetching current month salary: %w", err)
	}
	stats["current_month_salary"] = currentMonthSalary

	// Get last 6 months salary data
	rows, err := s.db.Query(`
		SELECT
			TO_CHAR(payment_date, 'Mon YYYY') AS month,
			SUM(amount) AS total
		FROM salary_entries
		WHERE user_id = $1
		AND payment_date >= CURRENT_DATE - INTERVAL '6 months'
		GROUP BY DATE_TRUNC('month', payment_date), TO_CHAR(payment_date, 'Mon YYYY')
		ORDER BY DATE_TRUNC('month', payment_date) DESC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("error fetching monthly salary data: %w", err)
	}
	defer rows.Close()

	var monthlyData []map[string]interface{}
	for rows.Next() {
		var month string
		var total float64
		if err := rows.Scan(&month, &total); err != nil {
			return nil, fmt.Errorf("error scanning monthly salary data: %w", err)
		}
		monthlyData = append(monthlyData, map[string]interface{}{
			"month": month,
			"total": total,
		})
	}
	stats["monthly_data"] = monthlyData

	// Get entry count
	var entryCount int
	err = s.db.QueryRow(`
		SELECT COUNT(*)
		FROM salary_entries
		WHERE user_id = $1
	`, userID).Scan(&entryCount)
	if err != nil {
		return nil, fmt.Errorf("error fetching entry count: %w", err)
	}
	stats["entry_count"] = entryCount

	return stats, nil
}
