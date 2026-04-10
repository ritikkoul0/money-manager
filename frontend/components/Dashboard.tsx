'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { analyticsApi, transactionApi, financialApi } from '@/lib/api';
import { Plus } from 'lucide-react';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import FinancialBarCard from './FinancialBarCard';
import BalanceWidget from './BalanceWidget';
import InvestmentDetailsWidget from './InvestmentDetailsWidget';
import BillNotifications from './BillNotifications';

export default function Dashboard() {
  const {
    setTransactions,
    setMonthlyAggregates,
    setCategoryAggregates,
    setDailySpending,
    availableBalance,
    totalNetWorth,
    currentMonthIncome,
    currentMonthExpense,
  } = useStore();

  const [showForm, setShowForm] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch all data
      const [transactions, monthly, categories, daily] = await Promise.all([
        transactionApi.getTransactions(),
        analyticsApi.getMonthlyAggregates(),
        analyticsApi.getCategoryAggregates(),
        analyticsApi.getDailySpending(),
      ]);

      setTransactions(transactions);
      setMonthlyAggregates(monthly);
      setCategoryAggregates(categories);
      setDailySpending(daily);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [setTransactions, setMonthlyAggregates, setCategoryAggregates, setDailySpending]);

  return (
    <div className="min-h-screen bg-[#0f1419] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Financial Bar Cards - Only Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <FinancialBarCard
            title="Total Spendings"
            fetchData={financialApi.getTotalSpendingsSummary}
            color="#a855f7"
            gradientFrom="#7c3aed"
            gradientTo="#a855f7"
          />
          <BalanceWidget />
          <FinancialBarCard
            title="Investments"
            fetchData={financialApi.getInvestmentsSummary}
            color="#10b981"
            gradientFrom="#059669"
            gradientTo="#34d399"
          />
        </div>

        {/* Transactions, Investment Entries, and Bill Notifications Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1a1f2e] rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Transactions</h3>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Transaction
              </button>
            </div>
            <TransactionList
              onRefresh={fetchData}
              limit={10}
              title="Recent Transactions"
            />
          </div>

          <InvestmentDetailsWidget />
          
          <BillNotifications />
        </div>

        {/* Transaction Form Modal */}
        {showForm && (
          <TransactionForm
            onClose={() => setShowForm(false)}
            onSuccess={fetchData}
          />
        )}
      </div>
    </div>
  );
}


