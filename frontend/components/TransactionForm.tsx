'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { transactionApi } from '@/lib/api';
import { X, Plus } from 'lucide-react';

interface TransactionFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransactionForm({ onClose, onSuccess }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    payment_method: '',
    description: '',
    is_recurring: false,
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = {
    income: ['Salary', 'My Shop', 'E-commerce', 'Google Adsense', 'Freelance', 'Other'],
    expense: ['Housing', 'Personal', 'Transportation', 'Food', 'Shopping', 'Rent', 'Utilities', 'Entertainment', 'Other'],
  };

  const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Online', 'Other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        setLoading(false);
        return;
      }

      await transactionApi.createTransaction({
        amount,
        type: formData.type,
        category: formData.category,
        payment_method: formData.payment_method,
        description: formData.description,
        is_recurring: formData.is_recurring,
        date: formData.date,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Add Transaction</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                className={`p-3 rounded-lg font-medium transition-colors ${
                  formData.type === 'income'
                    ? 'bg-primary-cyan text-white'
                    : 'bg-dark-hover text-gray-400'
                }`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                className={`p-3 rounded-lg font-medium transition-colors ${
                  formData.type === 'expense'
                    ? 'bg-primary-pink text-white'
                    : 'bg-dark-hover text-gray-400'
                }`}
              >
                Expense
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full bg-dark-hover border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-primary-cyan"
              placeholder="0.00"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-dark-hover border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-primary-cyan"
            >
              <option value="">Select category</option>
              {categories[formData.type].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full bg-dark-hover border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-primary-cyan"
            >
              <option value="">Select payment method</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-dark-hover border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-primary-cyan"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-dark-hover border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-primary-cyan"
              rows={3}
              placeholder="Add notes..."
            />
          </div>

          {/* Recurring */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              checked={formData.is_recurring}
              onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
              className="w-4 h-4 rounded border-gray-700 bg-dark-hover focus:ring-primary-cyan"
            />
            <label htmlFor="recurring" className="text-sm">
              Recurring transaction
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-primary text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}


