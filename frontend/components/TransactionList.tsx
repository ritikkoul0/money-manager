'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { transactionApi } from '@/lib/api';
import { Trash2, Edit, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

interface TransactionListProps {
  onRefresh: () => void;
  title?: string;
  limit?: number;
  showFilters?: boolean;
}

export default function TransactionList({
  onRefresh,
  title = 'Recent Transactions',
  limit,
  showFilters = false,
}: TransactionListProps) {
  const { transactions } = useStore();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    setDeleting(id);
    try {
      await transactionApi.deleteTransaction(id);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      alert('Failed to delete transaction');
    } finally {
      setDeleting(null);
    }
  };

  const sortedTransactions = transactions ? [...transactions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ) : [];

  const availableCategories = useMemo(() => {
    return transactions ? [...new Set(transactions.map((transaction) => transaction.category))].sort() : [];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return sortedTransactions.filter((transaction) => {
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
      const normalizedSearchTerm = searchTerm.trim().toLowerCase();
      const matchesSearch =
        normalizedSearchTerm === '' ||
        transaction.category.toLowerCase().includes(normalizedSearchTerm) ||
        transaction.description.toLowerCase().includes(normalizedSearchTerm) ||
        transaction.payment_method.toLowerCase().includes(normalizedSearchTerm);

      return matchesType && matchesCategory && matchesSearch;
    });
  }, [sortedTransactions, typeFilter, categoryFilter, searchTerm]);

  const displayedTransactions = typeof limit === 'number'
    ? filteredTransactions.slice(0, limit)
    : filteredTransactions;

  return (
    <div className="bg-dark-card rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4">{title}</h3>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search description, category, payment..."
            className="w-full bg-dark-hover border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-primary-cyan"
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'income' | 'expense')}
            className="w-full bg-dark-hover border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-primary-cyan"
          >
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-dark-hover border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-primary-cyan"
          >
            <option value="all">All categories</option>
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {displayedTransactions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No transactions found</p>
          <p className="text-sm mt-2">
            {showFilters ? 'Try changing or clearing your filters' : 'Click the + button to add your first transaction'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {displayedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-dark-hover rounded-lg hover:bg-dark-hover/80 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`p-2 rounded-lg ${
                    transaction.type === 'income'
                      ? 'bg-primary-cyan/20'
                      : 'bg-primary-pink/20'
                  }`}
                >
                  {transaction.type === 'income' ? (
                    <TrendingUp className="w-5 h-5 text-primary-cyan" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-primary-pink" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{transaction.category}</p>
                    {transaction.is_recurring && (
                      <span className="text-xs bg-primary-purple/20 text-primary-purple px-2 py-0.5 rounded">
                        Recurring
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {transaction.description || transaction.payment_method}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <p
                  className={`text-lg font-bold ${
                    transaction.type === 'income'
                      ? 'text-primary-cyan'
                      : 'text-primary-pink'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}₹
                  {transaction.amount.toLocaleString()}
                </p>
                
                <button
                  onClick={() => handleDelete(transaction.id)}
                  disabled={deleting === transaction.id}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete transaction"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


