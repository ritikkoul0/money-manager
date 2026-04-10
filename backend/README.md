# Money Manager Backend

Go backend API for the Money Manager application.

## Prerequisites

- Go 1.25 or higher
- PostgreSQL 12 or higher

## Setup

1. Install dependencies:
```bash
go mod download
```

2. Create a PostgreSQL database:
```bash
createdb moneymanager
```

3. Copy the environment file and configure:
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials.

## Running the Application

```bash
go run cmd/api/main.go
```

The server will start on `http://localhost:8080`

## API Endpoints

### Transactions
- `POST /api/v1/transactions` - Create a new transaction
- `GET /api/v1/transactions` - Get all transactions (with date filters)
- `GET /api/v1/transactions/:id` - Get a specific transaction
- `PUT /api/v1/transactions/:id` - Update a transaction
- `DELETE /api/v1/transactions/:id` - Delete a transaction

### Analytics
- `GET /api/v1/analytics/monthly` - Get monthly income/expense aggregates
- `GET /api/v1/analytics/categories` - Get spending by category
- `GET /api/v1/analytics/daily` - Get daily spending trend

## Database Schema

The application automatically creates the following tables:
- `users` - User information
- `transactions` - Income and expense records
- `user_preferences` - User settings and preferences