'use client';

import { useStore } from '@/lib/store';
import { Home, User, Car } from 'lucide-react';

const categoryIcons: Record<string, any> = {
  Housing: Home,
  Personal: User,
  Transportation: Car,
};

const categoryColors: Record<string, string> = {
  Housing: 'bg-purple-500',
  Personal: 'bg-pink-500',
  Transportation: 'bg-orange-500',
};

export default function CategoryBreakdown() {
  const { categoryAggregates } = useStore();

  return (
    <div className="bg-dark-card rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Spendings</h3>
      <div className="space-y-4">
        {categoryAggregates.slice(0, 3).map((category) => {
          const Icon = categoryIcons[category.category] || Home;
          const colorClass = categoryColors[category.category] || 'bg-gray-500';

          return (
            <div key={category.category} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`${colorClass} p-2 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">{category.category}</p>
                  <p className="text-2xl font-bold">₹{category.total_amount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


