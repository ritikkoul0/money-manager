'use client';

import { useStore } from '@/lib/store';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SpendingTrendChart() {
  const { dailySpending } = useStore();

  const data = dailySpending.map((item) => ({
    date: new Date(item.date).getDate(),
    amount: item.cumulative_total,
  }));

  return (
    <div className="bg-dark-card rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Spendings</h3>
      <p className="text-2xl font-bold mb-4">
        ₹{dailySpending[dailySpending.length - 1]?.cumulative_total.toLocaleString() || '0'}
      </p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1f2e',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#ec4899"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


