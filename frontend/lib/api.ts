import axios from 'axios';
import { getSession } from 'next-auth/react';
import { Transaction, MonthlyAggregate, CategoryAggregate, DailySpending, FinancialSummary, InvestmentEntry, Goal, Bill, SalaryEntry } from './store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cache for user ID and session to avoid repeated fetches
let cachedUserId: string | null = null;
let cachedSession: any = null;
let sessionFetchPromise: Promise<any> | null = null;
let userIdFetchPromise: Promise<string | null> | null = null;

// Function to get session with caching
async function getCachedSession() {
  if (cachedSession) {
    return cachedSession;
  }
  
  // If a fetch is already in progress, wait for it
  if (sessionFetchPromise) {
    return sessionFetchPromise;
  }
  
  // Start a new fetch
  sessionFetchPromise = getSession().then(session => {
    cachedSession = session;
    sessionFetchPromise = null;
    return session;
  });
  
  return sessionFetchPromise;
}

// Function to get user ID with caching
async function getCachedUserId(session: any): Promise<string | null> {
  // If already cached, return immediately
  if (cachedUserId) {
    return cachedUserId;
  }
  
  // Check if backendId is in session
  if ((session.user as any).backendId) {
    cachedUserId = (session.user as any).backendId;
    return cachedUserId;
  }
  
  // If a fetch is already in progress, wait for it
  if (userIdFetchPromise) {
    return userIdFetchPromise;
  }
  
  // Start a new fetch
  userIdFetchPromise = (async () => {
    try {
      const googleId = (session.user as any).googleId;
      
      if (!googleId) {
        return null;
      }
      
      // Try to fetch existing user
      let response = await fetch(
        `${API_BASE_URL}/users/by-google-id/${googleId}`
      );
      
      // If user doesn't exist, create them
      if (!response.ok && response.status === 404) {
        console.log('User not found, creating new user...');
        response = await fetch(`${API_BASE_URL}/users/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: session.user.email,
            name: session.user.name,
            google_id: googleId,
            picture: session.user.image,
            auth_provider: 'google',
          }),
        });
      }
      
      if (response.ok) {
        const userData = await response.json();
        cachedUserId = userData.id;
        console.log('User ID obtained:', cachedUserId);
        return cachedUserId;
      } else {
        console.error('Failed to get/create user, status:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch/create user:', error);
      return null;
    } finally {
      userIdFetchPromise = null;
    }
  })();
  
  return userIdFetchPromise;
}

// Add request interceptor to include user ID in headers
api.interceptors.request.use(
  async (config) => {
    // Use cached session instead of fetching every time
    const session = await getCachedSession();
    
    if (session?.user) {
      // Get user ID with caching (only fetches once)
      const userId = await getCachedUserId(session);
      
      if (userId) {
        config.headers['X-User-ID'] = userId;
      } else {
        console.error('No user ID available, request will fail');
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Clear cache when user logs out
export function clearAuthCache() {
  cachedUserId = null;
  cachedSession = null;
  sessionFetchPromise = null;
  userIdFetchPromise = null;
}

export const transactionApi = {
  // Get all transactions
  getTransactions: async (startDate?: string, endDate?: string): Promise<Transaction[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await api.get(`/transactions?${params.toString()}`);
    return response.data;
  },

  // Get single transaction
  getTransaction: async (id: string): Promise<Transaction> => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  // Create transaction
  createTransaction: async (data: {
    amount: number;
    type: 'income' | 'expense';
    category: string;
    payment_method?: string;
    description?: string;
    is_recurring?: boolean;
    date?: string;
  }): Promise<Transaction> => {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  // Update transaction
  updateTransaction: async (id: string, data: Partial<Transaction>): Promise<Transaction> => {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },

  // Delete transaction
  deleteTransaction: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },
};

export const analyticsApi = {
  // Get monthly aggregates
  getMonthlyAggregates: async (): Promise<MonthlyAggregate[]> => {
    const response = await api.get('/analytics/monthly');
    return response.data;
  },

  // Get category aggregates
  getCategoryAggregates: async (): Promise<CategoryAggregate[]> => {
    const response = await api.get('/analytics/categories');
    return response.data;
  },

  // Get daily spending
  getDailySpending: async (): Promise<DailySpending[]> => {
    const response = await api.get('/analytics/daily');
    return response.data;
  },
};

export const financialApi = {
  // Get total spendings summary
  getTotalSpendingsSummary: async (timeRange?: string): Promise<FinancialSummary> => {
    const params = timeRange ? `?range=${timeRange}` : '';
    const response = await api.get(`/financial/spendings${params}`);
    return response.data;
  },

  // Get savings summary
  getSavingsSummary: async (timeRange?: string): Promise<FinancialSummary> => {
    const params = timeRange ? `?range=${timeRange}` : '';
    const response = await api.get(`/financial/savings${params}`);
    return response.data;
  },

  // Get balance summary (Savings - Spendings)
  getBalanceSummary: async (timeRange?: string): Promise<FinancialSummary> => {
    const params = timeRange ? `?range=${timeRange}` : '';
    const [savings, spendings] = await Promise.all([
      api.get(`/financial/savings${params}`),
      api.get(`/financial/spendings${params}`)
    ]);
    
    const savingsData = savings.data;
    const spendingsData = spendings.data;
    
    // Calculate balance for each data point
    const balanceChartData = savingsData.chart_data.map((savingsPoint: FinancialDataPoint, index: number) => {
      const spendingsPoint = spendingsData.chart_data[index];
      return {
        date: savingsPoint.date,
        amount: savingsPoint.amount - (spendingsPoint?.amount || 0)
      };
    });
    
    // Calculate current balance
    const currentBalance = savingsData.current_amount - spendingsData.current_amount;
    
    // Calculate percentage change for balance
    const previousBalance = savingsData.chart_data.length > 1
      ? (savingsData.chart_data[savingsData.chart_data.length - 2].amount -
         (spendingsData.chart_data[spendingsData.chart_data.length - 2]?.amount || 0))
      : currentBalance;
    
    const percentageChange = previousBalance !== 0
      ? ((currentBalance - previousBalance) / Math.abs(previousBalance)) * 100
      : 0;
    
    return {
      current_amount: currentBalance,
      percentage_change: percentageChange,
      period: savingsData.period,
      chart_data: balanceChartData
    };
  },

  // Get investments summary
  getInvestmentsSummary: async (timeRange?: string): Promise<FinancialSummary> => {
    const params = timeRange ? `?range=${timeRange}` : '';
    const response = await api.get(`/financial/investments${params}`);
    return response.data;
  },

  // Get recent investment entries
  getRecentInvestmentEntries: async (): Promise<InvestmentEntry[]> => {
    const response = await api.get('/financial/investments/recent');
    return response.data;
  },

  // Create investment entry
  createInvestmentEntry: async (data: {
    amount: number;
    description?: string;
    investment_name: string;
    quantity: number;
    purchase_date: string;
    notes?: string;
    date?: string;
  }): Promise<InvestmentEntry> => {
    const response = await api.post('/financial/investments', data);
    return response.data;
  },

  // Update investment entry
  updateInvestmentEntry: async (id: string, data: {
    amount: number;
    description?: string;
    investment_name: string;
    quantity: number;
    purchase_date: string;
    notes?: string;
    date?: string;
  }): Promise<InvestmentEntry> => {
    const response = await api.put(`/financial/investments/${id}`, data);
    return response.data;
  },

  // Delete investment entry
  deleteInvestmentEntry: async (id: string): Promise<void> => {
    await api.delete(`/financial/investments/${id}`);
  },

  // Get goals
  getGoals: async (): Promise<Goal[]> => {
    const response = await api.get('/financial/goals');
    return response.data;
  },

  // Create goal
  createGoal: async (data: {
    name: string;
    target_amount: number;
    status: string;
    color_from: string;
    color_to: string;
  }): Promise<Goal> => {
    const response = await api.post('/financial/goals', data);
    return response.data;
  },

  // Link investment to goal
  linkInvestmentToGoal: async (goalId: string, investment_id: string): Promise<void> => {
    await api.post(`/financial/goals/${goalId}/investments`, { investment_id });
  },

  // Unlink investment from goal
  unlinkInvestmentFromGoal: async (goalId: string, investmentId: string): Promise<void> => {
    await api.delete(`/financial/goals/${goalId}/investments/${investmentId}`);
  },

  // Get salary entries
  getSalaryEntries: async (): Promise<SalaryEntry[]> => {
    const response = await api.get('/financial/salary');
    return response.data;
  },

  // Create salary entry
  createSalaryEntry: async (data: {
    amount: number;
    company_name: string;
    payment_date: string;
    payment_type: string;
    notes?: string;
    date?: string;
  }): Promise<SalaryEntry> => {
    const response = await api.post('/financial/salary', data);
    return response.data;
  },

  // Update salary entry
  updateSalaryEntry: async (id: string, data: {
    amount: number;
    company_name: string;
    payment_date: string;
    payment_type: string;
    notes?: string;
  }): Promise<SalaryEntry> => {
    const response = await api.put(`/financial/salary/${id}`, data);
    return response.data;
  },

  // Delete salary entry
  deleteSalaryEntry: async (id: string): Promise<void> => {
    await api.delete(`/financial/salary/${id}`);
  },

  // Get salary stats
  getSalaryStats: async (): Promise<any> => {
    const response = await api.get('/financial/salary/stats');
    return response.data;
  },
};

export const billApi = {
  // Get all bills
  getBills: async (): Promise<Bill[]> => {
    const response = await api.get('/bills');
    return response.data;
  },

  // Get upcoming bills
  getUpcomingBills: async (days: number = 7): Promise<Bill[]> => {
    const response = await api.get(`/bills/upcoming?days=${days}`);
    return response.data;
  },

  // Create bill
  createBill: async (data: {
    title: string;
    amount: number;
    category: string;
    due_date: string;
    recurrence?: string;
    status?: string;
    notes?: string;
  }): Promise<Bill> => {
    const response = await api.post('/bills', data);
    return response.data;
  },

  // Update bill
  updateBill: async (id: string, data: Partial<Bill>): Promise<Bill> => {
    const response = await api.put(`/bills/${id}`, data);
    return response.data;
  },

  // Delete bill
  deleteBill: async (id: string): Promise<void> => {
    await api.delete(`/bills/${id}`);
  },

  // Mark bill as paid
  markBillAsPaid: async (id: string): Promise<void> => {
    await api.patch(`/bills/${id}/pay`);
  },

  // Get paid bills
  getPaidBills: async (limit: number = 10): Promise<Bill[]> => {
    const response = await api.get(`/bills/paid?limit=${limit}`);
    return response.data;
  },
};

export default api;


