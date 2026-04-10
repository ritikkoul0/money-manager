'use client';

import { useStore } from '@/lib/store';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function IncomeExpenseChart() {
  const { monthlyAggregates } = useStore();

  const data = monthlyAggregates.map((item) => ({
    month: item.month.split('-')[1],
    income: item.total_income,
    expense: item.total_expense,
  })).reverse();

  const maxExpense = Math.max(...data.map(d => d.expense));
  const maxIncome = Math.max(...data.map(d => d.income));

  return (
    <div className="bg-dark-card rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Income & Expenses</h3>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-red-400">₹{maxExpense.toLocaleString()}</span>
            <span className="text-gray-400">Max. Expenses</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary-cyan">₹{maxIncome.toLocaleString()}</span>
            <span className="text-gray-400">Max. Income</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1f2e',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="expense"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444' }}
          />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#14b8a6"
            strokeWidth={2}
            dot={{ fill: '#14b8a6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


