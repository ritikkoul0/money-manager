'use client';

import { useEffect } from 'react';
import TransactionList from '@/components/TransactionList';
import { analyticsApi, transactionApi } from '@/lib/api';
import { useStore } from '@/lib/store';

export default function TransactionsPage() {
  const {
    setTransactions,
    setMonthlyAggregates,
    setCategoryAggregates,
    setDailySpending,
  } = useStore();

  const fetchData = async () => {
    try {
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
      console.error('Error fetching transactions data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [setTransactions, setMonthlyAggregates, setCategoryAggregates, setDailySpending]);

  return (
    <div className="min-h-screen bg-[#0f1419] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-gray-400 mt-2">View and manage all your transactions</p>
        </div>

        <div className="bg-[#1a1f2e] rounded-xl p-6 border border-gray-800">
          <TransactionList
            onRefresh={fetchData}
            title="All Transactions"
            showFilters
          />
        </div>
      </div>
    </div>
  );
}

