'use client';

import { useEffect, useState } from 'react';
import { financialApi } from '@/lib/api';
import { TrendingDown, TrendingUp } from 'lucide-react';

export default function BalanceWidget() {
  const [balance, setBalance] = useState<number>(0);
  const [percentageChange, setPercentageChange] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBalance = async () => {
      setLoading(true);
      try {
        // Fetch income (savings) and expenses (spendings) for all time
        const [income, expenses] = await Promise.all([
          financialApi.getSavingsSummary('year'),
          financialApi.getTotalSpendingsSummary('year')
        ]);
        
        console.log('Income data:', income);
        console.log('Expenses data:', expenses);
        
        // Calculate current balance as total income - total expenses
        const currentBalance = income.current_amount - expenses.current_amount;
        setBalance(currentBalance);
        
        // Calculate percentage change based on previous period
        if (income.chart_data.length > 1 && expenses.chart_data.length > 1) {
          const previousIncome = income.chart_data[income.chart_data.length - 2]?.amount || 0;
          const previousExpenses = expenses.chart_data[expenses.chart_data.length - 2]?.amount || 0;
          const previousBalance = previousIncome - previousExpenses;
          
          if (previousBalance !== 0) {
            const change = ((currentBalance - previousBalance) / Math.abs(previousBalance)) * 100;
            setPercentageChange(change);
          }
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBalance();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#1a1f2e] rounded-xl p-6 animate-pulse border border-gray-800">
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-700 rounded w-1/2 mb-6"></div>
        <div className="mx-auto h-48 w-48 rounded-full bg-gray-700"></div>
      </div>
    );
  }

  const isPositive = percentageChange >= 0;
  const balanceColor = balance >= 0 ? '#10b981' : '#ef4444';
  const gradientFrom = balance >= 0 ? '#059669' : '#dc2626';
  const gradientTo = balance >= 0 ? '#34d399' : '#f87171';

  return (
    <div className="bg-[#1a1f2e] rounded-xl p-6 border border-gray-800">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Balance
          </h3>
          <p className="text-3xl font-bold mt-2">
            ₹{balance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r="54"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="14"
              fill="none"
            />
            <circle
              cx="70"
              cy="70"
              r="54"
              stroke={balanceColor}
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={2 * Math.PI * 54}
              strokeDashoffset={2 * Math.PI * 54 * 0.25}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>

          <div className="absolute inset-6 rounded-full bg-[#111827] border border-white/5 flex flex-col items-center justify-center text-center px-4">
            <p className="text-2xl font-bold" style={{ color: balanceColor }}>
              {balance >= 0 ? 'Positive' : 'Negative'}
            </p>
            <p className="text-sm text-gray-300 mt-1">Balance</p>
            <p className="text-xs text-gray-500 mt-1">Income - Expenses</p>
          </div>
        </div>

        <div className="w-full mt-6 rounded-xl border border-gray-800 bg-[#151b28] p-4">
          <p className="text-xs uppercase tracking-wider text-gray-500 text-center">
            Current Balance
          </p>
          <p 
            className="text-2xl font-semibold mt-2 text-center"
            style={{ color: balanceColor }}
          >
            ₹{balance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}


