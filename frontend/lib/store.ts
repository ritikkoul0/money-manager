import { create } from 'zustand';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  payment_method: string;
  description: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonthlyAggregate {
  month: string;
  total_income: number;
  total_expense: number;
  net_balance: number;
}

export interface CategoryAggregate {
  category: string;
  total_amount: number;
  percentage: number;
}

export interface DailySpending {
  date: string;
  daily_total: number;
  cumulative_total: number;
}

export interface FinancialDataPoint {
  date: string;
  amount: number;
}

export interface FinancialSummary {
  current_amount: number;
  percentage_change: number;
  period: string;
  chart_data: FinancialDataPoint[];
}

export interface InvestmentEntry {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  investment_name: string;
  quantity: number;
  purchase_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  status: string;
  color_from: string;
  color_to: string;
  created_at: string;
  updated_at: string;
  investments: InvestmentEntry[];
}

export interface Bill {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  due_date: string;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'half-yearly' | 'yearly';
  status: 'pending' | 'paid' | 'overdue';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SalaryEntry {
  id: string;
  user_id: string;
  amount: number;
  company_name: string;
  payment_date: string;
  payment_type: 'monthly' | 'bi-weekly' | 'weekly' | 'one-time';
  notes: string;
  created_at: string;
  updated_at: string;
}

interface AppState {
  transactions: Transaction[];
  monthlyAggregates: MonthlyAggregate[];
  categoryAggregates: CategoryAggregate[];
  dailySpending: DailySpending[];
  availableBalance: number;
  totalNetWorth: number;
  currentMonthIncome: number;
  currentMonthExpense: number;
  budgetAlert: number;
  setTransactions: (transactions: Transaction[]) => void;
  setMonthlyAggregates: (aggregates: MonthlyAggregate[]) => void;
  setCategoryAggregates: (aggregates: CategoryAggregate[]) => void;
  setDailySpending: (spending: DailySpending[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  transactions: [],
  monthlyAggregates: [],
  categoryAggregates: [],
  dailySpending: [],
  availableBalance: 0,
  totalNetWorth: 0,
  currentMonthIncome: 0,
  currentMonthExpense: 0,
  budgetAlert: 0.8,
  
  setTransactions: (transactions) => set({ transactions }),
  
  setMonthlyAggregates: (aggregates) => {
    const currentMonth = aggregates[0];
    set({
      monthlyAggregates: aggregates,
      currentMonthIncome: currentMonth?.total_income || 0,
      currentMonthExpense: currentMonth?.total_expense || 0,
      availableBalance: currentMonth?.net_balance || 0,
    });
  },
  
  setCategoryAggregates: (aggregates) => set({ categoryAggregates: aggregates }),
  
  setDailySpending: (spending) => set({ dailySpending: spending }),
  
  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    })),
  
  updateTransaction: (id, updatedTransaction) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...updatedTransaction } : t
      ),
    })),
  
  deleteTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    })),
}));


