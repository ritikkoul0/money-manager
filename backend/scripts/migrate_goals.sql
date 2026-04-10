-- Goals Feature Migration
-- Creates tables for the goals feature if they don't already exist

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL CHECK (target_amount > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Planned',
    color_from VARCHAR(20) NOT NULL,
    color_to VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goal investments junction table
CREATE TABLE IF NOT EXISTS goal_investments (
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (goal_id, investment_id),
    UNIQUE (investment_id)
);

-- Create indexes for goals
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_investments_goal_id ON goal_investments(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_investments_investment_id ON goal_investments(investment_id);

INSERT INTO users (email, name, currency) 
VALUES ('user@example.com', 'John Doe', 'INR')
RETURNING id;
