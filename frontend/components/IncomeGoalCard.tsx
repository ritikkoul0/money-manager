'use client';

import { useStore } from '@/lib/store';

export default function IncomeGoalCard() {
  const { currentMonthIncome, currentMonthExpense } = useStore();
  
  const goal = 39276;
  const progress = (currentMonthIncome / goal) * 100;
  const progressColor = progress >= 80 ? 'bg-red-500' : 'bg-primary-purple';

  return (
    <div className="bg-dark-card rounded-xl p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-3xl font-bold text-primary-cyan">{Math.round(progress)}%</p>
          <p className="text-sm text-gray-400 mt-1">Income Goal</p>
          <p className="text-xs text-gray-500">Progress to month</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">₹{currentMonthIncome.toLocaleString()}</p>
          <p className="text-sm text-gray-400">/ ₹{goal.toLocaleString()}</p>
        </div>
      </div>
      <div className="w-full bg-dark-hover rounded-full h-3 overflow-hidden">
        <div
          className={`${progressColor} h-full rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}


